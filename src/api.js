// src/api.js

const hostname = window.location.hostname;
export const BASE_URL = (hostname === 'localhost' || hostname.startsWith('192.168') || hostname.startsWith('10.'))
    ? `http://${hostname}:3000`
    : '';

const API_URL = `${BASE_URL}/api`;

// --- FONCTION INTERCEPTEUR ---
const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    // Configuration des headers par défaut
    const headers = { ...options.headers };

    // Si ce n'est pas du FormData (upload image), on ajoute le Content-Type JSON
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Ajout du Token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // --- GESTION DE L'EXPIRATION (C'est ici que la magie opère) ---
        if (response.status === 401 || response.status === 403) {
            // Le token est invalide ou expiré
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // On ajoute un marqueur pour dire à la page de login d'afficher un message
            localStorage.setItem('auth_message', 'Votre session a expiré. Veuillez vous reconnecter.');

            // On recharge la page pour renvoyer l'utilisateur vers Auth/Home
            window.location.reload();
            return Promise.reject("Session expirée");
        }

        return response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export const api = {
    getAvatarUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('blob:') || path.startsWith('http')) return path;
        return `${BASE_URL}${path}`;
    },

    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),

    getUser: () => { try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; } },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

    // --- ROUTES ---
    // Note comment le code est simplifié grâce à la fonction 'request'

    login: (email, password) => request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

    register: (email, password, first_name, last_name) => request('/register', { method: 'POST', body: JSON.stringify({ email, password, first_name, last_name }) }),

    updateUser: (data) => request('/user/update', { method: 'PUT', body: JSON.stringify(data) }),

    // Pour l'upload, on passe le FormData directement, 'request' gérera les headers
    uploadAvatar: (formData) => request('/user/avatar', { method: 'POST', body: formData }),

    // COMPTES
    getAccounts: () => request('/accounts'),
    createAccount: (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    updateAccount: (id, data) => request('/accounts/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAccount: (id) => request('/accounts/' + id, { method: 'DELETE' }),

    // TRADES
    getTrades: (accountId) => request(`/trades?accountId=${accountId}`),
    addTrade: (trade) => request('/trades', { method: 'POST', body: JSON.stringify(trade) }),
    updateTrade: (id, trade) => request(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(trade) }),
    deleteTrade: (id) => request(`/trades/${id}`, { method: 'DELETE' }),

    // SCANNER (Exemple spécifique avec FormData)
    scanTradeImage: (file) => {
        const formData = new FormData();
        formData.append('image', file);
        return request('/scan-trade', { method: 'POST', body: formData });
    },

    // AUTRES
    getNotifications: () => request('/notifications'),
    markSingleNotificationRead: (id) => request(`/notifications/read/${id}`, { method: 'PUT' }),
    markNotificationsRead: () => request('/notifications/read', { method: 'PUT' }),
    getUpdates: () => request('/updates'),

    // ADMIN
    adminGetAllUsers: () => request('/admin/users'),
    adminUpdateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' })
};