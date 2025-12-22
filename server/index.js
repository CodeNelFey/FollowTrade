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
app.use(express.json());

// --- MULTER (Upload Images) ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const getProfilePhotoUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const DOMAIN = process.env.NODE_ENV === 'production'
        ? 'https://followtrade.sohan-birotheau.fr'
        : 'http://localhost:3000';
    return `${DOMAIN}${avatarPath}`;
};

const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE ---
const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error(err.message);
    console.log('✅ Connecté à SQLite.');
});

// Fonction utilitaire pour ajouter une colonne si elle manque
const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err || !rows) return;
        if (!rows.some(row => row.name === columnName)) {
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
            console.log(`Colonne ${columnName} ajoutée à ${tableName}`);
        }
    });
};

db.serialize(() => {
    // Création TABLE USERS
    db.run(`CREATE TABLE IF NOT EXISTS users (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 email TEXT UNIQUE,
                                                 password TEXT,
                                                 first_name TEXT,
                                                 last_name TEXT,
                                                 default_risk REAL DEFAULT 1.0,
                                                 preferences TEXT DEFAULT '{}',
                                                 avatar_url TEXT,
                                                 is_pro INTEGER DEFAULT 0
            )`);

    // AJOUT DE LA COLONNE COLORS (Si elle n'existe pas)
    // On met les couleurs par défaut en JSON stringifié
    const defaultColors = JSON.stringify({
        balance: '#4f46e5',
        buy: '#2563eb',
        sell: '#ea580c',
        win: '#10b981',
        loss: '#f43f5e'
    });

    addColumnIfNotExists('users', 'first_name', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'last_name', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'default_risk', "REAL DEFAULT 1.0");
    addColumnIfNotExists('users', 'preferences', "TEXT DEFAULT '{}'");
    addColumnIfNotExists('users', 'avatar_url', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'is_pro', "INTEGER DEFAULT 0");
    // C'est ici que la magie opère pour la BDD :
    addColumnIfNotExists('users', 'colors', `TEXT DEFAULT '${defaultColors}'`);

    // Autres tables (Trades, Notifications...)
    db.run(`CREATE TABLE IF NOT EXISTS trades (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, pair TEXT, date TEXT, type TEXT, entry REAL, exit REAL, sl REAL, tp REAL, lot REAL, profit REAL, FOREIGN KEY(user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS updates (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, type TEXT, date TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, message TEXT, type TEXT, is_read INTEGER DEFAULT 0, date TEXT, FOREIGN KEY(user_id) REFERENCES users(id))`);
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

// --- ROUTES AUTH ---

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Mot de passe incorrect" });

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });

        // Parsing des JSON stockés en TEXT
        let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
        let colors = {}; try { colors = JSON.parse(user.colors); } catch(e) {} // Important pour le login

        user.avatar_url = getProfilePhotoUrl(user.avatar_url);

        res.json({ token, user: { ...user, password: '', preferences: prefs, colors: colors } });
    });
});

app.post('/api/register', (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    // On laisse SQLite utiliser la valeur DEFAULT pour 'colors'
    db.run(`INSERT INTO users (email, password, first_name, last_name, is_pro) VALUES (?, ?, ?, ?, 0)`,
        [email, hashedPassword, first_name || '', last_name || ''],
        function(err) {
            if (err) return res.status(400).json({ error: "Email utilisé" });
            const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '24h' });

            // On récupère le user créé pour renvoyer les défauts au front
            db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (err, newUser) => {
                let colors = {}; try { colors = JSON.parse(newUser.colors); } catch(e) {}
                res.json({ token, user: { ...newUser, password: '', colors: colors } });
            });
        }
    );
});

// --- MISE À JOUR USER (Update Colors) ---
app.put('/api/user/update', authenticateToken, (req, res) => {
    const { first_name, last_name, email, password, default_risk, preferences, colors, is_pro } = req.body;

    let updates = [], params = [];

    if (first_name !== undefined) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name !== undefined) { updates.push("last_name = ?"); params.push(last_name); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (default_risk !== undefined) { updates.push("default_risk = ?"); params.push(default_risk); }
    if (is_pro !== undefined) { updates.push("is_pro = ?"); params.push(is_pro); }

    // Convertir Prefs en String pour la DB
    if (preferences !== undefined) { updates.push("preferences = ?"); params.push(JSON.stringify(preferences)); }

    // Convertir Colors en String pour la DB (C'EST ICI QUE ÇA SE JOUE)
    if (colors !== undefined) {
        updates.push("colors = ?");
        params.push(JSON.stringify(colors));
    }

    if (password) { updates.push("password = ?"); params.push(bcrypt.hashSync(password, 8)); }

    if (updates.length === 0) return res.json({ message: "Rien à modifier" });

    params.push(req.user.id);

    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Renvoyer le user mis à jour
        db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
            let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
            let userColors = {}; try { userColors = JSON.parse(user.colors); } catch(e) {} // Parsing inverse pour le front

            user.avatar_url = getProfilePhotoUrl(user.avatar_url);

            res.json({ message: "Profil mis à jour", user: { ...user, password: '', preferences: prefs, colors: userColors } });
        });
    });
});

// ... (Reste du fichier: Avatar, Admin, Trades - pas de changement nécessaire) ...
// Pour être sûr, les routes Trades, Notifs, etc. doivent être présentes ici comme avant.
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
    const url = `/uploads/${req.file.filename}`;
    db.run(`UPDATE users SET avatar_url = ? WHERE id = ?`, [url, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Avatar OK", avatar_url: url });
    });
});

app.get('/api/trades', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM trades WHERE user_id = ? ORDER BY date DESC`, [req.user.id], (err, rows) => res.json(rows));
});
app.post('/api/trades', authenticateToken, (req, res) => {
    const { pair, date, type, entry, exit, sl, tp, lot, profit } = req.body;
    db.run(`INSERT INTO trades (user_id, pair, date, type, entry, exit, sl, tp, lot, profit) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [req.user.id, pair, date, type, entry, exit, sl, tp, lot, profit], function(err) { res.json({ id: this.lastID, ...req.body }); });
});
app.put('/api/trades/:id', authenticateToken, (req, res) => {
    const { pair, date, type, entry, exit, sl, tp, lot, profit } = req.body;
    db.run(`UPDATE trades SET pair=?, date=?, type=?, entry=?, exit=?, sl=?, tp=?, lot=?, profit=? WHERE id=? AND user_id=?`,
        [pair, date, type, entry, exit, sl, tp, lot, profit, req.params.id, req.user.id], function(err) { res.json({ id: req.params.id, ...req.body }); });
});
app.delete('/api/trades/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM trades WHERE id=? AND user_id=?`, [req.params.id, req.user.id], (err) => { res.json({ message: "Supprimé" }); });
});
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC`, [req.user.id], (err, rows) => { res.json(rows); });
});
app.put('/api/notifications/read/:id', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) { res.json({ message: "Read" }); });
});
app.put('/api/notifications/read', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id], function(err) { res.json({ message: "All Read" }); });
});
app.get('/api/updates', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM updates ORDER BY date DESC`, [], (err, rows) => res.json(rows));
});

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));