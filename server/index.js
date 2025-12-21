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

// --- MULTER ---
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
    if (avatarPath.startsWith('http')) return avatarPath; // Déjà complet (ex: Google Auth)

    // DÉTECTION DE L'ENVIRONNEMENT
    // Si on est en production (sur le serveur), on utilise le vrai domaine HTTPS
    const DOMAIN = process.env.NODE_ENV === 'production'
        ? 'https://followtrade.sohan-birotheau.fr'
        : 'http://localhost:3000';

    return `${DOMAIN}${avatarPath}`;
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        if (filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase())) {
            return cb(null, true);
        }
        cb(new Error("Images seulement"));
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE ---
const db = new sqlite3.Database('./journal.db', (err) => {
    if (err) console.error(err.message);
    console.log('✅ Connecté à SQLite.');
});

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
    // USERS
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
    addColumnIfNotExists('users', 'first_name', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'last_name', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'default_risk', "REAL DEFAULT 1.0");
    addColumnIfNotExists('users', 'preferences', "TEXT DEFAULT '{}'");
    addColumnIfNotExists('users', 'avatar_url', "TEXT DEFAULT ''");
    addColumnIfNotExists('users', 'is_pro', "INTEGER DEFAULT 0");

    // TRADES
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

    // UPDATES
    db.run(`CREATE TABLE IF NOT EXISTS updates (
                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   title TEXT,
                                                   content TEXT,
                                                   type TEXT,
                                                   date TEXT
            )`);

    // NOTIFICATIONS
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
                                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         user_id INTEGER,
                                                         message TEXT,
                                                         type TEXT,
                                                         is_read INTEGER DEFAULT 0,
                                                         date TEXT,
                                                         FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
        if (err) console.error("Erreur créa table notifications:", err);
        else console.log("✅ Table Notifications vérifiée/créée");
    });
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

