require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
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
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "super_secret_cle";

// ==================================================================
// 1. WEBHOOK STRIPE (OBLIGATOIREMENT AVANT express.json)
// ==================================================================
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        console.log(`💰 Paiement validé : User ${userId} -> ${planType}`);
        if (userId && planType === 'PRO') {
            db.run(`UPDATE users SET is_pro = 1 WHERE id = ?`, [userId]);
        }
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        console.log(`❌ Fin abonnement : User ${userId}`);
        if (userId) {
            db.run(`UPDATE users SET is_pro = 0 WHERE id = ?`, [userId]);
        }
    }

    res.json({ received: true });
});

// ==================================================================
// 2. CONFIGURATION & MIDDLEWARES
// ==================================================================
app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

// Uploads
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
app.use('/uploads', express.static(uploadDir));

// Base de données
const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error(err.message);
    else console.log('✅ Connecté à SQLite.');
});

// Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Templates Email
const wrapEmailHTML = (title, content) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;width:100%;background-color:#09090b;font-family:sans-serif}.btn{display:inline-block;background:#4f46e5;color:#fff!important;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold}</style></head><body style="background-color:#09090b;margin:0;padding:20px"><table width="100%" style="background-color:#09090b"><tr><td align="center"><table width="100%" style="max-width:600px;background-color:#18181b;border-radius:16px;border:1px solid #27272a"><tr><td align="center" style="padding:40px 0 20px 0"><img src="cid:logo" alt="Logo" width="180" style="display:block;border:0"></td></tr><tr><td style="padding:0 40px 40px 40px;color:#e4e4e7;line-height:1.6"><h2 style="color:#fff;margin-top:0">${title}</h2>${content}</td></tr></table></td></tr></table></body></html>`;
const getVerificationTemplate = (code) => wrapEmailHTML("Code de vérification", `<p>Votre code :</p><div style="background:#09090b;padding:20px;text-align:center;font-size:32px;font-weight:800;color:#818cf8;letter-spacing:5px;border-radius:12px;border:1px solid #27272a">${code}</div>`);
const getWelcomeTemplate = (name) => wrapEmailHTML("Bienvenue !", `<p>Félicitations ${name}, votre compte est activé !</p><div style="text-align:center;margin-top:30px"><a href="https://followtrade.sohan-birotheau.fr" class="btn">Accéder</a></div>`);

// Initialisation DB
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
    migrations.forEach(q => db.run(q, (err) => { if (err && !err.message.includes('duplicate column')) console.error("Migration info:", err.message); }));
});

// Middleware Auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, SECRET_KEY, (err, user) => { if (err) return res.sendStatus(403); req.user = user; next(); });
};

// ==================================================================
// 3. ROUTES API (COMPLÈTES)
// ==================================================================

// --- PAIEMENT ---
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
    const { priceId, planType } = req.body;
    try {
        const origin = req.headers.origin || 'http://localhost:5173'; // Fallback Dev
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true,
            metadata: { userId: req.user.id, planType: planType },
            subscription_data: { metadata: { userId: req.user.id } },
            success_url: `${origin}?payment=success`,
            cancel_url: `${origin}?payment=cancel`,
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cancel-subscription', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // 1. On cherche le client Stripe avec cet email
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

        if (customers.data.length > 0) {
            const customerId = customers.data[0].id;

            // 2. On cherche son abonnement actif
            const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1
            });

            if (subscriptions.data.length > 0) {
                // 3. On annule l'abonnement chez Stripe
                await stripe.subscriptions.cancel(subscriptions.data[0].id);
            }
        }

        // 4. Quoi qu'il arrive (même si pas trouvé chez Stripe), on repasse l'user en FREE localement
        db.run("UPDATE users SET is_pro = 0 WHERE id = ?", [req.user.id], () => {
            res.json({ message: "Abonnement résilié avec succès." });
        });

    } catch (error) {
        console.error("Erreur annulation:", error);
        res.status(500).json({ error: "Erreur lors de la résiliation." });
    }
});

// --- AUTH ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (user.is_verified === 0) return res.status(403).json({ error: "Compte non vérifié." });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Mot de passe incorrect" });

        const token = jwt.sign({ id: user.id, email: user.email, is_pro: user.is_pro }, SECRET_KEY, { expiresIn: '7d' });
        try { user.preferences = JSON.parse(user.preferences); } catch(e){}
        try { user.colors = JSON.parse(user.colors); } catch(e){}
        res.json({ token, user: { ...user, password: '' } });
    });
});

