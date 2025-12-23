import React, { useState, useEffect } from 'react';
import { Sun, Moon, Wallet, Plus, Settings, Bell, ShieldAlert, Sparkles, Crown, User } from 'lucide-react';
import { api } from './api';

// --- IMPORTS DES COMPOSANTS ---
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

// Couleurs par défaut
const DEFAULT_COLORS = {
    balance: '#4f46e5', buy: '#2563eb', sell: '#ea580c', win: '#10b981', loss: '#f43f5e'
};

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

    // Notifications & Updates
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [hasNewUpdates, setHasNewUpdates] = useState(false);
    const [latestUpdateId, setLatestUpdateId] = useState(0);

    // Navigation & Auth
    const [viewMode, setViewMode] = useState('home');
    const [authInitialState, setAuthInitialState] = useState(false);

    // --- COULEURS ACTIVES (LA MODIFICATION IMPORTANTE EST ICI) ---
    const colors = (user?.colors) ? user.colors : DEFAULT_COLORS;

    // --- GESTION DU THEME ET META TAGS ---
    useEffect(() => {
        const root = document.documentElement;
        const metaTheme = document.querySelector('meta[name="theme-color"]');

        if (viewMode === 'home' || viewMode === 'auth') {
            root.style.setProperty('--bg-global', '#000000');
            if (metaTheme) metaTheme.setAttribute('content', '#000000');
        } else {
            if (isDark) {
                root.style.setProperty('--bg-global', '#262626');
                if (metaTheme) metaTheme.setAttribute('content', '#262626');
            } else {
                root.style.setProperty('--bg-global', '#FFFFFF');
                if (metaTheme) metaTheme.setAttribute('content', '#FFFFFF');
            }
        }
    }, [viewMode, isDark]);

    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

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

    // --- LOGIQUE MÉTIER ---
    const loadTrades = async () => { setLoadingData(true); try { const data = await api.getTrades(); setTrades(data); } catch (e) {} finally { setLoadingData(false); } };

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
        } catch (e) {}
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

    // Gestion des Trades
    const handleOpenAddModal = () => { setEditingTrade(null); setIsModalOpen(true); };
    const handleOpenEditModal = (trade) => { setEditingTrade(trade); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingTrade(null); };
    const addTrade = async (trade) => { const newTrade = await api.addTrade(trade); setTrades([newTrade, ...trades]); handleCloseModal(); };
    const updateTrade = async (tradeData) => { const updatedTrade = await api.updateTrade(tradeData.id, tradeData); setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t)); handleCloseModal(); };
    const deleteTrade = async (id) => { if (!window.confirm("Supprimer ?")) return; await api.deleteTrade(id); setTrades(trades.filter(t => t.id !== id)); };

    // Helpers
    const getCurrencySymbol = (code) => { switch(code) { case 'EUR': return '€'; case 'GBP': return '£'; default: return '$'; } };
    const currencyCode = user?.preferences?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currencyCode);
    const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
    const avatarSrc = user ? api.getAvatarUrl(user.avatar_url) : null;

    const renderMobileBadge = () => {
        if (user.is_pro === 7) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border border-purple-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><ShieldAlert size={10} fill="currentColor" /> ADMIN</span>;
        if (user.is_pro === 2) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white border border-emerald-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Sparkles size={10} fill="currentColor" /> VIP</span>;
        if (user.is_pro === 1) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 border border-yellow-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Crown size={10} fill="currentColor" /> PRO</span>;
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 inline-flex items-center gap-1.5 min-w-[60px] justify-center"><User size={10} /> FREE</span>;
    };

    // --- RENDU ---

    if (viewMode === 'home') return <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}><TradingBackground /><Home onNavigateToAuth={navigateToAuth} /></div>;
    if (viewMode === 'auth') return <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}><TradingBackground /><div className="relative z-10 container mx-auto px-4 py-8"><div className="flex justify-between mb-4"><button onClick={() => setViewMode('home')} className="text-white/70 hover:text-white font-bold flex items-center gap-2">← Retour</button><button onClick={() => setIsDark(!isDark)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button></div><Auth onLoginSuccess={handleLoginSuccess} initialSignUp={authInitialState} /></div></div>;

    // RENDU PRINCIPAL AVEC LA STRUCTURE D'ORIGINE (Flex Column)
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

                    {/* Header Mobile */}
                    <header className="h-16 flex-none md:hidden bg-white/80 dark:bg-[#262626] backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 z-20">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                                {avatarSrc ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" /> : <User size={18} className="text-gray-400" />}
                            </div>
                            <div className="flex flex-row items-center gap-2 min-w-0">
                                <span className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">{user?.first_name || 'Trader'}</span>
                                <div className="flex-shrink-0">{renderMobileBadge()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={openNotifModal} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
                                <Bell size={20} className={unreadNotifsCount > 0 ? "text-indigo-500" : ""} />
                                {unreadNotifsCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#262626]"></span>}
                            </button>
                            <button onClick={() => handleNavClick('settings')} className="p-2 text-gray-500 hover:text-indigo-500 dark:text-gray-400 transition-colors"><Settings size={20} /></button>
                            <button onClick={() => setIsDark(!isDark)} className="p-2 text-gray-500 dark:text-gray-400">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
                        </div>
                    </header>

                    {/* CONTENU PRINCIPAL - Structure Flex */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8 bg-gray-50 dark:bg-black relative">

                        {/* BOUTON THEME (Desktop Only) */}
                        <div className="absolute top-6 right-8 z-30 hidden md:block">
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className="p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 hover:scale-110 transition-all active:scale-95 group"
                                title="Changer le thème"
                            >
                                {isDark ? <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />}
                            </button>
                        </div>

                        <main className="max-w-7xl mx-auto pb-6">
                            {activeTab === 'journal' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        {/* CARTE SOLDE AVEC COULEURS DYNAMIQUES */}
                                        <div
                                            className="rounded-3xl p-6 text-white relative overflow-hidden transition-all duration-300"
                                            style={{
                                                background: `linear-gradient(135deg, ${colors.balance}, #000000)`,
                                                boxShadow: `0 15px 50px -10px ${colors.balance}50, 0 5px 2px -10px ${colors.balance}10`
                                            }}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 text-white/80 mb-2"><Wallet size={18} /> Solde Actuel</div>
                                                <div className="text-4xl font-black tracking-tight">{currentBalance.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historique</h2><button onClick={handleOpenAddModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"><Plus size={18} /> Nouveau Trade</button></div>
                                    <TradeForm isOpen={isModalOpen} onClose={handleCloseModal} onAddTrade={addTrade} onUpdateTrade={updateTrade} tradeToEdit={editingTrade} currencySymbol={currencySymbol} />
                                    {/* Passage des couleurs à TradeHistory */}
                                    {loadingData ? <div className="text-center py-10 text-gray-400 animate-pulse">Chargement...</div> : <TradeHistory trades={trades} onDelete={deleteTrade} onEdit={handleOpenEditModal} currencySymbol={currencySymbol} colors={colors} />}
                                </div>
                            )}

                            {activeTab === 'updates' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><UpdatesView /></div>}

                            {/* Passage des couleurs aux Graphiques */}
                            {activeTab === 'graphs' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><GraphView trades={trades} currencySymbol={currencySymbol} colors={colors} /></div>}

                            {/* Passage des couleurs au Calendrier */}
                            {activeTab === 'calendar' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><CalendarView trades={trades} currencySymbol={currencySymbol} colors={colors} /></div>}

                            {activeTab === 'calculator' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><PositionCalculator currentBalance={currentBalance} defaultRisk={user.default_risk} currencySymbol={currencySymbol} /></div>}
                            {activeTab === 'admin' && user.is_pro === 7 && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><AdminPanel /></div>}
                            {activeTab === 'settings' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <SettingsView
                                        user={user}
                                        onUpdateUser={handleUpdateUser}
                                        onClose={() => setActiveTab('journal')}
                                        onLogout={handleLogout}
                                        onNavigate={setActiveTab}
                                    />
                                </div>
                            )}
                        </main>
                    </div>

                    {/* MENU MOBILE - STRUCTURE D'ORIGINE (Flex-none) */}
                    <div className="flex-none z-20 md:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
                        {/* Passage des couleurs au MobileMenu */}
                        <MobileMenu activeTab={activeTab} onNavClick={handleNavClick} user={user} hasNewUpdates={hasNewUpdates} colors={colors} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;