const requireAdmin = (req, res, next) => {
    db.get(`SELECT is_pro FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        if (err || !row || row.is_pro !== 7) return res.status(403).json({ error: "Admin seulement." });
        next();
    });
};

// --- ROUTES AUTH ---
app.post('/api/register', (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    db.run(`INSERT INTO users (email, password, first_name, last_name, is_pro) VALUES (?, ?, ?, ?, 0)`,
        [email, hashedPassword, first_name || '', last_name || ''],
        function(err) {
            if (err) return res.status(400).json({ error: "Email utilisé" });
            const token = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, user: { id: this.lastID, email, first_name, last_name, is_pro: 0, avatar_url: '' } });
        }
    );
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur inconnu" });
        if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: "Mot de passe incorrect" });
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
        let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
        res.json({ token, user: { ...user, password: '', preferences: prefs } });
    });
});

app.put('/api/user/update', authenticateToken, (req, res) => {
    const { first_name, last_name, email, password, default_risk, preferences } = req.body;
    let updates = [], params = [];
    if (first_name !== undefined) { updates.push("first_name = ?"); params.push(first_name); }
    if (last_name !== undefined) { updates.push("last_name = ?"); params.push(last_name); }
    if (email !== undefined) { updates.push("email = ?"); params.push(email); }
    if (default_risk !== undefined) { updates.push("default_risk = ?"); params.push(default_risk); }
    if (preferences !== undefined) { updates.push("preferences = ?"); params.push(JSON.stringify(preferences)); }
    if (password) { updates.push("password = ?"); params.push(bcrypt.hashSync(password, 8)); }
    if (updates.length === 0) return res.json({ message: "Rien à modifier" });
    params.push(req.user.id);
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
            let prefs = {}; try { prefs = JSON.parse(user.preferences); } catch(e) {}
            res.json({ message: "Profil mis à jour", user: { ...user, password: '', preferences: prefs } });
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

// --- ADMIN USERS (UPDATE AVEC LOGS) ---
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT id, email, first_name, last_name, is_pro, avatar_url FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/admin/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();

    // On nettoie les URLs avant d'envoyer
    const usersWithSecureUrls = users.map(u => ({
        ...u,
        avatar_url: getProfilePhotoUrl(u.avatar_url)
    }));

    res.json(usersWithSecureUrls);
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { first_name, last_name, email, is_pro, avatar_url } = req.body;
    const targetId = req.params.id;

    console.log(`📝 Admin modifie User ${targetId}. Nouveau grade demandé: ${is_pro}`);

    // 1. Récupérer l'ancien état
    db.get(`SELECT * FROM users WHERE id = ?`, [targetId], (err, oldUser) => {
        if (err || !oldUser) return res.status(404).json({error: "User not found"});

        const oldGrade = parseInt(oldUser.is_pro);
        const newGrade = is_pro !== undefined ? parseInt(is_pro) : oldGrade;

        let updates = [], params = [];
        if (first_name !== undefined) { updates.push("first_name = ?"); params.push(first_name); }
        if (last_name !== undefined) { updates.push("last_name = ?"); params.push(last_name); }
        if (email !== undefined) { updates.push("email = ?"); params.push(email); }
        if (is_pro !== undefined) { updates.push("is_pro = ?"); params.push(newGrade); }
        if (avatar_url !== undefined) { updates.push("avatar_url = ?"); params.push(avatar_url); }

        if (updates.length === 0) return res.json({ message: "Rien à modifier" });
        params.push(targetId);

        // 2. Update
        db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // 3. Notification Logic
            if (oldGrade !== newGrade) {
                console.log(`⚠️ Changement de grade détecté : ${oldGrade} -> ${newGrade}`);

                let msg = "";
                let type = "GRADE";
                const date = new Date().toISOString().split('T')[0];

                if (newGrade === 1) msg = "Félicitations ! Votre compte est passé en version PRO. Profitez de tous les avantages.";
                else if (newGrade === 2) msg = "Exceptionnel ! Vous avez reçu le statut VIP. Merci de votre confiance.";
                else if (newGrade === 7) msg = "Attention : Vous avez désormais les droits ADMINISTRATEUR.";
                else if (newGrade === 0) msg = "Votre abonnement a pris fin. Votre compte est désormais en version standard (Free).";

                // Ajout de logs pour voir si l'insert se fait
                db.run(`INSERT INTO notifications (user_id, message, type, date, is_read) VALUES (?, ?, ?, ?, 0)`,
                    [targetId, msg, type, date], (err) => {
                        if (err) console.error("❌ Erreur création notif:", err);
                        else console.log("✅ Notification insérée en BDD pour l'user " + targetId);
                    });
            } else {
                console.log("ℹ️ Pas de changement de grade (ou grade identique)");
            }

            res.json({ message: "Utilisateur mis à jour" });
        });
    });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const targetId = req.params.id;
    db.run(`DELETE FROM trades WHERE user_id = ?`, [targetId], (err) => {
        db.run(`DELETE FROM users WHERE id = ?`, [targetId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "User deleted" });
        });
    });
});

// --- ROUTES UPDATES ---
app.get('/api/updates', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM updates ORDER BY date DESC`, [], (err, rows) => res.json(rows));
});
app.post('/api/admin/updates', authenticateToken, requireAdmin, (req, res) => {
    const { title, content, type, date } = req.body;
    db.run(`INSERT INTO updates (title, content, type, date) VALUES (?, ?, ?, ?)`, [title, content, type, date], function(err) { res.json({ id: this.lastID, ...req.body }); });
});
app.put('/api/admin/updates/:id', authenticateToken, requireAdmin, (req, res) => {
    const { title, content, type, date } = req.body;
    db.run(`UPDATE updates SET title=?, content=?, type=?, date=? WHERE id=?`, [title, content, type, date, req.params.id], function(err) { res.json({ message: "Updated" }); });
});
app.delete('/api/admin/updates/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run(`DELETE FROM updates WHERE id = ?`, [req.params.id], function(err) { res.json({ message: "Deleted" }); });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', authenticateToken, (req, res) => {
    console.log(`🔍 User ${req.user.id} demande ses notifs`);
    db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC`, [req.user.id], (err, rows) => {
        if(err) console.error(err);
        res.json(rows);
    });
});
app.put('/api/notifications/read/:id', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function(err) {
        res.json({ message: "Read" });
    });
});
app.put('/api/notifications/read', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id], function(err) {
        res.json({ message: "All Read" });
    });
});

// --- TRADES ---
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

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));