require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || "super_secret_cle";

app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ limit: '150mb', extended: true }));

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

const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error(err.message);
    console.log('✅ Connecté à SQLite.');
});

// --- MIGRATION ROBUSTE ---
const ensureColumns = () => {
    const columnsToAdd = [
        ['accounts', 'max_risk', "REAL DEFAULT 2.0"],
        ['accounts', 'default_rr', "REAL DEFAULT 2.0"],
        ['trades', 'account_id', "INTEGER"],
        ['trades', 'time', "TEXT DEFAULT ''"],
        ['trades', 'discipline_score', "INTEGER DEFAULT 0"], // Le score est stocké ici
        ['trades', 'discipline_details', "TEXT DEFAULT '{}'"],
        ['trades', 'fees', "REAL DEFAULT 0"],
        ['trades', 'tags', "TEXT DEFAULT ''"],
        ['trades', 'is_off_plan', "INTEGER DEFAULT 0"],
        ['trades', 'risk_respected', "INTEGER DEFAULT 0"],
        ['trades', 'sl_moved', "INTEGER DEFAULT 0"],
        ['trades', 'has_screenshot', "INTEGER DEFAULT 0"]
    ];

    columnsToAdd.forEach(([table, col, def]) => {
        db.all(`PRAGMA table_info(${table})`, (err, rows) => {
            if (!err && rows && !rows.some(r => r.name === col)) {
                db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
                console.log(`Colonne ajoutée : ${col} dans ${table}`);
            }
        });
    });
};

db.serialize(() => {
    // Création des tables si inexistantes
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, first_name TEXT, last_name TEXT, default_risk REAL DEFAULT 1.0, preferences TEXT DEFAULT '{}', avatar_url TEXT, is_pro INTEGER DEFAULT 0, colors TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, description TEXT, broker TEXT, platform TEXT, color TEXT DEFAULT '#4f46e5', currency TEXT DEFAULT 'USD', max_risk REAL DEFAULT 2.0, default_rr REAL DEFAULT 2.0, commission_pct REAL DEFAULT 0.0, commission_min REAL DEFAULT 0.0, commission_max REAL DEFAULT 0.0, created_at TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS trades (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, account_id INTEGER, pair TEXT, date TEXT, time TEXT, type TEXT, entry REAL, exit REAL, sl REAL, tp REAL, lot REAL, profit REAL, discipline_score INTEGER DEFAULT 0, discipline_details TEXT DEFAULT '{}', fees REAL DEFAULT 0, tags TEXT DEFAULT '', is_off_plan INTEGER DEFAULT 0, risk_respected INTEGER DEFAULT 0, sl_moved INTEGER DEFAULT 0, has_screenshot INTEGER DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, type TEXT, date TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, message TEXT, type TEXT, is_read INTEGER DEFAULT 0, date TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
    ensureColumns();
});

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

// ... (Routes Auth inchangées : login, register, update user, avatar) ...
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Mot de passe incorrect" });
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
        let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
        let colors = {}; try { colors = JSON.parse(user.colors); } catch(e) {}
        res.json({ token, user: { ...user, password: '', preferences: prefs, colors: colors } });
    });
});
app.post('/api/register', (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (email, password, first_name, last_name, is_pro) VALUES (?, ?, ?, ?, 0)`, [email, hashedPassword, first_name || '', last_name || ''], function(err) {
        if (err) return res.status(400).json({ error: "Email utilisé" });
        const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '24h' });
        db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (err, newUser) => res.json({ token, user: { ...newUser, password: '' } }));
    });
});
app.put('/api/user/update', authenticateToken, (req, res) => {
    const { first_name, last_name, email, password, default_risk, preferences, colors, is_pro } = req.body;
    let updates = [], params = [];
    if (first_name !== undefined) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name !== undefined) { updates.push("last_name = ?"); params.push(last_name); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (default_risk !== undefined) { updates.push("default_risk = ?"); params.push(default_risk); }
    if (is_pro !== undefined) { updates.push("is_pro = ?"); params.push(is_pro); }
    if (preferences !== undefined) { updates.push("preferences = ?"); params.push(JSON.stringify(preferences)); }
    if (colors !== undefined) { updates.push("colors = ?"); params.push(JSON.stringify(colors)); }
    if (password) { updates.push("password = ?"); params.push(bcrypt.hashSync(password, 8)); }
    if (updates.length === 0) return res.json({ message: "Rien à modifier" });
    params.push(req.user.id);
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
            let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
            let userColors = {}; try { userColors = JSON.parse(user.colors); } catch(e) {}
            res.json({ message: "Profil mis à jour", user: { ...user, password: '', preferences: prefs, colors: userColors } });
        });
    });
});
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
    const url = `/uploads/${req.file.filename}`;
    db.run(`UPDATE users SET avatar_url = ? WHERE id = ?`, [url, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Avatar OK", avatar_url: url });
    });
});

// ... (Routes Accounts inchangées) ...
app.get('/api/accounts', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM accounts WHERE user_id = ?`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows.length === 0) {
            const date = new Date().toISOString();
            db.run(`INSERT INTO accounts (user_id, name, color, max_risk, default_rr, created_at) VALUES (?, ?, ?, ?, ?, ?)`, [req.user.id, 'Compte Principal', '#4f46e5', 2.0, 2.0, date], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json([{ id: this.lastID, user_id: req.user.id, name: 'Compte Principal', color: '#4f46e5', max_risk: 2.0, default_rr: 2.0 }]);
            });
        } else { res.json(rows); }
    });
});
app.post('/api/accounts', authenticateToken, (req, res) => {
    const { name, description, broker, platform, color, currency, max_risk, default_rr, commission_pct, commission_min, commission_max } = req.body;
    const date = new Date().toISOString();
    db.run(`INSERT INTO accounts (user_id, name, description, broker, platform, color, currency, max_risk, default_rr, commission_pct, commission_min, commission_max, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.user.id, name, description||'', broker||'', platform||'', color||'#4f46e5', currency||'USD', max_risk||2.0, default_rr||2.0, commission_pct||0, commission_min||0, commission_max||0, date], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ id: this.lastID, ...req.body }); });
});
app.put('/api/accounts/:id', authenticateToken, (req, res) => {
    const { name, description, broker, platform, color, currency, max_risk, default_rr, commission_pct, commission_min, commission_max } = req.body;
    db.run(`UPDATE accounts SET name=?, description=?, broker=?, platform=?, color=?, currency=?, max_risk=?, default_rr=?, commission_pct=?, commission_min=?, commission_max=? WHERE id=? AND user_id=?`, [name, description, broker, platform, color, currency, max_risk, default_rr, commission_pct, commission_min, commission_max, req.params.id, req.user.id], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ message: "Compte mis à jour" }); });
});
app.delete('/api/accounts/:id', authenticateToken, (req, res) => { db.serialize(() => { db.run(`DELETE FROM trades WHERE account_id = ? AND user_id = ?`, [req.params.id, req.user.id]); db.run(`DELETE FROM accounts WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ message: "Compte supprimé" }); }); }); });

