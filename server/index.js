require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Charge la clé depuis .env
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
const SECRET_KEY = process.env.SECRET_KEY || "ma_super_cle_secrete_par_defaut";

// ==================================================================
// 1. WEBHOOK STRIPE (Doit être avant express.json)
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        console.log(`💰 Paiement validé pour User ${userId} -> ${planType}`);

        if (userId && planType === 'PRO') {
            db.run(`UPDATE users SET is_pro = 1 WHERE id = ?`, [userId]);
        }
    }
    else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        console.log(`❌ Fin abonnement pour User ${userId}`);
        if (userId) {
            db.run(`UPDATE users SET is_pro = 0 WHERE id = ?`, [userId]);
        }
    }

    res.json({ received: true });
});

// ==================================================================
// 2. MIDDLEWARES & CONFIG
// ==================================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Dossier pour les uploads (Avatars)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Connexion Base de données
const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error("Erreur DB:", err.message);
    else console.log('✅ Connecté à SQLite.');
});

// Config Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Middleware Authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// ==================================================================
// 3. ROUTES API
// ==================================================================

// --- PAIEMENT STRIPE (Dynamique PROD/DEV) ---
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
    const { priceId, planType } = req.body;
    try {
        // En PROD : https://ton-site.com | En DEV : http://localhost:5173
        const origin = req.headers.origin || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            allow_promotion_codes: true, // Active les codes promo (ex: GRATUIT)
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

// --- USER & AUTH ---
app.get('/api/user/me', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user) return res.sendStatus(404);
        try { user.preferences = JSON.parse(user.preferences); } catch(e){}
        try { user.colors = JSON.parse(user.colors); } catch(e){}
        res.json(user);
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (user.is_verified === 0) return res.status(403).json({ error: "Compte non vérifié. Regardez vos mails." });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: "Mot de passe incorrect" });

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
        // Parsing pour le frontend
        try { user.preferences = JSON.parse(user.preferences); } catch(e){}
        try { user.colors = JSON.parse(user.colors); } catch(e){}
        res.json({ token, user });
    });
});

app.post('/api/register', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const sql = `INSERT INTO users (email, password, first_name, last_name, verification_token, is_verified, is_pro, preferences, colors) VALUES (?, ?, ?, ?, ?, 0, 0, '{}', '{}')`;

    db.run(sql, [email, hashedPassword, first_name, last_name, code], function(err) {
        if (err) return res.status(400).json({ error: "Cet email existe déjà." });

        // Envoi email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Vérifiez votre compte FollowTrade',
            text: `Votre code de vérification est : ${code}`
        };
        transporter.sendMail(mailOptions, (err) => {
            if (err) console.error("Erreur mail:", err);
        });

        res.json({ message: "Inscription réussie. Vérifiez vos emails." });
    });
});

app.post('/api/verify-email', (req, res) => {
    const { email, code } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
        if (String(user.verification_token) !== String(code)) return res.status(400).json({ error: "Code incorrect" });

        db.run("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?", [user.id], () => {
            res.json({ message: "Compte vérifié avec succès !" });
        });
    });
});

// --- ADMIN : HEALTH CHECK & DB VIEWER ---
app.get('/api/admin/health', authenticateToken, async (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], async (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        const status = {
            database: 'UNKNOWN',
            stripe: 'UNKNOWN',
            email: 'UNKNOWN',
            mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE (Production)' : 'TEST (Sandbox)'
        };
        try { await new Promise((r, j) => db.get("SELECT 1", (e) => e ? j(e) : r())); status.database = 'OK'; } catch (e) { status.database = 'ERROR'; }
        try { await stripe.balance.retrieve(); status.stripe = 'OK'; } catch (e) { status.stripe = 'ERROR'; }
        try { await transporter.verify(); status.email = 'OK'; } catch (e) { status.email = 'ERROR'; }
        res.json(status);
    });
});

app.get('/api/admin/table/:name', authenticateToken, (req, res) => {
    db.get("SELECT is_pro FROM users WHERE id=?", [req.user.id], (err, u) => {
        if (u?.is_pro !== 7) return res.sendStatus(403);
        const tableName = req.params.name;
        const allowedTables = ['users', 'accounts', 'trades', 'notifications', 'updates', 'todo_lists', 'todos'];
        if (!allowedTables.includes(tableName)) return res.status(400).json({ error: "Table interdite" });

        db.all(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 50`, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
    });
});

// --- ROUTES DE SECOURS (A commenter une fois utilisé) ---
// Activer si vous êtes bloqué hors de votre compte Admin ou Vérifié
/*
app.get('/api/admin/promote-me', authenticateToken, (req, res) => {
    db.run("UPDATE users SET is_pro = 7 WHERE id = ?", [req.user.id], () => res.json({msg: "Vous êtes Admin"}));
});
app.get('/api/emergency-validate/:email', (req, res) => {
    db.run("UPDATE users SET is_verified = 1 WHERE email = ?", [req.params.email], () => res.json({msg: "Compte validé"}));
});
*/

// --- AUTRES ROUTES CRUD (Résumé pour faire court, mais garde tes fichiers Accounts/Trades/Todos) ---
// (Je suppose que tu as gardé le code pour /accounts, /trades, /todos, etc.
//  Il faut juste s'assurer qu'elles sont présentes dans ton fichier final).
//  EXEMPLE RAPIDE pour ne pas casser le site si tu copies-colles tout :
app.get('/api/accounts', authenticateToken, (req, res) => { db.all("SELECT * FROM accounts WHERE user_id = ?", [req.user.id], (err, rows) => res.json(rows || [])); });
app.post('/api/accounts', authenticateToken, (req, res) => { /* Code Create Account */ });
app.get('/api/trades', authenticateToken, (req, res) => { db.all("SELECT * FROM trades WHERE account_id IN (SELECT id FROM accounts WHERE user_id = ?)", [req.user.id], (err, rows) => res.json(rows || [])); });
app.post('/api/trades', authenticateToken, (req, res) => { /* Code Create Trade */ });
// ... (Ajoute ici le reste de tes routes CRUD existantes) ...

// ==================================================================
// 4. SERVIR LE FRONTEND REACT (PRODUCTION)
// ==================================================================
// C'est ça qui fait que https://ton-site.com affiche le site
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    // Si ce n'est pas une route API, on renvoie l'index.html du site
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        res.status(404).json({ error: "API Route not found" });
    }
});

app.listen(PORT, () => console.log(`🚀 Serveur Prod démarré sur port ${PORT}`));