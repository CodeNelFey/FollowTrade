import { config } from './config';

// On utilise l'URL définie dans la config (Vide en prod, Localhost en dev)
export const BASE_URL = config.API_URL;
const API_URL = `${BASE_URL}/api`;

const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        // Gestion de l'expiration de session (401/403)
        if (response.status === 401 || response.status === 403) {
            // On ne déconnecte pas si c'est juste une erreur de login échoué
            if (!endpoint.includes('/login')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/'; // Redirection accueil
                return Promise.reject("Session expirée");
            }
        }

        // Si c'est une erreur 500 ou autre, on la lève
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error("API Request Error:", error);
        throw error;
    }
};

export const api = {
    // --- UTILITAIRES ---
    getAvatarUrl: (path) => {
        if (!path) return null;
        if (path.startsWith('blob:') || path.startsWith('http')) return path;
        return `${BASE_URL}${path}`; // Ajoute le domaine si nécessaire
    },
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    getUser: () => { try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; } },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

    // --- AUTH ---
    getMe: () => request('/user/me'),
    login: (email, password) => request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password, first_name, last_name) => request('/register', { method: 'POST', body: JSON.stringify({ email, password, first_name, last_name }) }),
    verifyEmail: (email, code) => request('/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }),

    // --- USER DATA ---
    updateUser: (data) => request('/user/update', { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (formData) => request('/user/avatar', { method: 'POST', body: formData }),

    // --- COMPTES ---
    getAccounts: () => request('/accounts'),
    createAccount: (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    updateAccount: (id, data) => request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),

    // --- TRADES ---
    getTrades: (accountId) => request(accountId ? `/trades?accountId=${accountId}` : '/trades'),
    addTrade: (trade) => request('/trades', { method: 'POST', body: JSON.stringify(trade) }),
    updateTrade: (id, trade) => request(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(trade) }),
    deleteTrade: (id) => request(`/trades/${id}`, { method: 'DELETE' }),

    // --- TODO LISTS ---
    getTodoLists: () => request('/todo-lists'),
    createTodoList: (data) => request('/todo-lists', { method: 'POST', body: JSON.stringify(data) }),
    updateTodoList: (id, data) => request(`/todo-lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTodoList: (id) => request(`/todo-lists/${id}`, { method: 'DELETE' }),
    reorderTodoLists: (lists) => request('/todo-lists/reorder', { method: 'PUT', body: JSON.stringify({ lists }) }),
    addTodo: (data) => request('/todos', { method: 'POST', body: JSON.stringify(data) }),
    toggleTodo: (id, is_completed) => request(`/todos/${id}`, { method: 'PUT', body: JSON.stringify({ is_completed }) }),
    deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),

    // --- NOTIFICATIONS & UPDATES ---
    getNotifications: () => request('/notifications'),
    markSingleNotificationRead: (id) => request(`/notifications/read/${id}`, { method: 'PUT' }),
    markNotificationsRead: () => request('/notifications/read', { method: 'PUT' }),
    getUpdates: () => request('/updates'),

    // --- PAIEMENT (STRIPE) ---
    // Utilise l'ID passé en paramètre (qui vient de config.js)
    createCheckoutSession: (priceId, planType) => request('/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ priceId, planType })
    }),

    // --- ADMIN PANEL ---
    adminCheckHealth: () => request('/admin/health'),
    adminGetTableData: (tableName) => request(`/admin/table/${tableName}`),
    adminGetAllUsers: () => request('/admin/users'),
    adminUpdateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    adminCreateUpdate: (data) => request('/admin/updates', { method: 'POST', body: JSON.stringify(data) }),
    adminUpdateUpdate: (id, data) => request(`/admin/updates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adminDeleteUpdate: (id) => request(`/admin/updates/${id}`, { method: 'DELETE' }),
    adminTestEmail: (type) => request('/admin/test-email', { method: 'POST', body: JSON.stringify({ type }) }),
};