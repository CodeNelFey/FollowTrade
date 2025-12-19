import React, { useState, useEffect } from 'react';
import { History, Calculator, Sun, Moon, LayoutDashboard, LogOut, Plus, Wallet, TrendingUp, Calendar as CalendarIcon, Settings } from 'lucide-react';
import { api } from './api';

// --- IMPORTS DES COMPOSANTS ---
import TradingBackground from './components/TradingBackground';
import TradeForm from './components/TradeForm';
import TradeHistory from './components/TradeHistory';
import PositionCalculator from './components/PositionCalculator';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import Auth from './components/Auth';

function App() {
    // --- ÉTATS GLOBAUX ---
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'calendar', 'calculator', 'settings'
    const [isDark, setIsDark] = useState(true);
    const [trades, setTrades] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- GESTION UTILISATEUR & CHARGEMENT ---
    useEffect(() => {
        const savedUser = api.getUser();
        const token = api.getToken();
        if (savedUser && token) {
            setUser(savedUser);
            // Appliquer la vue par défaut si définie
            if (savedUser.preferences?.defaultView) {
                setActiveTab(savedUser.preferences.defaultView);
            }
            loadTrades();
        }
    }, []);

    // Dark Mode
    useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDark]);

    const loadTrades = async () => {
        setLoadingData(true);
        try {
            const data = await api.getTrades();
            setTrades(data);
        } catch (error) {
            console.error("Erreur chargement trades:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        if (userData.preferences?.defaultView) {
            setActiveTab(userData.preferences.defaultView);
        }
        loadTrades();
    };

    const handleLogout = () => {
        api.removeToken();
        setUser(null);
        setTrades([]);
        setActiveTab('journal');
    };

    const handleUpdateUser = async (updatedData) => {
        try {
            const res = await api.updateUser(updatedData);
            setUser(res.user);
            api.setUser(res.user); // Mise à jour locale

            // Appliquer les préférences immédiatement
            if (res.user.preferences?.defaultView) {
                // Optionnel : changer d'onglet ou juste sauvegarder la pref
            }
        } catch (error) {
            console.error("Erreur update user:", error);
            throw error; // Laisser SettingsView gérer l'erreur visuelle
        }
    };

    const addTrade = async (trade) => {
        try {
            const newTrade = await api.addTrade(trade);
            setTrades([newTrade, ...trades]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erreur ajout trade:", error);
        }
    };

    const deleteTrade = async (id) => {
        if (!window.confirm("Supprimer ce trade ?")) return;
        try {
            await api.deleteTrade(id);
            setTrades(trades.filter(t => t.id !== id));
        } catch (error) {
            console.error("Erreur suppression:", error);
        }
    };

    // Calcul du solde actuel
    const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);

    // --- RENDER : AUTH OU APP ---
    if (!user) {
        return (
            <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-black' : 'bg-gray-100'}`}>
                <TradingBackground />
                <div className="relative z-10 container mx-auto px-4 py-8">
                    <div className="flex justify-end mb-4">
                        <button onClick={() => setIsDark(!isDark)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all">
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                    <Auth onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-black' : 'bg-gray-50'}`}>
            <TradingBackground />

            <div className="relative z-10 flex h-screen overflow-hidden">

                {/* SIDEBAR (Desktop) */}
                <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-neutral-800 p-6 gap-2">
                    <div className="flex items-center gap-3 px-2 mb-8">
                        {/* AVATAR DYNAMIQUE */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/30 bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            {user.avatar_url ? (
                                <img
                                    src={`http://localhost:3000${user.avatar_url}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold">TS</span>
                            )}
                        </div>

                        <div className="min-w-0">
                            <h1 className="font-black text-xl text-gray-900 dark:text-white tracking-tight truncate">
                                {user.first_name ? user.first_name : 'TradingSpace'}
                            </h1>
                            <span className="text-xs text-indigo-500 font-medium px-2 py-0.5 bg-indigo-500/10 rounded-full">Pro</span>
                        </div>
                    </div>

                    <nav className="space-y-1 flex-1">
                        <button onClick={() => setActiveTab('journal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'journal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            <LayoutDashboard size={20} /> Journal
                        </button>
                        <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            <CalendarIcon size={20} /> Calendrier
                        </button>
                        <button onClick={() => setActiveTab('calculator')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'calculator' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            <Calculator size={20} /> Calculatrice
                        </button>
                    </nav>

                    <div className="pt-6 border-t border-gray-200 dark:border-neutral-800 space-y-1">
                        <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                            <Settings size={20} /> Paramètres
                        </button>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                            <LogOut size={20} /> Déconnexion
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                    {/* Header Mobile & Top Bar */}
                    <header className="h-16 md:hidden bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4">
                        <span className="font-bold text-lg dark:text-white">TradingSpace</span>
                        <button onClick={() => setIsDark(!isDark)} className="p-2 text-gray-500">
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </header>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-8">
                        <main className="max-w-7xl mx-auto">

                            {/* Top Stats Bar */}
                            {activeTab === 'journal' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 text-indigo-100 mb-2">
                                                <Wallet size={18} /> Solde Actuel
                                            </div>
                                            <div className="text-4xl font-black tracking-tight">
                                                {currentBalance.toLocaleString('en-US', { style: 'currency', currency: user.preferences?.currency || 'USD' })}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Tu peux ajouter d'autres cartes stats ici */}
                                </div>
                            )}

                            {/* Contenu des Onglets */}
                            {activeTab === 'journal' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historique</h2>
                                        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95">
                                            <Plus size={18} /> Nouveau Trade
                                        </button>
                                    </div>

                                    <TradeForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTrade={addTrade} />
                                    {loadingData ? <div className="text-center py-10 text-gray-400 animate-pulse">Chargement...</div> : <TradeHistory trades={trades} onDelete={deleteTrade} />}
                                </div>
                            )}

                            {activeTab === 'calendar' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <CalendarView trades={trades} />
                                </div>
                            )}

                            {activeTab === 'calculator' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <PositionCalculator currentBalance={currentBalance} defaultRisk={user.default_risk} />
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* MODIFICATION ICI : On passe onClose */}
                                    <SettingsView
                                        user={user}
                                        onUpdateUser={handleUpdateUser}
                                        onClose={() => setActiveTab('journal')}
                                    />
                                </div>
                            )}

                        </main>
                    </div>

                    {/* Bottom Navigation (Mobile) */}
                    <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 p-2 grid grid-cols-4 gap-2">
                        <button onClick={() => setActiveTab('journal')} className={`flex flex-col items-center justify-center p-2 rounded-xl ${activeTab === 'journal' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}>
                            <LayoutDashboard size={20} />
                            <span className="text-[10px] font-medium mt-1">Journal</span>
                        </button>
                        <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center justify-center p-2 rounded-xl ${activeTab === 'calendar' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}>
                            <CalendarIcon size={20} />
                            <span className="text-[10px] font-medium mt-1">Calendrier</span>
                        </button>
                        <button onClick={() => setActiveTab('calculator')} className={`flex flex-col items-center justify-center p-2 rounded-xl ${activeTab === 'calculator' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}>
                            <Calculator size={20} />
                            <span className="text-[10px] font-medium mt-1">Calc</span>
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center justify-center p-2 rounded-xl ${activeTab === 'settings' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}>
                            <Settings size={20} />
                            <span className="text-[10px] font-medium mt-1">Options</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default App;