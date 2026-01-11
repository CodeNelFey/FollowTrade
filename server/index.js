require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
// Initialisation de Stripe avec la clé secrète
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || "super_secret_cle";

// ==================================================================
// 1. WEBHOOK STRIPE (DOIT ÊTRE PLACÉ AVANT express.json())
// ==================================================================
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestion des événements Stripe
    switch (event.type) {
        // --- CAS 1 : PAIEMENT RÉUSSI (ACTIVATION) ---
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const planType = session.metadata.planType;

            console.log(`💰 Webhook Paiement Reçu : User ${userId} -> Plan ${planType}`);

            if (planType === 'PRO') {
                db.run(`UPDATE users SET is_pro = 1 WHERE id = ?`, [userId], (err) => {
                    if (err) console.error("❌ Erreur DB:", err.message);
                    else console.log("✅ Grade PRO activé avec succès.");
                });
            }
            break;
        }

        // --- CAS 2 : ABONNEMENT TERMINÉ (DÉSACTIVATION) ---
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const userId = subscription.metadata.userId;

            console.log("🗑️  Webhook suppression reçu !");

            if (userId) {
                console.log(`❌ Abonnement terminé pour User ${userId} -> Retour FREE`);
                db.run(`UPDATE users SET is_pro = 0 WHERE id = ?`, [userId]);
            } else {
                console.error("⚠️  Abonnement supprimé sans userId (Peut-être un ancien abonnement test ?)");
            }
            break;
        }

        // --- CAS 3 : ÉCHEC DE PAIEMENT (Optionnel) ---
        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            const userId = invoice.subscription_details?.metadata?.userId;
            console.log(`⚠️ Paiement échoué pour l'utilisateur ${userId}`);
            break;
        }

        default:
            // On ignore les autres événements pour ne pas polluer les logs
            break;
    }

    res.json({ received: true });
});
// ==================================================================

// Middlewares classiques (placés APRES le webhook)
app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Configuration Uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion Base de Données
const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error(err.message);
    console.log('✅ Connecté à SQLite.');
});

// Configuration Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Templates Email
const wrapEmailHTML = (title, content) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;width:100%;background-color:#09090b;font-family:sans-serif}.btn{display:inline-block;background:#4f46e5;color:#fff!important;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold}</style></head><body style="background-color:#09090b;margin:0;padding:20px"><table width="100%" style="background-color:#09090b"><tr><td align="center"><table width="100%" style="max-width:600px;background-color:#18181b;border-radius:16px;border:1px solid #27272a"><tr><td align="center" style="padding:40px 0 20px 0"><img src="cid:logo" alt="Logo" width="180" style="display:block;border:0"></td></tr><tr><td style="padding:0 40px 40px 40px;color:#e4e4e7;line-height:1.6"><h2 style="color:#fff;margin-top:0">${title}</h2>${content}</td></tr></table></td></tr></table></body></html>`;
const getVerificationTemplate = (code) => wrapEmailHTML("Code de vérification", `<p>Votre code :</p><div style="background:#09090b;padding:20px;text-align:center;font-size:32px;font-weight:800;color:#818cf8;letter-spacing:5px;border-radius:12px;border:1px solid #27272a">${code}</div>`);
const getWelcomeTemplate = (name) => wrapEmailHTML("Bienvenue !", `<p>Félicitations ${name}, votre compte est activé !</p><div style="text-align:center;margin-top:30px"><a href="http://localhost:5173" class="btn">Accéder</a></div>`);

