import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, X, Calendar, ChevronDown, Check, ArrowRightLeft, Wallet, TrendingUp, Save, RefreshCw, Calculator, Camera, Loader2, Lock, Crown, BrainCircuit, Target, AlertTriangle } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { calculateDisciplineScore, checkRiskCompliance, checkRRCompliance } from '../utils/discipline';

const PAIRS = [
    { code: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX' },
    { code: 'GBPUSD', name: 'Great Britain Pound', type: 'FOREX' },
    { code: 'USDJPY', name: 'US Dollar / Yen', type: 'FOREX' },
    { code: 'XAUUSD', name: 'Gold', type: 'METAL' },
    { code: 'US30', name: 'Dow Jones', type: 'INDICE' },
    { code: 'BTCUSD', name: 'Bitcoin', type: 'CRYPTO' },
    { code: 'ETHUSD', name: 'Ethereum', type: 'CRYPTO' },
];

const TradeForm = ({ isOpen, onClose, onAddTrade, onUpdateTrade, tradeToEdit, currencySymbol, currentAccount, user, onShowUpgrade, currentBalance }) => {
    if (!isOpen) return null;

    const [mode, setMode] = useState('trade');
    const [isScanning, setIsScanning] = useState(false);
    const fileScanRef = useRef(null);

    const [formData, setFormData] = useState({
        pair: '', date: new Date().toISOString().split('T')[0], time: '12:00',
        type: 'BUY', entry: '', exit: '', sl: '', tp: '', lot: '', profit: '', fees: '',
        tags: '', hasScreenshot: false
    });

    const [transferData, setTransferData] = useState({ type: 'DEPOSIT', amount: '', date: new Date().toISOString().split('T')[0] });
    const [isPairOpen, setIsPairOpen] = useState(false);
    const [autoCalculate, setAutoCalculate] = useState(true);
    const [calcStatus, setCalcStatus] = useState('');

    const [liveStats, setLiveStats] = useState({ riskPct: 0, rr: 0, riskOk: false, rrOk: false });

    const dropdownRef = useRef(null);

    const formatTags = (value) => {
        if (!value) return '';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return '';
        return value;
    };

    // --- INITIALISATION ---
    useEffect(() => {
        if (tradeToEdit) {
            if (tradeToEdit.pair === 'SOLDE') {
                setMode('transfer');
                setTransferData({
                    type: tradeToEdit.type,
                    amount: Math.abs(parseFloat(tradeToEdit.profit)).toString(),
                    date: tradeToEdit.date
                });
            } else {
                setMode('trade');
                setFormData({
                    ...tradeToEdit,
                    tags: formatTags(tradeToEdit.tags),
                    hasScreenshot: tradeToEdit.hasScreenshot || false,
                    fees: tradeToEdit.fees || ''
                });
                setAutoCalculate(false);
            }
        } else {
            setMode('trade');
            setFormData({
                pair: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                type: 'BUY', entry: '', exit: '', sl: '', tp: '', lot: '', profit: '', fees: '',
                tags: '',
                hasScreenshot: false
            });
            setTransferData({ type: 'DEPOSIT', amount: '', date: new Date().toISOString().split('T')[0] });
            setAutoCalculate(true);
            setCalcStatus('');
            setLiveStats({ riskPct: 0, rr: 0, riskOk: false, rrOk: false });
        }
    }, [tradeToEdit, isOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPairOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- LOGIQUE OCR / PARSING MT5 (Ajoutée) ---
    const parseMT5Data = (text) => {
        const extracted = { fees: 0, time: '' };
        // Nettoyage de base
        const cleanText = text.replace(/->|→|>/g, ' ').toUpperCase();
        const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 2);

        let mainLineIndex = -1;

        // 1. Trouver la ligne principale (BUY/SELL)
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            // Regex qui cherche BUY ou SELL suivi d'un chiffre (le lot)
            if (line.match(/(BUY|SELL)\s+\d/)) {
                if (PAIRS.some(p => line.includes(p.code)) || line.match(/[A-Z]{6}/)) {
                    mainLineIndex = i;
                    const foundPair = PAIRS.find(p => line.includes(p.code));
                    extracted.pair = foundPair ? foundPair.code : line.match(/\b([A-Z]{6})\b/)[1];

                    const typeLotMatch = line.match(/(BUY|SELL)\s+([0-9\.]+)/);
                    if (typeLotMatch) {
                        extracted.type = typeLotMatch[1];
                        extracted.lot = typeLotMatch[2];
                    }
                    break;
                }
            }
        }

        if (mainLineIndex === -1) return extracted;

        // 2. Analyser les lignes autour (Date, SL, TP, Fees, Profit)
        // On regarde les 15 lignes suivantes (ou jusqu'à la fin)
        const relevantLines = lines.slice(mainLineIndex + 1, mainLineIndex + 15);

        for (const line of relevantLines) {
            // Date & Heure
            if (!extracted.date) {
                const dateTimeMatch = line.match(/(\d{4})[\.-](\d{2})[\.-](\d{2})\s+(\d{2})[:\.](\d{2})(?:[:\.](\d{2}))?/);
                if (dateTimeMatch) {
                    extracted.date = `${dateTimeMatch[1]}-${dateTimeMatch[2]}-${dateTimeMatch[3]}`;
                    extracted.time = `${dateTimeMatch[4]}:${dateTimeMatch[5]}`;
                } else {
                    const d = line.match(/(\d{4})[\.-](\d{2})[\.-](\d{2})/);
                    if (d) extracted.date = `${d[1]}-${d[2]}-${d[3]}`;
                }
            }

            // SL / TP
            if (!extracted.sl) { const sl = line.match(/(?:S|5)[\s\/\\I\|\.]*L[:\s]*([\d\.]+)/); if (sl) extracted.sl = sl[1]; }
            if (!extracted.tp) { const tp = line.match(/T[\s\/\\I\|\.]*P[:\s]*([\d\.]+)/); if (tp) extracted.tp = tp[1]; }

            // Frais (Swap / Commission)
            const chargesMatch = line.match(/(?:CHARGES|COMMISSION|C\s*H\s*A\s*R\s*G\s*E\s*S)[:\s]*([-]?[\d\.]+)/);
            if (chargesMatch) extracted.fees += Math.abs(parseFloat(chargesMatch[1]));

            const swapMatch = line.match(/(?:SWAP|S\s*W\s*A\s*P)[:\s]*([-]?[\d\.]+)/);
            if (swapMatch) extracted.fees += Math.abs(parseFloat(swapMatch[1]));

            // Prix (Entry, Exit) & Profit
            if (!extracted.entry && !line.includes(extracted.date)) {
                // Ignore les lignes SL/TP/SWAP pour la recherche de prix nus
                if (line.match(/(?:S|5)[\s\/\\I\|\.]*L/) || line.match(/T[\s\/\\I\|\.]*P/)) continue;
                if (line.match(/(?:CHARGES|COMMISSION|SWAP)/)) continue;

                if (!extracted.profit) {
                    const profitLabelMatch = line.match(/PROFIT[:\s]*([-]?[\d\.]+)/);
                    if (profitLabelMatch) extracted.profit = profitLabelMatch[1];
                }

                // Cherche une séquence de nombres (ex: 1.08500 -> 1.08600)
                const nums = line.match(/([-]?\d+\.\d{2,})/g);
                if (nums) {
                    if (nums.length >= 3) {
                        extracted.entry = nums[0];
                        extracted.exit = nums[1];
                        extracted.profit = nums[2];
                    } else if (nums.length === 2) {
                        extracted.entry = nums[0];
                        extracted.exit = nums[1];
                    }
                }
            }
        }

        // Nettoyage final
        if (parseFloat(extracted.sl) === 0) extracted.sl = '';
        if (parseFloat(extracted.tp) === 0) extracted.tp = '';

        return extracted;
    };

    const handleScanImage = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const result = await Tesseract.recognize(file, 'eng');
            const data = parseMT5Data(result.data.text);

            if (data.pair) {
                // Mise à jour du formulaire avec les données extraites
                setFormData(prev => ({
                    ...prev,
                    pair: data.pair || prev.pair,
                    type: data.type || prev.type,
                    lot: data.lot || prev.lot,
                    entry: data.entry || prev.entry,
                    exit: data.exit || prev.exit,
                    sl: data.sl || prev.sl,
                    tp: data.tp || prev.tp,
                    profit: data.profit || prev.profit,
                    fees: data.fees ? data.fees.toFixed(2) : prev.fees,
                    date: data.date || prev.date,
                    time: data.time || prev.time,
                    // Marquer qu'on a utilisé le scan
                    hasScreenshot: true,
                    tags: 'Scan MT5'
                }));
                setAutoCalculate(false); // Désactiver le calcul auto pour ne pas écraser le profit lu
            } else {
                alert("Impossible de lire les détails du trade. Assurez-vous que l'image est nette.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la lecture de l'image.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleScanClick = () => { if (user?.is_pro >= 1) fileScanRef.current?.click(); else onShowUpgrade(); };


    // --- CALCULS LIVE & HELPERS (Existants) ---
    useEffect(() => {
        if (mode !== 'trade') return;
        const entry = parseFloat(formData.entry);
        const sl = parseFloat(formData.sl);
        const tp = parseFloat(formData.tp);
        const lot = parseFloat(formData.lot);
        let stats = { riskPct: 0, rr: 0, riskOk: false, rrOk: false };

        if (!isNaN(entry) && !isNaN(sl) && !isNaN(lot) && lot > 0) {
            let contractSize = 100000;
            const p = formData.pair ? formData.pair.toUpperCase() : '';
            if (p.includes('XAU') || p.includes('GOLD')) contractSize = 100;
            else if (p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NDX')) contractSize = 1;
            else if (p.includes('JPY')) contractSize = 1000;

            const riskDist = Math.abs(entry - sl);
            const riskAmt = riskDist * lot * contractSize;
            const balanceToUse = currentBalance > 0 ? currentBalance : 0;

            if (balanceToUse > 0) {
                stats.riskPct = (riskAmt / balanceToUse) * 100;
                const targetRisk = parseFloat(currentAccount?.max_risk) || 2.0;
                stats.riskOk = checkRiskCompliance(stats.riskPct, targetRisk);
            }

            if (!isNaN(tp) && riskDist > 0) {
                const rewardDist = Math.abs(tp - entry);
                stats.rr = rewardDist / riskDist;
                const targetRR = parseFloat(currentAccount?.default_rr) || 2.0;
                stats.rrOk = checkRRCompliance(stats.rr, targetRR);
            }
        }
        setLiveStats(stats);
    }, [formData.entry, formData.sl, formData.tp, formData.lot, formData.pair, currentAccount, currentBalance]);

    const getContractSize = (pairCode) => { if (!pairCode) return 100000; const p = pairCode.toUpperCase(); if (p.includes('XAU') || p.includes('GOLD')) return 100; if (p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NDX')) return 1; if (p.includes('JPY')) return 1000; return 100000; };

    const calculateProfit = async (entryPrice, exitPrice, lotSize, pairCode, tradeType, manualFees = null) => {
        const entry = parseFloat(entryPrice); const exit = parseFloat(exitPrice); const lot = parseFloat(lotSize);
        if (isNaN(entry) || isNaN(exit) || isNaN(lot)) return;
        let diff = tradeType === 'BUY' ? (exit - entry) : (entry - exit);
        const contractSize = getContractSize(pairCode);
        let grossProfit = diff * lot * contractSize;

        if (pairCode.endsWith('USD')) { /* OK */ }
        else if (pairCode.startsWith('USD')) { grossProfit = grossProfit / exit; }

        let commission = 0;
        if (manualFees !== null && manualFees !== '') commission = Math.abs(parseFloat(manualFees));

        const netProfit = grossProfit - commission;
        setCalcStatus(commission > 0 ? `(Comm: ${commission.toFixed(2)})` : '');
        setFormData(prev => ({ ...prev, profit: netProfit.toFixed(2), fees: (manualFees !== null) ? manualFees : (commission > 0 ? commission.toFixed(2) : '') }));
    };

    useEffect(() => {
        if (!autoCalculate || mode !== 'trade') return;
        const timer = setTimeout(() => { if (formData.entry && formData.exit && formData.lot) calculateProfit(formData.entry, formData.exit, formData.lot, formData.pair, formData.type, formData.fees); }, 500);
        return () => clearTimeout(timer);
    }, [formData.entry, formData.exit, formData.lot, formData.pair, formData.type, formData.fees, autoCalculate]);


    // --- SOUMISSION ---
    const handleSubmit = (e) => {
        e.preventDefault();
        let finalData = {};

        if (mode === 'trade') {
            if(!formData.pair || !formData.entry) return;

            const tagsArray = typeof formData.tags === 'string'
                ? formData.tags.split(',').map(t => t.trim()).filter(t => t)
                : [];

            const dataForScore = { ...formData, tags: tagsArray };
            const discipline = calculateDisciplineScore(dataForScore, currentAccount, currentBalance);

            finalData = {
                ...dataForScore,
                tags: tagsArray.join(', '),
                disciplineScore: discipline.total,
                disciplineDetails: discipline.details
            };
        } else {
            if(!transferData.amount) return;
            const profitValue = transferData.type === 'DEPOSIT' ? parseFloat(transferData.amount) : -parseFloat(transferData.amount);
            finalData = { pair: 'SOLDE', type: transferData.type, date: transferData.date, entry: 0, exit: 0, sl: 0, tp: 0, lot: 0, profit: profitValue };
        }

        if (tradeToEdit) onUpdateTrade({ ...finalData, id: tradeToEdit.id });
        else onAddTrade(finalData);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };
    const selectPair = (code) => { setFormData({ ...formData, pair: code }); setIsPairOpen(false); }

    const inputContainerClass = "flex flex-col gap-1 w-full";
    const labelClass = "text-xs font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider ml-1";
    const inputClass = "w-full bg-gray-100 dark:bg-neutral-800 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-w-0 appearance-none";
    const tabClass = (active) => `flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                <div className="px-6 md:px-8 py-6 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-900/50 flex-shrink-0">
                    <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                        {mode === 'trade' ? <TrendingUp className="mr-2 text-indigo-500" /> : <Wallet className="mr-2 text-emerald-500" />}
                        {tradeToEdit ? 'Modifier' : (mode === 'trade' ? 'Nouveau Trade' : 'Gestion Solde')}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 transition-colors"><X size={20} /></button>
                </div>

                <div className="overflow-y-auto p-6 md:p-8 scrollbar-hide">
                    {/* BOUTON SCANNER */}
                    {mode === 'trade' && !tradeToEdit && (
                        <div className="mb-6 relative">
                            <input type="file" ref={fileScanRef} onChange={handleScanImage} accept="image/*" className="hidden" />
                            <button onClick={handleScanClick} disabled={isScanning} className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden ${user?.is_pro >= 1 ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30' : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/20'}`}>
                                {isScanning ? (<><Loader2 size={24} className="animate-spin" /><span className="font-bold text-sm">Lecture de l'image...</span></>) : (<><Camera size={24} className="group-hover:scale-110 transition-transform" /><div className="text-center"><span className="block font-bold text-sm">Scanner capture MT5</span></div></>)}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-4 mb-8">
                        <button type="button" onClick={() => setMode('trade')} className={tabClass(mode === 'trade')}><TrendingUp size={16} /> Trading</button>
                        <button type="button" onClick={() => setMode('transfer')} className={tabClass(mode === 'transfer')}><Wallet size={16} /> Dépôt</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'trade' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={inputContainerClass} ref={dropdownRef}>
                                        <label className={labelClass}>Paire</label>
                                        <div className="relative w-full">
                                            <button type="button" onClick={() => setIsPairOpen(!isPairOpen)} className={`${inputClass} flex items-center justify-between text-left`}>{formData.pair ? (<div className="flex items-center gap-3 truncate"><img src={`/icons/${formData.pair.toLowerCase()}.png`} alt={formData.pair} className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => {e.target.style.display='none'}} /><span className="truncate">{formData.pair}</span></div>) : <span className="text-gray-400">Sélectionner</span>}<ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ${isPairOpen ? 'rotate-180' : ''}`} /></button>
                                            {isPairOpen && (<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-700 max-h-40 overflow-y-auto z-10 p-1 w-full">{PAIRS.map((pair) => (<button key={pair.code} type="button" onClick={() => selectPair(pair.code)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-neutral-700 rounded-lg transition-colors group"><img src={`/icons/${pair.code.toLowerCase()}.png`} alt={pair.code} className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => {e.target.style.display='none'}} /><div className="text-left truncate"><div className="font-bold text-gray-900 dark:text-gray-200 text-sm truncate">{pair.code}</div></div>{formData.pair === pair.code && <Check size={16} className="ml-auto text-indigo-500 flex-shrink-0" />}</button>))}</div>)}
                                        </div>
                                    </div>
                                    <div className={inputContainerClass}><label className={labelClass}>Date & Heure</label><div className="flex gap-2"><div className="relative flex-1 min-w-0"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"><Calendar size={18} /></div><input type="date" name="date" value={formData.date} onChange={handleChange} className={`${inputClass} pl-10 w-full`} /></div><div className="relative w-24 flex-shrink-0"><input type="time" name="time" value={formData.time} onChange={handleChange} className={`${inputClass} px-1 text-center w-full`} /></div></div></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className={inputContainerClass}><label className={labelClass}>Direction</label><div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl w-full"><button type="button" onClick={() => setFormData({...formData, type: 'BUY'})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'BUY' ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>BUY</button><button type="button" onClick={() => setFormData({...formData, type: 'SELL'})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'SELL' ? 'bg-white text-orange-600 shadow-sm dark:bg-neutral-700 dark:text-orange-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>SELL</button></div></div><div className={inputContainerClass}><label className={labelClass}>Lot Size</label><input type="number" name="lot" placeholder="0.00" value={formData.lot} onChange={handleChange} className={inputClass} step="0.01" /></div></div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className={inputContainerClass}><label className={labelClass}>Entrée</label><input type="number" name="entry" value={formData.entry} onChange={handleChange} className={inputClass} step="0.00001" /></div><div className={inputContainerClass}><label className={labelClass}>Sortie</label><input type="number" name="exit" value={formData.exit} onChange={handleChange} className={inputClass} step="0.00001" /></div><div className={inputContainerClass}><label className={labelClass}>Stop Loss</label><input type="number" name="sl" value={formData.sl} onChange={handleChange} className={inputClass} step="0.00001" /></div><div className={inputContainerClass}><label className={labelClass}>Take Profit</label><input type="number" name="tp" value={formData.tp} onChange={handleChange} className={inputClass} step="0.00001" /></div></div>

                                <hr className="border-gray-200 dark:border-neutral-800" />

                                {/* --- ANALYSE LIVE --- */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4"><BrainCircuit className="text-indigo-500" size={18} /><h4 className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Analyse Stratégie (Live)</h4></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${liveStats.riskPct > 0 ? (liveStats.riskOk ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800') : 'bg-gray-50 border-gray-200 dark:bg-neutral-800/50 dark:border-neutral-800'}`}>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Risque</span>
                                            <div className="font-black text-2xl my-1" style={{ color: liveStats.riskPct > 0 ? (liveStats.riskOk ? '#10b981' : '#f43f5e') : 'inherit' }}>{liveStats.riskPct > 0 ? liveStats.riskPct.toFixed(2) + '%' : '-'}</div>
                                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500"><Target size={10} /><span>Cible : {currentAccount?.max_risk || 2}%</span></div>
                                        </div>
                                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${liveStats.rr > 0 ? (liveStats.rrOk ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800') : 'bg-gray-50 border-gray-200 dark:bg-neutral-800/50 dark:border-neutral-800'}`}>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">R:R Ratio</span>
                                            <div className="font-black text-2xl my-1" style={{ color: liveStats.rr > 0 ? (liveStats.rrOk ? '#10b981' : '#f97316') : 'inherit' }}>{liveStats.rr > 0 ? liveStats.rr.toFixed(2) : '-'}</div>
                                            <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500"><Target size={10} /><span>Cible : {currentAccount?.default_rr || 2}</span></div>
                                        </div>
                                    </div>

                                    <div className={inputContainerClass + " mt-4"}>
                                        <label className={labelClass}>Tags / Stratégie</label>
                                        <input type="text" name="tags" placeholder="Ex: Scalping, News, Gold..." value={formData.tags} onChange={handleChange} className={inputClass} />
                                    </div>
                                </div>

                                <hr className="border-gray-200 dark:border-neutral-800" />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className={inputContainerClass}><label className={labelClass}>Commission ($)</label><input type="number" name="fees" placeholder="0.00" value={formData.fees} onChange={handleChange} className={inputClass} step="0.01" /><p className="text-[9px] text-gray-400 mt-1 ml-1">Déduit automatiquement</p></div>
                                    <div className="md:col-span-2">
                                        <div className="flex justify-between items-center mb-1"><div className="flex items-center gap-2"><label className={labelClass}>Profit Net ({currencySymbol})</label>{currentBalance > 0 && formData.profit && (<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${parseFloat(formData.profit) >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>{parseFloat(formData.profit) > 0 ? '+' : ''}{((parseFloat(formData.profit) / currentBalance) * 100).toFixed(2)}%</span>)}{currentBalance > 0 && <span className="text-[9px] text-gray-400">(Solde: {currentBalance}{currencySymbol})</span>}</div><div className="flex items-center gap-2"><span className="text-[10px] text-gray-400 truncate max-w-[150px]">{calcStatus}</span><button type="button" onClick={() => setAutoCalculate(!autoCalculate)} className={`text-[10px] flex items-center gap-1 font-bold px-2 py-1 rounded-md transition-colors ${autoCalculate ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-neutral-800'}`}><RefreshCw size={10} className={autoCalculate ? "animate-spin-slow" : ""} /> {autoCalculate ? 'Auto' : 'Manuel'}</button></div></div>
                                        <input type="number" name="profit" placeholder="0.00" value={formData.profit} onChange={(e) => { setFormData({...formData, profit: e.target.value}); setAutoCalculate(false); }} className={`w-full bg-transparent text-3xl font-bold outline-none mt-1 ${parseFloat(formData.profit) >= 0 ? 'text-emerald-500' : 'text-rose-500'} placeholder-gray-300 dark:placeholder-gray-600`} />
                                    </div>
                                </div>
                            </>
                        )}
                        {mode === 'transfer' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => setTransferData({...transferData, type: 'DEPOSIT'})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${transferData.type === 'DEPOSIT' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-200 dark:border-neutral-700 text-gray-500'}`}><Wallet size={24} /> <span className="font-bold">Dépôt</span></button><button type="button" onClick={() => setTransferData({...transferData, type: 'WITHDRAWAL'})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${transferData.type === 'WITHDRAWAL' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'border-gray-200 dark:border-neutral-700 text-gray-500'}`}><ArrowRightLeft size={24} /> <span className="font-bold">Retrait</span></button></div>
                                <div className={inputContainerClass}><label className={labelClass}>Date</label><input type="date" value={transferData.date} onChange={(e) => setTransferData({...transferData, date: e.target.value})} className={`${inputClass} dark:[color-scheme:dark] min-w-0 w-full`} /></div>
                                <div className={inputContainerClass}><label className={labelClass}>Montant ({currencySymbol})</label><input type="number" placeholder="0.00" value={transferData.amount} onChange={(e) => setTransferData({...transferData, amount: e.target.value})} className={`${inputClass} text-2xl font-bold`} /></div>
                            </div>
                        )}
                        <div className="pt-4 flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-gray-200 dark:border-neutral-800"><button type="button" onClick={onClose} className="w-full md:w-auto px-6 py-3 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-center">Annuler</button><button type="submit" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">{tradeToEdit ? <Save size={18} /> : <PlusCircle size={18} />}{tradeToEdit ? 'Mettre à jour' : 'Valider'}</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TradeForm;