// src/api.js

// Détection dynamique de l'IP pour que ça marche sur Mobile ET PC
const hostname = window.location.hostname; // ex: 'localhost' ou '192.168.1.15'

export const BASE_URL = (hostname === 'localhost' || hostname.startsWith('192.168') || hostname.startsWith('10.'))
    ? `http://${hostname}:3000` // En dev/réseau local : on utilise l'IP actuelle + port 3000
    : ''; // En production (ex: Vercel/Render) : URL relative

const API_URL = `${BASE_URL}/api`;

export const api = {
    // --- UTILITAIRE IMAGE ---
    getAvatarUrl: (path) => {
        if (!path) return null;

        // 1. Blob (prévisualisation upload)
        if (path.startsWith('blob:')) return path;

        // 2. URL absolue déjà complète (ex: Google ou anciennes données)
        if (path.startsWith('http')) return path;

        // 3. Chemin relatif : on colle la BASE_URL dynamique devant
        return `${BASE_URL}${path}`;
    },

    // ... LE RESTE DU FICHIER NE CHANGE PAS ...
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),

    getUser: () => {
        try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; }
    },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

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