app.post('/api/register', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, existing) => {
        if (existing) {
            if (existing.is_verified === 1) return res.status(400).json({ error: "Email déjà utilisé." });
            db.run(`UPDATE users SET password=?, first_name=?, last_name=?, verification_code=? WHERE id=?`,
                [hashedPassword, first_name, last_name, code, existing.id], () => sendVerifEmail(email, code, res));
        } else {
            db.run(`INSERT INTO users (email, password, first_name, last_name, verification_code, is_verified, is_pro) VALUES (?, ?, ?, ?, ?, 0, 0)`,
                [email, hashedPassword, first_name, last_name, code], () => sendVerifEmail(email, code, res));
        }
    });

    function sendVerifEmail(to, code, res) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: 'Vérification FollowTrade',
            html: getVerificationTemplate(code),
            attachments: [{ filename: 'logo.png', path: path.join(__dirname, 'uploads', 'logo.png'), cid: 'logo' }]
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) return res.status(500).json({ error: "Erreur envoi email" });
            res.json({ message: "Vérifiez vos emails", requiresVerification: true, email: to });
        });
    }
});

app.post('/api/verify-email', (req, res) => {
    const { email, code } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user) return res.status(404).json({ error: "Introuvable" });
        if (String(user.verification_code) !== String(code)) return res.status(400).json({ error: "Code incorrect" });

        db.run("UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?", [user.id], () => {
            transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: "Bienvenue !", html: getWelcomeTemplate(user.first_name) }).catch(()=>{});
            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, user: { ...user, password: '' } });
        });
    });
});

app.get('/api/user/me', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (!user) return res.sendStatus(404);
        try { user.preferences = JSON.parse(user.preferences); } catch(e){}
        try { user.colors = JSON.parse(user.colors); } catch(e){}
        res.json({ ...user, password: '' });
    });
});

app.put('/api/user/update', authenticateToken, (req, res) => {
    const { first_name, last_name, email, password, default_risk, preferences, colors } = req.body;
    let updates = [], params = [];
    if(first_name) { updates.push("first_name=?"); params.push(first_name); }
    if(last_name) { updates.push("last_name=?"); params.push(last_name); }
    if(email) { updates.push("email=?"); params.push(email); }
    if(default_risk) { updates.push("default_risk=?"); params.push(default_risk); }
    if(preferences) { updates.push("preferences=?"); params.push(JSON.stringify(preferences)); }
    if(colors) { updates.push("colors=?"); params.push(JSON.stringify(colors)); }
    if(password) { updates.push("password=?"); params.push(bcrypt.hashSync(password, 8)); }

    if (updates.length === 0) return res.json({ message: "Rien à mettre à jour" });

    params.push(req.user.id);
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM users WHERE id=?`, [req.user.id], (e, u) => {
            try { u.preferences = JSON.parse(u.preferences); } catch(e){}
            try { u.colors = JSON.parse(u.colors); } catch(e){}
            res.json({ message: "Mise à jour réussie", user: {...u, password: ''} });
        });
    });
});

app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
    const url = `/uploads/${req.file.filename}`;
    db.run(`UPDATE users SET avatar_url = ? WHERE id = ?`, [url, req.user.id], () => {
        res.json({ message: "Avatar mis à jour", avatar_url: url });
    });
});

// --- TODO LISTS ---
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
        db.get(`SELECT COUNT(*) as count FROM todo_lists WHERE user_id = ?`, [req.user.id], (err, row) => {
            if (row.count >= 3) return res.status(403).json({ error: "Limite de 3 listes atteinte." });
            createList();
        });
    } else { createList(); }

    function createList() {
        const date = new Date().toISOString().split('T')[0];
        db.get(`SELECT MAX(position) as maxPos FROM todo_lists WHERE user_id = ?`, [req.user.id], (err, row) => {
            const pos = (row && row.maxPos !== null) ? row.maxPos + 1 : 0;
            db.run(`INSERT INTO todo_lists (user_id, title, icon, color, frequency, last_reset, created_at, position) VALUES (?,?,?,?,?,?,?,?)`,
                [req.user.id, title, icon, color, frequency, date, date, pos],
                function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ id: this.lastID, title, icon, color, frequency, position: pos, tasks: [] });
                });
        });
    }
});

app.put('/api/todo-lists/:id', authenticateToken, (req, res) => {
    const { title, icon, color, frequency } = req.body;
    db.run(`UPDATE todo_lists SET title=?, icon=?, color=?, frequency=? WHERE id=? AND user_id=?`,
        [title, icon, color, frequency, req.params.id, req.user.id], () => res.json({ id: req.params.id, ...req.body }));
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
    db.run(`DELETE FROM todos WHERE list_id = ?`, [req.params.id], () => {
        db.run(`DELETE FROM todo_lists WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], () => res.json({ message: "Deleted" }));
    });
});