// Initialisation des Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, first_name TEXT, last_name TEXT, default_risk REAL DEFAULT 1.0, preferences TEXT DEFAULT '{}', avatar_url TEXT, is_pro INTEGER DEFAULT 0, colors TEXT, verification_code TEXT, is_verified INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, description TEXT, broker TEXT, platform TEXT, color TEXT DEFAULT '#4f46e5', currency TEXT DEFAULT 'USD', max_risk REAL DEFAULT 2.0, default_rr REAL DEFAULT 2.0, commission_pct REAL DEFAULT 0.0, commission_min REAL DEFAULT 0.0, commission_max REAL DEFAULT 0.0, created_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS trades (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, account_id INTEGER, pair TEXT, date TEXT, time TEXT, type TEXT, entry REAL, exit REAL, sl REAL, tp REAL, lot REAL, profit REAL, discipline_score INTEGER DEFAULT 0, discipline_details TEXT DEFAULT '{}', fees REAL DEFAULT 0, tags TEXT DEFAULT '', is_off_plan INTEGER DEFAULT 0, risk_respected INTEGER DEFAULT 0, sl_moved INTEGER DEFAULT 0, has_screenshot INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, type TEXT, date TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, message TEXT, type TEXT, is_read INTEGER DEFAULT 0, date TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS todo_lists (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, icon TEXT, color TEXT, frequency TEXT, last_reset TEXT, created_at TEXT, position INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, list_id INTEGER, user_id INTEGER, text TEXT, is_completed INTEGER DEFAULT 0, created_at TEXT, FOREIGN KEY(list_id) REFERENCES todo_lists(id) ON DELETE CASCADE)`);

    // Migrations silencieuses
    const migrations = [
        "ALTER TABLE users ADD COLUMN verification_code TEXT", "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0",
        "ALTER TABLE accounts ADD COLUMN max_risk REAL DEFAULT 2.0", "ALTER TABLE accounts ADD COLUMN default_rr REAL DEFAULT 2.0",
        "ALTER TABLE trades ADD COLUMN account_id INTEGER", "ALTER TABLE trades ADD COLUMN time TEXT DEFAULT ''", "ALTER TABLE trades ADD COLUMN discipline_score INTEGER DEFAULT 0", "ALTER TABLE trades ADD COLUMN discipline_details TEXT DEFAULT '{}'", "ALTER TABLE trades ADD COLUMN fees REAL DEFAULT 0", "ALTER TABLE trades ADD COLUMN tags TEXT DEFAULT ''", "ALTER TABLE trades ADD COLUMN is_off_plan INTEGER DEFAULT 0", "ALTER TABLE trades ADD COLUMN risk_respected INTEGER DEFAULT 0", "ALTER TABLE trades ADD COLUMN sl_moved INTEGER DEFAULT 0", "ALTER TABLE trades ADD COLUMN has_screenshot INTEGER DEFAULT 0",
        "ALTER TABLE todos ADD COLUMN list_id INTEGER REFERENCES todo_lists(id) ON DELETE CASCADE", "ALTER TABLE todos ADD COLUMN created_at TEXT", "ALTER TABLE todo_lists ADD COLUMN position INTEGER DEFAULT 0"
    ];
    migrations.forEach(q => db.run(q, (err) => { if (err && !err.message.includes('duplicate column')) console.error("Migration warning (safe):", err.message); }));
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => { if (err) return res.sendStatus(403); req.user = user; next(); });
};

// ==================================================================
// 2. ROUTE CRÉATION SESSION PAIEMENT
// ==================================================================
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
    const { priceId, planType } = req.body;
    try {
        const origin = req.headers.origin || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],

            // --- AJOUTE CETTE LIGNE ICI ---
            allow_promotion_codes: true,
            // ------------------------------

            metadata: { userId: req.user.id, planType: planType },
            subscription_data: { metadata: { userId: req.user.id } },
            success_url: `${origin}?payment=success`,
            cancel_url: `${origin}?payment=cancel`,
        });
        res.json({ url: session.url });
    } catch (error) {

        console.error("Stripe Error:", error);
        res.status(500).json({ error: "Erreur création session paiement" });    }
});
// ==================================================================


// --- ROUTES AUTHENTIFICATION (VERSION SÉCURISÉE EMAIL) ---

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (user.is_verified === 0) return res.status(403).json({ error: "Compte non vérifié." });
        if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Mot de passe incorrect" });
        const token = jwt.sign({ id: user.id, email: user.email, is_pro: user.is_pro }, SECRET_KEY, { expiresIn: '24h' });
        let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
        let colors = {}; try { colors = JSON.parse(user.colors); } catch(e) {}
        res.json({ token, user: { ...user, password: '', preferences: prefs, colors } });
    });
});

app.get('/api/user/me', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user) return res.sendStatus(404);

        // On parse les JSON stockés en texte
        let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
        let colors = {}; try { colors = JSON.parse(user.colors); } catch(e) {}

        // On renvoie l'user propre (sans mdp)
        res.json({ ...user, password: '', preferences: prefs, colors });
    });
});

