import React, { useState, useEffect } from 'react';
import { Sun, Moon, Wallet, Plus, Settings, Bell } from 'lucide-react';
import { api } from './api';

// --- IMPORTS ---
import TradingBackground from './components/TradingBackground';
import TradeForm from './components/TradeForm';
import TradeHistory from './components/TradeHistory';
import PositionCalculator from './components/PositionCalculator';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import GraphView from './components/GraphView';
import UpdatesView from './components/UpdatesView';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import Home from './components/Home';

import UpgradeModal from './components/UpgradeModal';
import AlertPopup from './components/AlertPopup';
import NotificationModal from './components/NotificationModal';
import Sidebar from './components/Sidebar';
import MobileMenu from './components/MobileMenu';

function App() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('journal');
    const [isDark, setIsDark] = useState(true);
    const [trades, setTrades] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Modals & Popups
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [systemAlert, setSystemAlert] = useState(null);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [hasNewUpdates, setHasNewUpdates] = useState(false);
    const [latestUpdateId, setLatestUpdateId] = useState(0);

    // Nav
    const [viewMode, setViewMode] = useState('home');
    const [authInitialState, setAuthInitialState] = useState(false);

    // --- GESTION COULEUR DE FOND (SOLUTION VARIABLE CSS) ---
    useEffect(() => {
        const root = document.documentElement; // Cible la balise <html>
        const metaTheme = document.querySelector('meta[name="theme-color"]');

        if (viewMode === 'home' || viewMode === 'auth') {
            // MODE ACCUEIL : Tout le navigateur devient NOIR
            root.style.setProperty('--bg-global', '#000000');
            if (metaTheme) metaTheme.setAttribute('content', '#000000');
        } else {
            // MODE APP : Tout le navigateur devient GRIS (#262626)
            // Cela assure que le "rebond" en haut est gris comme la navbar
            root.style.setProperty('--bg-global', '#262626');
            if (metaTheme) metaTheme.setAttribute('content', '#262626');
        }
    }, [viewMode]); // Se déclenche quand on change de page

    // --- INITIALISATION ---
    useEffect(() => {
        const savedUser = api.getUser();
        const token = api.getToken();
        if (savedUser && token) {
            setUser(savedUser);
            if (savedUser.preferences?.defaultView) {
                const restrictedTabs = ['calendar', 'graphs'];
                const hasAccess = savedUser.is_pro >= 1;
                if (!hasAccess && restrictedTabs.includes(savedUser.preferences.defaultView)) {
                    setActiveTab('journal');
                } else {
                    setActiveTab(savedUser.preferences.defaultView);
                }
            }
            setViewMode('app');
            loadTrades();
            checkUpdates();
            checkForSystemAlerts();
            loadNotifications();
        } else {
            setViewMode('home');
        }
    }, []);

    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    // --- LOGIQUE METIER ---
    const loadTrades = async () => {
        setLoadingData(true);
        try { const data = await api.getTrades(); setTrades(data); } catch (e) {} finally { setLoadingData(false); }
    };
    const checkUpdates = async () => {
        try {
            const updates = await api.getUpdates();
            if (Array.isArray(updates) && updates.length > 0) {
                const sorted = updates.sort((a,b) => b.id - a.id);
                const newest = sorted[0];
                setLatestUpdateId(newest.id);
                const lastRead = parseInt(localStorage.getItem('last_read_update') || '0');
                if (newest.id > lastRead) setHasNewUpdates(true);
            }
        } catch (e) {}
    };
    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications();
            if (Array.isArray(data)) {
                setNotifications(data);
                const unread = data.filter(n => n.is_read === 0).length;
                setUnreadNotifsCount(unread);
            }
        } catch (e) { console.error("Erreur notifs perso", e); }
    };
    const checkForSystemAlerts = async () => {
        try {
            const data = await api.getNotifications();
            const alert = data.find(n => n.is_read === 0 && n.type === 'GRADE');
            if (alert) setSystemAlert(alert);
        } catch (e) {}
    };
    const closeSystemAlert = async (id) => {
        setSystemAlert(null);
        await api.markSingleNotificationRead(id);
        loadNotifications();
    };
    const openNotifModal = async () => {
        setShowNotifModal(true);
        setUnreadNotifsCount(0);
        await api.markNotificationsRead();
        loadNotifications();
    };
    const handleLoginSuccess = (userData) => {
        setUser(userData);
        if (userData.preferences?.defaultView) setActiveTab(userData.preferences.defaultView);
        setViewMode('app');
        loadTrades();
        setTimeout(() => { checkUpdates(); checkForSystemAlerts(); loadNotifications(); }, 500);
    };
    const handleLogout = () => {
        api.removeToken();
        setUser(null);
        setTrades([]);
        setActiveTab('journal');
        setViewMode('home');
    };
    const handleUpdateUser = async (updatedData) => {
        const res = await api.updateUser(updatedData);
        setUser(res.user);
        api.setUser(res.user);
    };
    const navigateToAuth = (isSignUp = false) => { setAuthInitialState(isSignUp); setViewMode('auth'); };
    const handleNavClick = (tab) => {
        const freeTabs = ['journal', 'calculator', 'settings', 'updates'];
        if (tab === 'updates') {
            setHasNewUpdates(false);
            if (latestUpdateId > 0) localStorage.setItem('last_read_update', latestUpdateId.toString());
        }
        if (user?.is_pro >= 1 || freeTabs.includes(tab)) setActiveTab(tab);
        else setShowUpgradeModal(true);
    };
    const handleOpenAddModal = () => { setEditingTrade(null); setIsModalOpen(true); };
    const handleOpenEditModal = (trade) => { setEditingTrade(trade); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingTrade(null); };
    const addTrade = async (trade) => { const newTrade = await api.addTrade(trade); setTrades([newTrade, ...trades]); handleCloseModal(); };
    const updateTrade = async (tradeData) => { const updatedTrade = await api.updateTrade(tradeData.id, tradeData); setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t)); handleCloseModal(); };
    const deleteTrade = async (id) => { if (!window.confirm("Supprimer ?")) return; await api.deleteTrade(id); setTrades(trades.filter(t => t.id !== id)); };

    const getCurrencySymbol = (code) => { switch(code) { case 'EUR': return '€'; case 'GBP': return '£'; default: return '$'; } };
    const currencyCode = user?.preferences?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currencyCode);
    const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);

    // --- RENDER ---

    // 1. HOME & AUTH : On utilise le fond géré par CSS Var (qui est passé à Noir via le useEffect)
    if (viewMode === 'home') return <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}><TradingBackground /><Home onNavigateToAuth={navigateToAuth} /></div>;
    if (viewMode === 'auth') return <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}><TradingBackground /><div className="relative z-10 container mx-auto px-4 py-8"><div className="flex justify-between mb-4"><button onClick={() => setViewMode('home')} className="text-white/70 hover:text-white font-bold flex items-center gap-2">← Retour</button><button onClick={() => setIsDark(!isDark)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button></div><Auth onLoginSuccess={handleLoginSuccess} initialSignUp={authInitialState} /></div></div>;

    // 2. APP CONNECTÉE
    // Le useEffect a passé le fond HTML à #262626 (Gris).
    // Mais on veut que le contenu PRINCIPAL reste Noir.
    return (
        <div className={`h-[100dvh] w-full transition-colors duration-300 ${isDark ? 'dark' : ''} overflow-hidden flex flex-col`}>
            <TradingBackground />

            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
            <AlertPopup notification={systemAlert} onClose={closeSystemAlert} />
            <NotificationModal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} notifications={notifications} />

            <div className="relative z-10 flex flex-1 h-full overflow-hidden">
                <Sidebar
                    user={user}
                    activeTab={activeTab}
                    onNavClick={handleNavClick}
                    onLogout={handleLogout}
                    hasNewUpdates={hasNewUpdates}
                    unreadNotifsCount={unreadNotifsCount}
                    onOpenNotif={openNotifModal}
                />

                <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                    {/* Header Mobile - Fond Gris (#262626) */}
                    <header className="h-16 flex-none md:hidden bg-white/80 dark:bg-[#262626] backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 z-20">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg dark:text-white">FollowTrade</span>
                            <button onClick={openNotifModal} className="relative p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                <Bell size={18} className={unreadNotifsCount > 0 ? "text-indigo-500" : ""} />
                                {unreadNotifsCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-black animate-pulse"></span>}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleNavClick('settings')} className="p-2 text-gray-500 hover:text-indigo-500"><Settings size={20} /></button>
                            <button onClick={() => setIsDark(!isDark)} className="p-2 text-gray-500">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
                        </div>
                    </header>

                    {/* CONTENU PRINCIPAL - Fond NOIR Forcé */}
                    {/* On ajoute 'bg-black' ici pour que la zone de scroll soit noire, pas grise */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 bg-gray-50 dark:bg-black">
                        <main className="max-w-7xl mx-auto pb-6">
                            {activeTab === 'journal' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"><div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div><div className="relative z-10"><div className="flex items-center gap-2 text-indigo-100 mb-2"><Wallet size={18} /> Solde Actuel</div><div className="text-4xl font-black tracking-tight">{currentBalance.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}</div></div></div></div>
                                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historique</h2><button onClick={handleOpenAddModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"><Plus size={18} /> Nouveau Trade</button></div>
                                    <TradeForm isOpen={isModalOpen} onClose={handleCloseModal} onAddTrade={addTrade} onUpdateTrade={updateTrade} tradeToEdit={editingTrade} currencySymbol={currencySymbol} />
                                    {loadingData ? <div className="text-center py-10 text-gray-400 animate-pulse">Chargement...</div> : <TradeHistory trades={trades} onDelete={deleteTrade} onEdit={handleOpenEditModal} currencySymbol={currencySymbol} />}
                                </div>
                            )}
                            {activeTab === 'updates' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><UpdatesView /></div>}
                            {activeTab === 'graphs' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><GraphView trades={trades} currencySymbol={currencySymbol} /></div>}
                            {activeTab === 'calendar' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><CalendarView trades={trades} currencySymbol={currencySymbol} /></div>}
                            {activeTab === 'calculator' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><PositionCalculator currentBalance={currentBalance} defaultRisk={user.default_risk} currencySymbol={currencySymbol} /></div>}
                            {activeTab === 'admin' && user.is_pro === 7 && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><AdminPanel /></div>}
                            {activeTab === 'settings' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <SettingsView
                                        user={user}
                                        onUpdateUser={handleUpdateUser}
                                        onClose={() => setActiveTab('journal')}
                                        onLogout={handleLogout}

                                        /* AJOUTEZ CETTE LIGNE : */
                                        onNavigate={setActiveTab}
                                    />
                                </div>
                            )}
                        </main>
                    </div>

                    <div className="flex-none z-20 md:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
                        <MobileMenu activeTab={activeTab} onNavClick={handleNavClick} user={user} hasNewUpdates={hasNewUpdates} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;