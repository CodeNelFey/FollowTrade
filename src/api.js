const API_URL = 'http://localhost:3000/api';
//const API_URL = '/api'

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
    updateUser: async (userData) => {
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

    // --- ADMIN ---
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

    // --- UPDATES ---
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