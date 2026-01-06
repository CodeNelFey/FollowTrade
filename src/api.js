const hostname = window.location.hostname;
export const BASE_URL = (hostname === 'localhost' || hostname.startsWith('192.168') || hostname.startsWith('10.')) ? `http://${hostname}:3000` : '';
const API_URL = `${BASE_URL}/api`;

const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token'); localStorage.removeItem('user');
            localStorage.setItem('auth_message', 'Votre session a expiré. Veuillez vous reconnecter.');
            window.location.reload();
            return Promise.reject("Session expirée");
        }
        return response.json();
    } catch (error) { console.error("API Error:", error); throw error; }
};

export const api = {
    getAvatarUrl: (path) => path ? (path.startsWith('blob:') || path.startsWith('http') ? path : `${BASE_URL}${path}`) : null,
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    getUser: () => { try { return JSON.parse(localStorage.getItem('user')); } catch(e) { return null; } },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),

    login: (email, password) => request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password, first_name, last_name) => request('/register', { method: 'POST', body: JSON.stringify({ email, password, first_name, last_name }) }),
    verifyEmail: (email, code) => request('/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }),
    updateUser: (data) => request('/user/update', { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (formData) => request('/user/avatar', { method: 'POST', body: formData }),

    getAccounts: () => request('/accounts'),
    createAccount: (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    updateAccount: (id, data) => request('/accounts/' + id, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAccount: (id) => request('/accounts/' + id, { method: 'DELETE' }),

    getTrades: (accountId) => request(accountId ? `/trades?accountId=${accountId}` : '/trades'),
    addTrade: (trade) => request('/trades', { method: 'POST', body: JSON.stringify(trade) }),
    updateTrade: (id, trade) => request(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(trade) }),
    deleteTrade: (id) => request(`/trades/${id}`, { method: 'DELETE' }),

    // --- TODOLIST ---
    getTodoLists: () => request('/todo-lists'),
    createTodoList: (data) => request('/todo-lists', { method: 'POST', body: JSON.stringify(data) }),
    // NOUVELLE FONCTION POUR MODIFIER UNE LISTE
    updateTodoList: (id, data) => request(`/todo-lists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTodoList: (id) => request(`/todo-lists/${id}`, { method: 'DELETE' }),
    reorderTodoLists: (lists) => request('/todo-lists/reorder', { method: 'PUT', body: JSON.stringify({ lists }) }),

    addTodo: (data) => request('/todos', { method: 'POST', body: JSON.stringify(data) }),
    toggleTodo: (id, is_completed) => request(`/todos/${id}`, { method: 'PUT', body: JSON.stringify({ is_completed }) }),
    deleteTodo: (id) => request(`/todos/${id}`, { method: 'DELETE' }),

    getNotifications: () => request('/notifications'),
    markSingleNotificationRead: (id) => request(`/notifications/read/${id}`, { method: 'PUT' }),
    markNotificationsRead: () => request('/notifications/read', { method: 'PUT' }),
    getUpdates: () => request('/updates'),

    adminGetAllUsers: () => request('/admin/users'),
    adminUpdateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    adminCreateUpdate: (data) => request('/admin/updates', { method: 'POST', body: JSON.stringify(data) }),
    adminUpdateUpdate: (id, data) => request(`/admin/updates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    adminDeleteUpdate: (id) => request(`/admin/updates/${id}`, { method: 'DELETE' }),

    adminTestEmail: (type) => request('/admin/test-email', { method: 'POST', body: JSON.stringify({ type }) }),
};