// Définir l'URL de base ici (http://localhost:3000 en dev, ou https://ton-site.com en prod)
// Astuce : En prod, tu peux mettre '' si le front et le back sont sur le même domaine.

//export const BASE_URL = 'http://localhost:3000';
export const BASE_URL = '';

const API_URL = `${BASE_URL}/api`;

export const api = {
    // --- UTILITAIRE IMAGE ---
    getAvatarUrl: (path) => {
        if (!path) return null;
        // Si c'est déjà une URL complète (ex: Google Auth ou Blob preview), on la retourne telle quelle
        if (path.startsWith('http') || path.startsWith('blob:')) return path;
        // Sinon, on colle l'URL du serveur devant
        return `${BASE_URL}${path}`;
    },

    // --- GESTION TOKEN & STORAGE ---
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),

    // Récupère l'utilisateur stocké (contient désormais .colors et .is_pro)
    getUser: () => {
        try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; }
    },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

    // --- AUTHENTIFICATION ---
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    },
    register: async (email, password, first_name, last_name) => {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, first_name, last_name }),
        });
        return res.json();
    },

    // --- USER PROFILE (C'est ici que les couleurs sont envoyées) ---
    updateUser: async (userData) => {
        // userData contient maintenant { ..., colors: {...}, is_pro: ... } grâce à SettingsView
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/user/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userData),
        });
        return res.json();
    },
    uploadAvatar: async (file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await fetch(`${API_URL}/user/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        return res.json();
    },

    // --- ADMIN PANEL ---
    adminGetAllUsers: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.json();
    },
    adminUpdateUser: async (id, data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    adminDeleteUser: async (id) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    // --- UPDATES (Nouveautés) ---
    getUpdates: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/updates`, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.json();
    },
    adminCreateUpdate: async (data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/updates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    adminUpdateUpdate: async (id, data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/updates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    adminDeleteUpdate: async (id) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/updates/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    // --- NOTIFICATIONS ---
    getNotifications: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.json();
    },
    markSingleNotificationRead: async (id) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/notifications/read/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },
    markNotificationsRead: async () => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/notifications/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // --- TRADES ---
    getTrades: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/trades`, { headers: { 'Authorization': `Bearer ${token}` } });
        return res.json();
    },
    addTrade: async (trade) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/trades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(trade),
        });
        return res.json();
    },
    updateTrade: async (id, trade) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/trades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(trade),
        });
        return res.json();
    },
    deleteTrade: async (id) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/trades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    }
};