app.post('/api/register', (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, existing) => {
        if (existing) {
            if (existing.is_verified === 1) return res.status(400).json({ error: "Email déjà utilisé." });

            // Renvoi du code si compte existe mais non vérifié
            db.run(`UPDATE users SET password = ?, first_name = ?, last_name = ?, verification_code = ? WHERE id = ?`,
                [hashedPassword, first_name, last_name, code, existing.id],
                async () => {
                    try {
                        await transporter.sendMail({
                            from: '"FollowTrade" <no-reply@followtrade.com>',
                            to: email,
                            subject: "Code de vérification",
                            html: getVerificationTemplate(code),
                            attachments: [{ filename: 'logo.png', path: path.join(__dirname, 'uploads', 'logo.png'), cid: 'logo' }]
                        });
                        res.json({ message: "Code renvoyé", requiresVerification: true, email });
                    } catch (mailError) {
                        console.error("❌ ERREUR EMAIL :", mailError);
                        res.status(500).json({ error: "Erreur technique envoi email." });
                    }
                }
            );
        } else {
            // Nouvel utilisateur
            db.run(`INSERT INTO users (email, password, first_name, last_name, is_pro, verification_code, is_verified) VALUES (?, ?, ?, ?, 0, ?, 0)`,
                [email, hashedPassword, first_name || '', last_name || '', code],
                async () => {
                    try {
                        await transporter.sendMail({
                            from: '"FollowTrade" <no-reply@followtrade.com>',
                            to: email,
                            subject: "Code de vérification",
                            html: getVerificationTemplate(code),
                            attachments: [{ filename: 'logo.png', path: path.join(__dirname, 'uploads', 'logo.png'), cid: 'logo' }]
                        });
                        res.json({ message: "Compte créé", requiresVerification: true, email });
                    } catch (mailError) {
                        console.error("❌ ERREUR EMAIL :", mailError);
                        db.run(`DELETE FROM users WHERE email = ?`, [email]); // Rollback si email foire
                        res.status(500).json({ error: "Impossible d'envoyer l'email." });
                    }
                }
            );
        }
    });
});

app.post('/api/verify-email', (req, res) => {
    const { email, code } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur introuvable" });
        if (user.is_verified === 1) return res.status(400).json({ error: "Déjà vérifié" });
        if (String(user.verification_code) !== String(code)) return res.status(400).json({ error: "Code incorrect" });

        db.run(`UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?`, [user.id], async () => {
            // Email de bienvenue (Optionnel, pas d'erreur critique si ça rate)
            try {
                await transporter.sendMail({
                    from: '"FollowTrade" <no-reply@followtrade.com>',
                    to: email,
                    subject: "Bienvenue !",
                    html: getWelcomeTemplate(user.first_name),
                    attachments: [{ filename: 'logo.png', path: path.join(__dirname, 'uploads', 'logo.png'), cid: 'logo' }]
                });
            } catch(e) { console.error("Erreur mail bienvenue:", e); }

            const token = jwt.sign({ id: user.id, email: user.email, is_pro: user.is_pro }, SECRET_KEY, { expiresIn: '24h' });
            db.get(`SELECT * FROM users WHERE id = ?`, [user.id], (err, u) => {
                let prefs = {}; try { prefs = JSON.parse(u.preferences); } catch(e) {}
                let colors = {}; try { colors = JSON.parse(u.colors); } catch(e) {}
                res.json({ token, user: { ...u, password: '', preferences: prefs, colors } });
            });
        });
    });
});

// --- TODO LIST ROUTES ---
app.get('/api/todo-lists', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM todo_lists WHERE user_id = ? ORDER BY position ASC, id ASC`, [req.user.id], async (err, lists) => {
        if (err) return res.status(500).json({ error: err.message });
        const result = [];
        for (const list of lists) {
            const tasks = await new Promise((resolve) => db.all(`SELECT * FROM todos WHERE list_id = ?`, [list.id], (e, r) => resolve(r || [])));
            result.push({ ...list, tasks });
        }
        res.json(result);
    });
});

app.post('/api/todo-lists', authenticateToken, (req, res) => {
    let { title, icon, color, frequency } = req.body;
    if (req.user.is_pro === 0) {
        color = 'indigo'; icon = null;
        db.get(`SELECT COUNT(*) as count FROM todo_lists WHERE user_id = ?`, [req.user.id], (err, row) => {
            if (row.count >= 3) return res.status(403).json({ error: "Limite de 3 listes atteinte." });
            insertList();
        });
    } else { insertList(); }
    function insertList() {
        const date = new Date().toISOString().split('T')[0];
        db.get(`SELECT MAX(position) as maxPos FROM todo_lists WHERE user_id = ?`, [req.user.id], (err, row) => {
            const nextPos = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;
            db.run(`INSERT INTO todo_lists (user_id, title, icon, color, frequency, last_reset, created_at, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [req.user.id, title, icon, color, frequency, date, date, nextPos], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, title, icon, color, frequency, position: nextPos, tasks: [] });
            });
        });
    }
});