// --- ROUTES TRADES (CORRECTION DU MAPPING) ---

app.get('/api/trades', authenticateToken, (req, res) => {
    const accountId = req.query.accountId;
    let sql = `SELECT * FROM trades WHERE user_id = ?`;
    let params = [req.user.id];
    if (accountId) { sql += ` AND account_id = ?`; params.push(accountId); }
    sql += ` ORDER BY date DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(r => ({
            ...r,
            // ⚠️ CORRECTION CRITIQUE : Mapping discipline_score (BDD) -> disciplineScore (Frontend)
            disciplineScore: r.discipline_score,
            disciplineDetails: r.discipline_details ? JSON.parse(r.discipline_details) : {},
            isOffPlan: !!r.is_off_plan,
            riskRespected: !!r.risk_respected,
            slMoved: !!r.sl_moved,
            hasScreenshot: !!r.has_screenshot
        }));
        res.json(parsed);
    });
});

app.post('/api/trades', authenticateToken, (req, res) => {
    // On reçoit 'disciplineScore' du frontend
    const { account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, disciplineDetails, fees, tags, isOffPlan, riskRespected, slMoved, hasScreenshot } = req.body;

    // On insère dans 'discipline_score' en BDD
    db.run(`INSERT INTO trades (user_id, account_id, pair, date, time, type, entry, exit, sl, tp, lot, profit, discipline_score, discipline_details, fees, tags, is_off_plan, risk_respected, sl_moved, has_screenshot) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
            req.user.id, account_id, pair, date, time||'', type, entry, exit, sl, tp, lot, profit,
            disciplineScore || 0, // Valeur à insérer
            JSON.stringify(disciplineDetails || {}),
            fees || 0, tags || '',
            isOffPlan ? 1 : 0, riskRespected ? 1 : 0, slMoved ? 1 : 0, hasScreenshot ? 1 : 0
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body });
        }
    );
});

app.put('/api/trades/:id', authenticateToken, (req, res) => {
    const { pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, disciplineDetails, fees, tags, isOffPlan, riskRespected, slMoved, hasScreenshot } = req.body;
    db.run(`UPDATE trades SET pair=?, date=?, time=?, type=?, entry=?, exit=?, sl=?, tp=?, lot=?, profit=?, discipline_score=?, discipline_details=?, fees=?, tags=?, is_off_plan=?, risk_respected=?, sl_moved=?, has_screenshot=? WHERE id=? AND user_id=?`,
        [pair, date, time, type, entry, exit, sl, tp, lot, profit, disciplineScore, JSON.stringify(disciplineDetails), fees, tags, isOffPlan?1:0, riskRespected?1:0, slMoved?1:0, hasScreenshot?1:0, req.params.id, req.user.id],
        function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ id: req.params.id, ...req.body }); }
    );
});

app.delete('/api/trades/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM trades WHERE id=? AND user_id=?`, [req.params.id, req.user.id], (err) => { if (err) return res.status(500).json({ error: err.message }); res.json({ message: "Supprimé" }); });
});

// ... (Autres routes Notifications/Updates/Admin inchangées) ...
app.get('/api/notifications', authenticateToken, (req, res) => { db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC`, [req.user.id], (err, rows) => res.json(rows)); });
app.put('/api/notifications/read/:id', authenticateToken, (req, res) => { db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => res.json({ message: "Read" })); });
app.put('/api/notifications/read', authenticateToken, (req, res) => { db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id], (err) => res.json({ message: "All Read" })); });
app.get('/api/updates', authenticateToken, (req, res) => { db.all(`SELECT * FROM updates ORDER BY date DESC`, [], (err, rows) => res.json(rows)); });
app.get('/api/admin/users', authenticateToken, (req, res) => { if (req.user.is_pro !== 7) return res.sendStatus(403); db.all("SELECT * FROM users", [], (err, rows) => res.json(rows)); });

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));