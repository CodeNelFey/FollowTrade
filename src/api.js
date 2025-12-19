const API_URL = 'http://localhost:3000/api';

export const api = {
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    getUser: () => {
        try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; }
    },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

    // Auth
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

    // Update User Profile
    updateUser: async (userData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/user/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData),
        });
        return res.json();
    },

    // NOUVEAU : Upload Avatar
    uploadAvatar: async (file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('avatar', file); // 'avatar' doit correspondre au nom dans le middleware multer du serveur

        const res = await fetch(`${API_URL}/user/avatar`, {
            method: 'POST',
            headers: {
                // Pas de Content-Type ici, fetch le gère automatiquement pour FormData avec les boundaries
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });
        return res.json();
    },

    // Trades
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
    deleteTrade: async (id) => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/trades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    }
};