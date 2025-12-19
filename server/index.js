require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// NOUVEAUX IMPORTS
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || "super_secret_cle";

app.use(cors());
app.use(express.json());

// --- CONFIGURATION MULTER (Upload Images) ---
// On crée le dossier s'il n'existe pas
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nom unique : timestamp + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Seules les images sont autorisées (jpeg, jpg, png, gif, webp)"));
    }
});

// RENDRE LE DOSSIER UPLOADS ACCESSIBLE
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- BASE DE DONNÉES ---
const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connecté à SQLite.');
});

const addColumnIfNotExists = (tableName, columnName, columnDefinition) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) { console.error(err); return; }
        if (!rows || rows.length === 0) return;
        const columnExists = rows.some(row => row.name === columnName);
        if (!columnExists) {
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
                if (err) console.error(err.message);
                else console.log(`Migration : Colonne '${columnName}' ajoutée à '${tableName}'.`);
            });
        }
    });
};

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        first_name TEXT,
        last_name TEXT,
        default_risk REAL DEFAULT 1.0,
        preferences TEXT DEFAULT '{}',
        avatar_url TEXT
    )`);

    // MIGRATIONS
    addColumnIfNotExists('users', 'first_name', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'last_name', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'default_risk', "REAL DEFAULT 1.0");
    addColumnIfNotExists('users', 'preferences', "TEXT DEFAULT '{}'");
    // NOUVELLE COLONNE AVATAR
    addColumnIfNotExists('users', 'avatar_url', "TEXT DEFAULT ''");

    db.run(`CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        pair TEXT,
        date TEXT,
        type TEXT,
        entry REAL,
        exit REAL,
        sl REAL,
        tp REAL,
        lot REAL,
        profit REAL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
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

// --- ROUTES ---

// ... (Routes login/register existantes inchangées) ...
app.post('/api/register', (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const fName = first_name || '';
    const lName = last_name || '';

    db.run(`INSERT INTO users (email, password, first_name, last_name, default_risk, preferences, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, fName, lName, 1.0, JSON.stringify({ defaultView: 'journal', showImages: true }), ''],
        function(err) {
            if (err) return res.status(400).json({ error: "Email déjà utilisé" });
            const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '24h' });
            res.json({
                token,
                user: { id: this.lastID, email, first_name: fName, last_name: lName, default_risk: 1.0, preferences: { defaultView: 'journal', showImages: true }, avatar_url: '' }
            });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Mot de passe incorrect" });

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
        let prefs = {};
        try { prefs = JSON.parse(user.preferences); } catch(e) {}

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                default_risk: user.default_risk,
                preferences: prefs,
                avatar_url: user.avatar_url || '' // On renvoie l'avatar
            }
        });
    });
});

app.put('/api/user/update', authenticateToken, (req, res) => {
    // ... (Logique existante update textuelle inchangée) ...
    // Note: cette route gère le texte, l'upload image est séparé pour simplifier
    const { first_name, last_name, email, password, default_risk, preferences } = req.body;
    let updates = [];
    let params = [];

    if (first_name !== undefined) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name !== undefined)  { updates.push("last_name = ?"); params.push(last_name); }
    if (email !== undefined)      { updates.push("email = ?"); params.push(email); }
    if (default_risk !== undefined){ updates.push("default_risk = ?"); params.push(default_risk); }
    if (preferences !== undefined) { updates.push("preferences = ?"); params.push(JSON.stringify(preferences)); }
    if (password) { updates.push("password = ?"); params.push(bcrypt.hashSync(password, 8)); }

    if (updates.length === 0) return res.json({ message: "Rien à modifier" });

    params.push(req.user.id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
            let prefs = {};
            try { prefs = JSON.parse(user.preferences); } catch(e) {}
            res.json({
                message: "Profil mis à jour",
                user: {
                    id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, default_risk: user.default_risk, preferences: prefs, avatar_url: user.avatar_url
                }
            });
        });
    });
});

// --- NOUVELLE ROUTE : UPLOAD AVATAR ---
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    // URL accessible depuis le front
    const avatarUrl = `/uploads/${req.file.filename}`;

    db.run(`UPDATE users SET avatar_url = ? WHERE id = ?`, [avatarUrl, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
            message: "Avatar mis à jour",
            avatar_url: avatarUrl
        });
    });
});

// --- ROUTES TRADES (Inchangées) ---
app.get('/api/trades', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM trades WHERE user_id = ? ORDER BY date DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/trades', authenticateToken, (req, res) => {
    const { pair, date, type, entry, exit, sl, tp, lot, profit } = req.body;
    const sql = `INSERT INTO trades (user_id, pair, date, type, entry, exit, sl, tp, lot, profit) VALUES (?,?,?,?,?,?,?,?,?,?)`;
    const params = [req.user.id, pair, date, type, entry, exit, sl, tp, lot, profit];
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.delete('/api/trades/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM trades WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Supprimé" });
    });
});

app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));