// --- ROUTE HEALTH CHECK (POUR ADMIN) ---
app.get('/api/admin/health', authenticateToken, async (req, res) => {
    // Vérification Admin
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], async (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);

        const status = {
            database: 'UNKNOWN',
            stripe: 'UNKNOWN',
            email: 'UNKNOWN',
            mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE (Production)' : 'TEST (Sandbox)'
        };

        // 1. Test DB
        try {
            await new Promise((resolve, reject) => {
                db.get("SELECT 1", (err) => err ? reject(err) : resolve());
            });
            status.database = 'OK';
        } catch (e) { status.database = 'ERROR: ' + e.message; }

        // 2. Test Stripe (Récupération du solde)
        try {
            await stripe.balance.retrieve();
            status.stripe = 'OK';
        } catch (e) { status.stripe = 'ERROR: ' + e.message; }

        // 3. Test Email (Vérification configuration)
        try {
            await transporter.verify();
            status.email = 'OK';
        } catch (e) { status.email = 'ERROR: ' + e.message; }

        res.json(status);
    });
});

app.put('/api/todo-lists/:id', authenticateToken, (req, res) => {
    let { title, icon, color, frequency } = req.body;
    if (req.user.is_pro === 0) { color = 'indigo'; icon = null; }
    db.run(`UPDATE todo_lists SET title = ?, icon = ?, color = ?, frequency = ? WHERE id = ? AND user_id = ?`,
        [title, icon, color, frequency, req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: parseInt(req.params.id), title, icon, color, frequency });
        }
    );
});

app.put('/api/todo-lists/reorder', authenticateToken, (req, res) => {
    const { lists } = req.body;
    db.serialize(() => {
        const stmt = db.prepare(`UPDATE todo_lists SET position = ? WHERE id = ? AND user_id = ?`);
        lists.forEach((item, index) => stmt.run(index, item.id, req.user.id));
        stmt.finalize(() => res.json({ message: "Reordered" }));
    });
});

