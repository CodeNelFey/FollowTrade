import React, { useState, useEffect } from 'react';
import { Sun, Moon, Wallet, Plus, Settings, Bell, ShieldAlert, Sparkles, Crown, User, UploadCloud, Loader2, TrendingUp, TrendingDown, BrainCircuit, Activity } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { api } from './api';
import { calculateDisciplineScore } from './utils/discipline';

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
import AccountSelector from './components/AccountSelector';
import AccountFormModal from './components/AccountFormModal';

// CONSTANTES
const DEFAULT_COLORS = { balance: '#4f46e5', buy: '#2563eb', sell: '#ea580c', win: '#10b981', loss: '#f43f5e' };
const PAIRS = [
    { code: 'EURUSD', type: 'FOREX' }, { code: 'GBPUSD', type: 'FOREX' }, { code: 'USDJPY', type: 'FOREX' },
    { code: 'XAUUSD', type: 'METAL' }, { code: 'US30', type: 'INDICE' },
    { code: 'BTCUSD', type: 'CRYPTO' }, { code: 'ETHUSD', type: 'CRYPTO' },
];

function App() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('journal');
    const [isDark, setIsDark] = useState(true);
    const [trades, setTrades] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // COMPTES
    const [accounts, setAccounts] = useState([]);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    // Modals & Popups
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [systemAlert, setSystemAlert] = useState(null);

    // Drag & Drop States
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
    const [hasNewUpdates, setHasNewUpdates] = useState(false);
    const [latestUpdateId, setLatestUpdateId] = useState(0);

    const [viewMode, setViewMode] = useState('home');
    const [authInitialState, setAuthInitialState] = useState(false);
    const colors = (user?.colors) ? user.colors : DEFAULT_COLORS;

    // --- INIT ---
    useEffect(() => {
        const root = document.documentElement;
        if (viewMode === 'home' || viewMode === 'auth') root.style.setProperty('--bg-global', '#000000');
        else root.style.setProperty('--bg-global', isDark ? '#262626' : '#FFFFFF');
    }, [viewMode, isDark]);

    useEffect(() => { isDark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'); }, [isDark]);

    useEffect(() => {
        const savedUser = api.getUser();
        const token = api.getToken();
        if (savedUser && token) {
            setUser(savedUser);
            if (savedUser.preferences?.defaultView) setActiveTab(savedUser.preferences.defaultView);
            setViewMode('app');
            loadAccounts();
            checkUpdates();
            checkForSystemAlerts();
            loadNotifications();
        } else {
            setViewMode('home');
        }
    }, []);

    // --- LOGIQUE METIER & OCR ---
    const getContractSize = (pairCode) => {
        const pairInfo = PAIRS.find(p => p.code === pairCode);
        const type = pairInfo ? pairInfo.type : 'FOREX';
        switch (type) {
            case 'FOREX': return 100000; case 'METAL': return 100; case 'INDICE': return 1; case 'CRYPTO': return 1; default: return 100000;
        }
    };

    const getConversionRate = async (fromCurrency, toCurrency) => {
        if (fromCurrency === toCurrency) return 1;
        const binanceFrom = fromCurrency === 'USD' ? 'USDT' : fromCurrency;
        const binanceTo = toCurrency === 'USD' ? 'USDT' : toCurrency;
        const symbol = `${binanceFrom}${binanceTo}`;
        const inverseSymbol = `${binanceTo}${binanceFrom}`;
        try {
            let res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            if (res.ok) { const data = await res.json(); return parseFloat(data.price); }
            res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${inverseSymbol}`);
            if (res.ok) { const data = await res.json(); return 1 / parseFloat(data.price); }
            return null;
        } catch (e) { return null; }
    };

    const parseMT5Data = (text) => {
        const extracted = { fees: 0, time: '' };
        const cleanText = text.replace(/->|→|>/g, ' ').toUpperCase();
        const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        let mainLineIndex = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (line.match(/(BUY|SELL)\s+\d/)) {
                if (PAIRS.some(p => line.includes(p.code)) || line.match(/[A-Z]{6}/)) {
                    mainLineIndex = i;
                    const foundPair = PAIRS.find(p => line.includes(p.code));
                    extracted.pair = foundPair ? foundPair.code : line.match(/\b([A-Z]{6})\b/)[1];
                    const typeLotMatch = line.match(/(BUY|SELL)\s+([0-9\.]+)/);
                    if (typeLotMatch) { extracted.type = typeLotMatch[1]; extracted.lot = typeLotMatch[2]; }
                    break;
                }
            }
        }
        if (mainLineIndex === -1) return extracted;
        const relevantLines = lines.slice(mainLineIndex + 1, mainLineIndex + 15);
        for (const line of relevantLines) {
            if (!extracted.date) {
                const dateTimeMatch = line.match(/(\d{4})[\.-](\d{2})[\.-](\d{2})\s+(\d{2})[:\.](\d{2})(?:[:\.](\d{2}))?/);
                if (dateTimeMatch) { extracted.date = `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}`; extracted.time = `${dateTimeMatch[4]}:${dateTimeMatch[5]}`; }
                else { const d = line.match(/(\d{4})[\.-](\d{2})[\.-](\d{2})/); if (d) extracted.date = `${d[1]}-${d[2]}-${d[3]}`; }
            }
            if (!extracted.sl) { const sl = line.match(/(?:S|5)[\s\/\\I\|\.]*L[:\s]*([\d\.]+)/); if (sl) extracted.sl = sl[1]; }
            if (!extracted.tp) { const tp = line.match(/T[\s\/\\I\|\.]*P[:\s]*([\d\.]+)/); if (tp) extracted.tp = tp[1]; }
            const chargesMatch = line.match(/(?:CHARGES|COMMISSION|C\s*H\s*A\s*R\s*G\s*E\s*S)[:\s]*([-]?[\d\.]+)/); if (chargesMatch) extracted.fees += Math.abs(parseFloat(chargesMatch[1]));
            const swapMatch = line.match(/(?:SWAP|S\s*W\s*A\s*P)[:\s]*([-]?[\d\.]+)/); if (swapMatch) extracted.fees += Math.abs(parseFloat(swapMatch[1]));
            if (!extracted.entry && !line.includes(extracted.date)) {
                if (line.match(/(?:S|5)[\s\/\\I\|\.]*L/) || line.match(/T[\s\/\\I\|\.]*P/)) continue;
                if (line.match(/(?:CHARGES|COMMISSION|SWAP)/)) continue;
                if (!extracted.profit) { const profitLabelMatch = line.match(/PROFIT[:\s]*([-]?[\d\.]+)/); if (profitLabelMatch) extracted.profit = profitLabelMatch[1]; }
                const nums = line.match(/([-]?\d+\.\d{2,})/g);
                if (nums) { if (nums.length >= 3) { extracted.entry = nums[0]; extracted.exit = nums[1]; extracted.profit = nums[2]; } else if (nums.length === 2) { extracted.entry = nums[0]; extracted.exit = nums[1]; } }
            }
        }
        if (parseFloat(extracted.sl) === 0) extracted.sl = ''; if (parseFloat(extracted.tp) === 0) extracted.tp = ''; return extracted;
    };

    const processFileAndAddTrade = async (file) => {
        if (!currentAccount) { alert("Veuillez sélectionner un compte avant d'ajouter un trade."); return; }
        setIsProcessingFile(true);
        try {
            const result = await Tesseract.recognize(file, 'eng');
            const data = parseMT5Data(result.data.text);
            if (!data.pair) { throw new Error("Données illisibles."); }

            let finalProfit = 0;
            if (data.profit) {
                finalProfit = parseFloat(data.profit);
            } else {
                if (!data.entry || !data.exit) throw new Error("Prix manquants.");
                const entry = parseFloat(data.entry); const exit = parseFloat(data.exit); const lot = parseFloat(data.lot);
                const diff = data.type === 'BUY' ? (exit - entry) : (entry - exit);
                const contractSize = getContractSize(data.pair);
                let grossProfitQuote = diff * lot * contractSize;
                let quoteCurrency = 'USD';
                if (data.pair.length === 6) quoteCurrency = data.pair.substring(3);
                else if (['XAUUSD','US30','BTCUSD'].includes(data.pair)) quoteCurrency = 'USD';
                finalProfit = grossProfitQuote;
                if (currentAccount.currency !== quoteCurrency) {
                    if (data.pair.startsWith(currentAccount.currency)) { finalProfit = grossProfitQuote / exit; }
                    else { const rate = await getConversionRate(currentAccount.currency, quoteCurrency); if (rate) finalProfit = grossProfitQuote / rate; }
                }
                if (data.fees) finalProfit -= parseFloat(data.fees);
            }

            const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);

            const tradeForScore = {
                entry: data.entry, sl: data.sl, lot: data.lot, pair: data.pair, exit: data.exit || 0, tp: data.tp || 0,
                date: data.date, time: data.time || '12:00', isOffPlan: false, riskRespected: true, slMoved: false, tags: ['DragDrop'], hasScreenshot: true
            };
            const discipline = calculateDisciplineScore(tradeForScore, currentAccount, currentBalance);

            const newTrade = {
                account_id: currentAccount.id, pair: data.pair, type: data.type, lot: data.lot,
                entry: data.entry || 0, exit: data.exit || 0, sl: data.sl || 0, tp: data.tp || 0,
                profit: finalProfit.toFixed(2), date: data.date || new Date().toISOString().split('T')[0], time: data.time || '',
                disciplineScore: discipline.total, disciplineDetails: discipline.details
            };

            const addedTrade = await api.addTrade(newTrade);
            setTrades([addedTrade, ...trades]);
            setTimeout(() => setIsProcessingFile(false), 800);
        } catch (error) { console.error(error); alert("Erreur : " + error.message); setIsProcessingFile(false); }
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if (!user || user.is_pro < 1) { setShowUpgradeModal(true); return; } if (e.dataTransfer.files && e.dataTransfer.files[0]) processFileAndAddTrade(e.dataTransfer.files[0]); };

    const loadAccounts = async () => { try { const accs = await api.getAccounts(); setAccounts(accs); if (accs.length > 0) { if (currentAccount) { const updated = accs.find(a => a.id === currentAccount.id); if (updated) setCurrentAccount(updated); else setCurrentAccount(accs[0]); } else { setCurrentAccount(accs[0]); } } } catch (e) { console.error(e); } };

    // LOAD TRADES
    const loadTrades = async () => {
        if (!currentAccount) return;
        setLoadingData(true);
        try {
            const data = await api.getTrades(currentAccount.id);
            let runningBalance = 0;
            const processedTrades = data.sort((a,b) => new Date(a.date) - new Date(b.date)).map(t => {
                const profit = parseFloat(t.profit) || 0;
                runningBalance += profit;
                if (t.pair !== 'SOLDE' && (!t.disciplineScore || t.disciplineScore === 0) && currentAccount) {
                    const tempScore = calculateDisciplineScore(t, currentAccount, runningBalance);
                    return { ...t, disciplineScore: tempScore.total, disciplineDetails: tempScore.details };
                }
                return t;
            });
            setTrades(processedTrades.reverse());
        } catch (e) { console.error(e); } finally { setLoadingData(false); }
    };

    useEffect(() => { if (currentAccount) loadTrades(); else setTrades([]); }, [currentAccount]);

    const handleCreateAccount = async (data) => { try { const newAcc = await api.createAccount(data); setAccounts([...accounts, newAcc]); setCurrentAccount(newAcc); } catch (e) { alert("Erreur création"); } };
    const handleUpdateAccount = async (id, data) => { try { await api.updateAccount(id, data); await loadAccounts(); setIsAccountModalOpen(false); } catch (e) { alert("Erreur sauvegarde"); } };
    const handleDeleteAccount = async (id) => { if(!window.confirm("Supprimer ?")) return; try { await api.deleteAccount(id); await loadAccounts(); } catch (e) { alert("Erreur suppression"); } };
    const checkUpdates = async () => { try { const updates = await api.getUpdates(); if (Array.isArray(updates) && updates.length > 0) { const sorted = updates.sort((a,b) => b.id - a.id); const newest = sorted[0]; setLatestUpdateId(newest.id); const lastRead = parseInt(localStorage.getItem('last_read_update') || '0'); if (newest.id > lastRead) setHasNewUpdates(true); } } catch (e) {} };
    const loadNotifications = async () => { try { const data = await api.getNotifications(); if (Array.isArray(data)) { setNotifications(data); const unread = data.filter(n => n.is_read === 0).length; setUnreadNotifsCount(unread); } } catch (e) {} };
    const checkForSystemAlerts = async () => { try { const data = await api.getNotifications(); const alert = data.find(n => n.is_read === 0 && n.type === 'GRADE'); if (alert) setSystemAlert(alert); } catch (e) {} };
    const closeSystemAlert = async (id) => { setSystemAlert(null); await api.markSingleNotificationRead(id); loadNotifications(); };
    const openNotifModal = async () => { setShowNotifModal(true); setUnreadNotifsCount(0); await api.markNotificationsRead(); loadNotifications(); };
    const handleLoginSuccess = async (userData) => { setUser(userData); if (userData.preferences?.defaultView) setActiveTab(userData.preferences.defaultView); setViewMode('app'); await loadAccounts(); setTimeout(() => { checkUpdates(); checkForSystemAlerts(); loadNotifications(); }, 500); };
    const handleLogout = () => { api.removeToken(); setUser(null); setTrades([]); setAccounts([]); setCurrentAccount(null); setActiveTab('journal'); setViewMode('home'); };
    const handleUpdateUser = async (updatedData) => { const res = await api.updateUser(updatedData); setUser(res.user); api.setUser(res.user); };
    const navigateToAuth = (isSignUp = false) => { setAuthInitialState(isSignUp); setViewMode('auth'); };
    const handleNavClick = (tab) => { const freeTabs = ['journal', 'calculator', 'settings', 'updates']; if (tab === 'updates') { setHasNewUpdates(false); if (latestUpdateId > 0) localStorage.setItem('last_read_update', latestUpdateId.toString()); } if (user?.is_pro >= 1 || freeTabs.includes(tab)) setActiveTab(tab); else setShowUpgradeModal(true); };

    const handleOpenAddModal = () => { setEditingTrade(null); setIsModalOpen(true); };
    const handleOpenEditModal = (trade) => { setEditingTrade(trade); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingTrade(null); };
    const addTrade = async (trade) => { if (!currentAccount) return alert("Sélectionnez un compte"); const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0); let discipline = { total: 0, details: {} }; if (trade.pair !== 'SOLDE') { discipline = calculateDisciplineScore(trade, currentAccount, currentBalance); } const tradeWithAccount = { ...trade, account_id: currentAccount.id, disciplineScore: discipline.total, disciplineDetails: discipline.details }; const newTrade = await api.addTrade(tradeWithAccount); setTrades([newTrade, ...trades]); handleCloseModal(); };
    const updateTrade = async (tradeData) => { const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0); let discipline = { total: tradeData.disciplineScore, details: tradeData.disciplineDetails }; if (tradeData.pair !== 'SOLDE') { discipline = calculateDisciplineScore(tradeData, currentAccount, currentBalance); } const updatedData = { ...tradeData, disciplineScore: discipline.total, disciplineDetails: discipline.details }; const updatedTrade = await api.updateTrade(updatedData.id, updatedData); setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t)); handleCloseModal(); };
    const deleteTrade = async (id) => { if (!window.confirm("Supprimer ?")) return; await api.deleteTrade(id); setTrades(trades.filter(t => t.id !== id)); };
    const getCurrencySymbol = (code) => { switch(code) { case 'EUR': return '€'; case 'GBP': return '£'; default: return '$'; } };
    const currencyCode = currentAccount?.currency || user?.preferences?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currencyCode);
    const avatarSrc = user ? api.getAvatarUrl(user.avatar_url) : null;
    const activeColor = currentAccount?.color || DEFAULT_COLORS.balance;

    const currentBalance = trades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
    const realTrades = trades.filter(t => t.pair !== 'SOLDE');
    const totalPnL = realTrades.reduce((acc, t) => acc + (parseFloat(t.profit) || 0), 0);
    const avgDiscipline = realTrades.length > 0 ? Math.round(realTrades.reduce((acc, t) => acc + (t.disciplineScore || 0), 0) / realTrades.length) : 0;
    const investedCapital = currentBalance - totalPnL;
    const totalGainPct = investedCapital > 0 ? (totalPnL / investedCapital) * 100 : 0;

    const handleOpenCreateAccount = () => { setEditingAccount(null); setIsAccountModalOpen(true); };
    const handleOpenEditAccount = (acc) => { setEditingAccount(acc); setIsAccountModalOpen(true); };
    const handleSaveAccount = async (formData) => { try { if (editingAccount) { await api.updateAccount(editingAccount.id, formData); } else { await api.createAccount(formData); } await loadAccounts(); setIsAccountModalOpen(false); } catch (e) { alert("Erreur sauvegarde"); } };
    const renderMobileBadge = () => { if (user.is_pro === 7) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border border-purple-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><ShieldAlert size={10} fill="currentColor" /> ADMIN</span>; if (user.is_pro === 2) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white border border-emerald-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Sparkles size={10} fill="currentColor" /> VIP</span>; if (user.is_pro === 1) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 border border-yellow-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Crown size={10} fill="currentColor" /> PRO</span>; return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 inline-flex items-center gap-1.5 min-w-[60px] justify-center"><User size={10} /> FREE</span>; };

    if (viewMode === 'home') return <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}><TradingBackground /><Home onNavigateToAuth={navigateToAuth} /></div>;

    // --- AUTH VIEW AVEC PADDING-TOP (SAFE AREA) ---
    if (viewMode === 'auth') return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
            <TradingBackground />
            <div className="relative z-10 container mx-auto px-4 py-8 pt-[calc(2rem+env(safe-area-inset-top))]">
                <div className="flex justify-between mb-4">
                    <button onClick={() => setViewMode('home')} className="text-white/70 hover:text-white font-bold flex items-center gap-2">← Retour</button>
                    <button onClick={() => setIsDark(!isDark)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
                </div>
                <Auth onLoginSuccess={handleLoginSuccess} initialSignUp={authInitialState} />
            </div>
        </div>
    );

    return (
        <div className={`h-[100dvh] w-full transition-colors duration-300 ${isDark ? 'dark' : ''} overflow-hidden flex flex-col relative`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <TradingBackground />

            {isDragging && (<div className="absolute inset-0 z-[100] bg-indigo-600/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">{user?.is_pro >= 1 ? (<><UploadCloud size={80} className="text-white mb-4 animate-bounce" /><h2 className="text-3xl font-black text-white">Relâchez pour ajouter !</h2></>) : (<><Crown size={80} className="text-amber-400 mb-4 animate-pulse" /><h2 className="text-3xl font-black text-white">Premium Only</h2></>)}</div>)}
            {isProcessingFile && (<div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300"><div className="relative"><div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 rounded-full animate-pulse"></div><Loader2 size={64} className="text-white animate-spin relative z-10" /></div><h2 className="text-2xl font-bold text-white mt-6">Lecture de l'image...</h2><p className="text-gray-400 mt-2">Récupération du profit réel affiché</p></div>)}

            <AccountFormModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={handleSaveAccount} accountToEdit={editingAccount} />
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
            <AlertPopup notification={systemAlert} onClose={closeSystemAlert} />
            <NotificationModal isOpen={showNotifModal} onClose={() => setShowNotifModal(false)} notifications={notifications} />

            <div className="relative z-10 flex flex-1 h-full overflow-hidden">
                <Sidebar user={user} activeTab={activeTab} onNavClick={handleNavClick} onLogout={handleLogout} hasNewUpdates={hasNewUpdates} unreadNotifsCount={unreadNotifsCount} onOpenNotif={openNotifModal} />

                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <header className="flex-none md:hidden h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/80 dark:bg-[#262626] backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 z-20"><div className="flex items-center gap-3 overflow-hidden"><div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">{avatarSrc ? <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" /> : <User size={18} className="text-gray-400" />}</div><div className="flex flex-row items-center gap-2 min-w-0"><span className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">{user?.first_name || 'Trader'}</span><div className="flex-shrink-0">{renderMobileBadge()}</div></div></div><div className="flex items-center gap-2 flex-shrink-0"><button onClick={openNotifModal} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"><Bell size={20} className={unreadNotifsCount > 0 ? "text-indigo-500" : ""} />{unreadNotifsCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#262626]"></span>}</button><button onClick={() => handleNavClick('settings')} className="p-2 text-gray-500 hover:text-indigo-500 dark:text-gray-400 transition-colors"><Settings size={20} /></button><button onClick={() => setIsDark(!isDark)} className="p-2 text-gray-500 dark:text-gray-400">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button></div></header>

                    {/* --- ZONE CONTENU (AVEC PADDING AJUSTÉ) --- */}
                    {/* On utilise pb-20 pour que le contenu ne soit pas coupé par le menu flottant */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-20 md:p-8 md:pb-8 bg-gray-50 dark:bg-black relative">
                        <div className="absolute top-6 right-8 z-30 hidden md:block"><button onClick={() => setIsDark(!isDark)} className="p-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-300 hover:scale-110 transition-all active:scale-95 group">{isDark ? <Sun size={20} className="group-hover:rotate-90 transition-transform duration-500" /> : <Moon size={20} className="group-hover:-rotate-12 transition-transform duration-500" />}</button></div>

                        <main className="max-w-7xl mx-auto pb-6">
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500"><AccountSelector accounts={accounts} currentAccount={currentAccount} onSelect={setCurrentAccount} onCreate={handleCreateAccount} onUpdate={handleUpdateAccount} onDelete={handleDeleteAccount} onOpenCreate={handleOpenCreateAccount} onOpenEdit={handleOpenEditAccount} /></div>

                            {activeTab === 'journal' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                                        <div className="col-span-2 lg:col-span-1 rounded-3xl p-4 md:p-6 text-white relative overflow-hidden shadow-lg transition-all" style={{ background: `linear-gradient(135deg, ${activeColor}, #000000)` }}><div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div><div className="relative z-10"><div className="flex items-center gap-2 text-white/80 mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider"><Wallet size={16} /> Solde Actuel</div><div className="text-2xl md:text-4xl font-black tracking-tight">{currentBalance.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}</div><div className="mt-1 text-[10px] md:text-xs opacity-60 font-medium truncate">{currentAccount?.name || 'Sélectionnez un compte'}</div></div></div>
                                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-3 md:p-5 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col justify-center"><div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider"><BrainCircuit size={16} className={avgDiscipline >= 90 ? 'text-emerald-500' : (avgDiscipline >= 50 ? 'text-indigo-500' : 'text-rose-500')} /><span>Discipline</span></div><div className={`text-xl md:text-3xl font-black ${avgDiscipline >= 90 ? 'text-emerald-500' : (avgDiscipline >= 50 ? 'text-gray-800 dark:text-white' : 'text-rose-500')}`}>{avgDiscipline}%</div><div className="text-[10px] text-gray-400 font-medium">Moyenne globale</div></div>
                                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-3 md:p-5 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col justify-center"><div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider"><Activity size={16} className={totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'} /><span>Gain Total</span></div><div className={`text-xl md:text-3xl font-black ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{totalPnL > 0 ? '+' : ''}{totalPnL.toFixed(0)}<span className="text-sm font-normal text-gray-400 ml-1">{currencySymbol}</span></div><div className="text-[10px] text-gray-400 font-medium">P&L Cumulé</div></div>
                                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-3 md:p-5 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col justify-center"><div className="flex items-center gap-2 text-gray-400 mb-1 text-[10px] md:text-xs font-bold uppercase tracking-wider"><TrendingUp size={16} className={totalGainPct >= 0 ? 'text-emerald-500' : 'text-rose-500'} /><span>Croissance</span></div><div className={`text-xl md:text-3xl font-black ${totalGainPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{totalGainPct > 0 ? '+' : ''}{totalGainPct.toFixed(2)}%</div><div className="text-[10px] text-gray-400 font-medium">Sur capital investi</div></div>
                                    </div>
                                    <div className="flex justify-between items-center"><h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Historique</h2><button onClick={handleOpenAddModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 text-sm md:text-base"><Plus size={18} /> Nouveau Trade</button></div>
                                    <TradeForm isOpen={isModalOpen} onClose={handleCloseModal} onAddTrade={addTrade} onUpdateTrade={updateTrade} tradeToEdit={editingTrade} currencySymbol={currencySymbol} currentAccount={currentAccount} user={user} onShowUpgrade={() => setShowUpgradeModal(true)} currentBalance={currentBalance} />
                                    {loadingData ? <div className="text-center py-10 text-gray-400 animate-pulse">Chargement...</div> : <TradeHistory trades={trades} onDelete={deleteTrade} onEdit={handleOpenEditModal} currencySymbol={currencySymbol} colors={colors} />}
                                </div>
                            )}

                            {activeTab === 'updates' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><UpdatesView /></div>}
                            {activeTab === 'graphs' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><GraphView trades={trades} currencySymbol={currencySymbol} colors={colors} /></div>}
                            {activeTab === 'calendar' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><CalendarView trades={trades} currencySymbol={currencySymbol} colors={colors} /></div>}
                            {activeTab === 'calculator' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><PositionCalculator currentBalance={currentBalance} defaultRisk={user.default_risk} currencySymbol={currencySymbol} /></div>}
                            {activeTab === 'admin' && user.is_pro === 7 && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><AdminPanel /></div>}
                            {activeTab === 'settings' && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><SettingsView user={user} onUpdateUser={handleUpdateUser} onClose={() => setActiveTab('journal')} onLogout={handleLogout} onNavigate={setActiveTab} /></div>)}
                        </main>
                    </div>

                    {/* --- MENU MOBILE FIXE --- */}
                    {/* Utilisation de bg-black et d'une bordure noire pour masquer le vide gris */}
                    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-black border-t border-gray-200 dark:border-white/5 pb-[env(safe-area-inset-bottom)] pt-1 shadow-lg">
                        <MobileMenu activeTab={activeTab} onNavClick={handleNavClick} user={user} hasNewUpdates={hasNewUpdates} colors={colors} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;