app.post('/api/todos', authenticateToken, (req, res) => {
    const { list_id, text } = req.body;
    if (req.user.is_pro === 0) {
        db.get(`SELECT COUNT(*) as count FROM todos WHERE list_id = ?`, [list_id], (err, row) => {
            if (row.count >= 10) return res.status(403).json({ error: "Limite de 10 tâches." });
            addTask();
        });
    } else { addTask(); }

    function addTask() {
        db.run(`INSERT INTO todos (list_id, user_id, text, is_completed, created_at) VALUES (?,?,?,0,?)`,
            [list_id, req.user.id, text, new Date().toISOString()],
            function(err) {
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

// --- ACCOUNTS ---
app.get('/api/accounts', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM accounts WHERE user_id = ?`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.post('/api/accounts', authenticateToken, (req, res) => {
    const { name, description, broker, platform, color, currency, max_risk, default_rr } = req.body;
    db.run(`INSERT INTO accounts (user_id, name, description, broker, platform, color, currency, max_risk, default_rr, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [req.user.id, name, description, broker, platform, color, currency, max_risk, default_rr, new Date().toISOString()],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        });
});
app.put('/api/accounts/:id', authenticateToken, (req, res) => {
    const { name, description, broker, platform, color, currency, max_risk, default_rr } = req.body;
    db.run(`UPDATE accounts SET name=?, description=?, broker=?, platform=?, color=?, currency=?, max_risk=?, default_rr=? WHERE id=? AND user_id=?`,
        [name, description, broker, platform, color, currency, max_risk, default_rr, req.params.id, req.user.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Compte mis à jour" });
        });
});
app.delete('/api/accounts/:id', authenticateToken, (req, res) => {
    db.serialize(() => {
        db.run(`DELETE FROM trades WHERE account_id = ?`, [req.params.id]);
        db.run(`DELETE FROM accounts WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Compte supprimé" });
        });
    });
});

// --- TRADES ---
app.get('/api/trades', authenticateToken, (req, res) => {
    const sql = req.query.accountId
        ? `SELECT * FROM trades WHERE user_id=? AND account_id=? ORDER BY date DESC`
        : `SELECT * FROM trades WHERE user_id=? ORDER BY date DESC`;
    const params = req.query.accountId ? [req.user.id, req.query.accountId] : [req.user.id];

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const cleanRows = rows.map(t => ({
            ...t,
            disciplineScore: t.discipline_score,
            disciplineDetails: JSON.parse(t.discipline_details || '{}'),
            isOffPlan: !!t.is_off_plan,
            riskRespected: !!t.risk_respected,
            slMoved: !!t.sl_moved
        }));
        res.json(cleanRows);
    });
});
app.post('/api/trades', authenticateToken, (req, res) => {
    const { account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, disciplineDetails, fees, tags, isOffPlan, riskRespected, slMoved } = req.body;
    db.run(`INSERT INTO trades (user_id, account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, discipline_score, discipline_details, fees, tags, is_off_plan, risk_respected, sl_moved) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [req.user.id, account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, JSON.stringify(disciplineDetails), fees, tags, isOffPlan?1:0, riskRespected?1:0, slMoved?1:0],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        });
});
app.put('/api/trades/:id', authenticateToken, (req, res) => {
    const { pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, disciplineDetails, fees, tags, isOffPlan, riskRespected, slMoved } = req.body;
    db.run(`UPDATE trades SET pair=?, date=?, time=?, type=?, entry=?, exit=?, sl=?, tp=?, lot=?, profit=?, discipline_score=?, discipline_details=?, fees=?, tags=?, is_off_plan=?, risk_respected=?, sl_moved=? WHERE id=? AND user_id=?`,
        [pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, JSON.stringify(disciplineDetails), fees, tags, isOffPlan?1:0, riskRespected?1:0, slMoved?1:0, req.params.id, req.user.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: req.params.id, ...req.body });
        });
});
app.delete('/api/trades/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM trades WHERE id=? AND user_id=?`, [req.params.id, req.user.id], () => res.json({ message: "Trade supprimé" }));
});

// --- ADMIN & MISC ---
app.get('/api/admin/health', authenticateToken, async (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], async (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        const status = { db: 'UNKNOWN', stripe: 'UNKNOWN', mail: 'UNKNOWN', mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST' };
        try { await new Promise((r, j) => db.get("SELECT 1", (e) => e ? j(e) : r())); status.db = 'OK'; } catch (e) { status.db = 'ERR'; }
        try { await stripe.balance.retrieve(); status.stripe = 'OK'; } catch (e) { status.stripe = 'ERR'; }
        try { await transporter.verify(); status.mail = 'OK'; } catch (e) { status.mail = 'ERR'; }
        res.json(status);
    });
});
app.get('/api/admin/table/:name', authenticateToken, (req, res) => {
    const tables = ['users', 'accounts', 'trades', 'notifications', 'updates', 'todo_lists', 'todos'];
    if (!tables.includes(req.params.name)) return res.sendStatus(400);
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        db.all(`SELECT * FROM ${req.params.name} ORDER BY id DESC LIMIT 50`, [], (e, r) => res.json(r));
    });
});
app.get('/api/admin/users', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        db.all("SELECT * FROM users ORDER BY id DESC", [], (err, rows) => res.json(rows));
    });
});
app.put('/api/admin/users/:id', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        const { is_pro, is_verified } = req.body;
        db.run("UPDATE users SET is_pro = ?, is_verified = ? WHERE id = ?", [is_pro, is_verified, req.params.id], () => res.json({ message: "Updated" }));
    });
});
app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        db.run("DELETE FROM users WHERE id = ?", [req.params.id], () => res.json({ message: "Supprimé" }));
    });
});
app.post('/api/admin/updates', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        const { title, content, type } = req.body;
        const date = new Date().toISOString();
        db.run("INSERT INTO updates (title, content, type, date) VALUES (?, ?, ?, ?)", [title, content, type, date], function() {
            res.json({ id: this.lastID, ...req.body, date });
        });
    });
});
app.put('/api/admin/updates/:id', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        const { title, content, type } = req.body;
        db.run("UPDATE updates SET title=?, content=?, type=? WHERE id=?", [title, content, type, req.params.id], () => res.json({ message: "Updated" }));
    });
});
app.delete('/api/admin/updates/:id', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        db.run("DELETE FROM updates WHERE id=?", [req.params.id], () => res.json({ message: "Deleted" }));
    });
});
app.post('/api/admin/test-email', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], async (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        try {
            await transporter.sendMail({ from: process.env.EMAIL_USER, to: req.user.email, subject: "Test Email Admin", text: "Si vous recevez ceci, l'envoi d'email fonctionne." });
            res.json({ message: "Email envoyé" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });
});
app.get('/api/notifications', authenticateToken, (req, res) => db.all("SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC", [req.user.id], (e, r) => res.json(r || [])));
app.put('/api/notifications/read', authenticateToken, (req, res) => db.run("UPDATE notifications SET is_read=1 WHERE user_id=?", [req.user.id], () => res.json({ message: "Read" })));
app.get('/api/updates', authenticateToken, (req, res) => db.all("SELECT * FROM updates ORDER BY date DESC", [], (e, r) => res.json(r || [])));

// ==================================================================
// 4. SERVIR LE SITE (PRODUCTION) - A LA FIN
// ==================================================================
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => {
    // Si la requête commence par /api mais n'a pas été trouvée avant -> Erreur 404 JSON
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API Route not found" });
    }

    // Sinon (pour le site React), on renvoie index.html
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur port ${PORT}`));

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur port ${PORT}`));