app.delete('/api/todo-lists/:id', authenticateToken, (req, res) => {
    db.serialize(() => {
        db.run(`DELETE FROM todos WHERE list_id = ?`, [req.params.id]);
        db.run(`DELETE FROM todo_lists WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], () => res.json({ message: "Deleted" }));
    });
});

app.post('/api/todos', authenticateToken, (req, res) => {
    const { list_id, text } = req.body;
    if (req.user.is_pro === 0) {
        db.get(`SELECT COUNT(*) as count FROM todos WHERE list_id = ?`, [list_id], (err, row) => {
            if (row.count >= 10) return res.status(403).json({ error: "Limite de 10 tâches atteinte." });
            insertTodo();
        });
    } else { insertTodo(); }
    function insertTodo() {
        db.run(`INSERT INTO todos (list_id, user_id, text, is_completed, created_at) VALUES (?, ?, ?, 0, ?)`, [list_id, req.user.id, text, new Date().toISOString()], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, list_id, text, is_completed: 0 });
        });
    }
});

app.put('/api/todos/:id', authenticateToken, (req, res) => {
    const { is_completed } = req.body;
    db.run(`UPDATE todos SET is_completed = ? WHERE id = ?`, [is_completed, req.params.id], () => res.json({ message: "Updated" }));
});
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM todos WHERE id = ?`, [req.params.id], () => res.json({ message: "Deleted" }));
});

// --- ROUTES STANDARDS ---
app.put('/api/user/update', authenticateToken, (req, res) => { const { first_name, last_name, email, password, default_risk, preferences, colors, is_pro } = req.body; let u=[], p=[]; if(first_name) {u.push("first_name=?"); p.push(first_name)} if(last_name){u.push("last_name=?"); p.push(last_name)} if(email){u.push("email=?"); p.push(email)} if(default_risk){u.push("default_risk=?"); p.push(default_risk)} if(preferences){u.push("preferences=?"); p.push(JSON.stringify(preferences))} if(colors){u.push("colors=?"); p.push(JSON.stringify(colors))} if(password){u.push("password=?"); p.push(bcrypt.hashSync(password,8))} p.push(req.user.id); db.run(`UPDATE users SET ${u.join(',')} WHERE id=?`, p, () => { db.get(`SELECT * FROM users WHERE id=?`, [req.user.id], (e,user) => res.json({ message: "Updated", user: {...user, password:'', preferences: JSON.parse(user.preferences), colors: JSON.parse(user.colors)} })); }); });
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), (req,res) => { const url=`/uploads/${req.file.filename}`; db.run(`UPDATE users SET avatar_url=? WHERE id=?`, [url, req.user.id], ()=>res.json({message:"OK", avatar_url:url})); });
app.get('/api/accounts', authenticateToken, (req, res) => { db.all(`SELECT * FROM accounts WHERE user_id=?`, [req.user.id], (e,r) => res.json(r)); });
app.post('/api/accounts', authenticateToken, (req, res) => { const {name, description, broker, platform, color, currency, max_risk, default_rr} = req.body; db.run(`INSERT INTO accounts (user_id, name, description, broker, platform, color, currency, max_risk, default_rr, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`, [req.user.id, name, description, broker, platform, color, currency, max_risk, default_rr, new Date().toISOString()], function(){ res.json({id:this.lastID, ...req.body}); }); });
app.put('/api/accounts/:id', authenticateToken, (req, res) => { const {name, description, broker, platform, color, currency, max_risk, default_rr} = req.body; db.run(`UPDATE accounts SET name=?, description=?, broker=?, platform=?, color=?, currency=?, max_risk=?, default_rr=? WHERE id=?`, [name, description, broker, platform, color, currency, max_risk, default_rr, req.params.id], () => res.json({message:"Updated"})); });
app.delete('/api/accounts/:id', authenticateToken, (req, res) => { db.serialize(() => { db.run(`DELETE FROM trades WHERE account_id=?`, [req.params.id]); db.run(`DELETE FROM accounts WHERE id=?`, [req.params.id], () => res.json({message:"Deleted"})); }); });
app.get('/api/trades', authenticateToken, (req,res) => { const sql = req.query.accountId ? `SELECT * FROM trades WHERE user_id=? AND account_id=? ORDER BY date DESC` : `SELECT * FROM trades WHERE user_id=? ORDER BY date DESC`; const params = req.query.accountId ? [req.user.id, req.query.accountId] : [req.user.id]; db.all(sql, params, (e,r) => res.json(r.map(t => ({...t, disciplineScore: t.discipline_score, disciplineDetails: JSON.parse(t.discipline_details || '{}'), isOffPlan: !!t.is_off_plan, riskRespected: !!t.risk_respected, slMoved: !!t.sl_moved})))); });
app.post('/api/trades', authenticateToken, (req,res) => { const {account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, disciplineDetails, fees, tags, isOffPlan, riskRespected, slMoved} = req.body; db.run(`INSERT INTO trades (user_id, account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, discipline_score, discipline_details, fees, tags, is_off_plan, risk_respected, sl_moved) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [req.user.id, account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, JSON.stringify(disciplineDetails), fees, tags, isOffPlan?1:0, riskRespected?1:0, slMoved?1:0], function(){ res.json({id:this.lastID, ...req.body}); }); });
app.put('/api/trades/:id', authenticateToken, (req,res) => { const {pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, disciplineDetails, fees, tags, isOffPlan, riskRespected, slMoved} = req.body; db.run(`UPDATE trades SET pair=?, date=?, time=?, type=?, entry=?, exit=?, sl=?, tp=?, lot=?, profit=?, discipline_score=?, discipline_details=?, fees=?, tags=?, is_off_plan=?, risk_respected=?, sl_moved=? WHERE id=?`, [pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, JSON.stringify(disciplineDetails), fees, tags, isOffPlan?1:0, riskRespected?1:0, slMoved?1:0, req.params.id], () => res.json({id:req.params.id, ...req.body})); });
app.delete('/api/trades/:id', authenticateToken, (req,res) => { db.run(`DELETE FROM trades WHERE id=?`, [req.params.id], () => res.json({message:"Deleted"})); });
app.get('/api/notifications', authenticateToken, (req,res) => db.all(`SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC`, [req.user.id], (e,r) => res.json(r)));
app.put('/api/notifications/read', authenticateToken, (req,res) => db.run(`UPDATE notifications SET is_read=1 WHERE user_id=?`, [req.user.id], () => res.json({message:"Read"})));
app.get('/api/updates', authenticateToken, (req,res) => db.all(`SELECT * FROM updates ORDER BY date DESC`, [], (e,r) => res.json(r)));
app.get('/api/admin/users', authenticateToken, (req,res) => { db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (e,u) => { if(u?.is_pro===7) db.all("SELECT * FROM users", [], (e,r)=>res.json(r)); else res.sendStatus(403); }); });
app.post('/api/admin/test-email', authenticateToken, (req,res) => { db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], async (e,u) => { if(u?.is_pro===7) { try { await transporter.sendMail({from:'"Test"<no-reply@test.com>', to:req.user.email, subject:"Test Email", html:"<p>Ceci est un test</p>", attachments: [{ filename: 'logo.png', path: path.join(__dirname, 'uploads', 'logo.png'), cid: 'logo' }]}); res.json({message:"Envoyé"}); } catch(err) { res.status(500).json({error:"Erreur envoi"}); } } else res.sendStatus(403); }); });

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));