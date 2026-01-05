import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, SlidersHorizontal, X, Check, Pencil, Eye, Target, Clock, AlertOctagon, TrendingUp, TrendingDown, Calendar, Percent, Filter, ChevronDown, ArrowDownAZ, ArrowUpAZ, BrainCircuit, Hash, DollarSign, Activity, Scale } from 'lucide-react';
import { getScoreColor } from '../utils/discipline';

// ... (SORT_OPTIONS et getContractSize inchangés) ...
const SORT_OPTIONS = [
    { value: 'DATE_DESC', label: 'Date (Plus récent)', icon: Calendar },
    { value: 'DATE_ASC', label: 'Date (Plus ancien)', icon: Calendar, iconRotate: true },
    { value: 'PROFIT_DESC', label: 'Gain - Décroissant', icon: TrendingDown },
    { value: 'PROFIT_ASC', label: 'Gain - Croissant', icon: TrendingUp },
    { value: 'PERCENT_DESC', label: 'Perf (%) - Meilleure', icon: ArrowUpAZ },
    { value: 'PERCENT_ASC', label: 'Perf (%) - Pire', icon: ArrowDownAZ },
];

const TradeHistory = ({ trades, onDelete, onEdit, currencySymbol, colors }) => {

    const getBgColor = (color) => `${color}20`;
    const getBorderColor = (color) => `${color}40`;

    // PROTECTION 1: Filtrer les trades corrompus
    const validTrades = useMemo(() => {
        if (!Array.isArray(trades)) return [];
        return trades.filter(t => t && t.id && (t.pair || t.pair === 'SOLDE'));
    }, [trades]);

    // ... (Le reste des calculs enrichedTrades, uniquePairs reste inchangé) ...
    const uniquePairs = useMemo(() => {
        const pairs = validTrades.map(t => t.pair).filter(p => p !== 'SOLDE');
        return [...new Set(pairs)].sort();
    }, [validTrades]);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [summaryTrade, setSummaryTrade] = useState(null);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    // Filtres States...
    const [filterPairs, setFilterPairs] = useState(['ALL']);
    const [filterType, setFilterType] = useState('ALL');
    const [filterResult, setFilterResult] = useState('ALL');
    const [sortBy, setSortBy] = useState('DATE_DESC');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [minProfit, setMinProfit] = useState('');
    const [maxProfit, setMaxProfit] = useState('');
    const [minPercent, setMinPercent] = useState('');
    const [maxPercent, setMaxPercent] = useState('');

    // ... (useEffect click outside et handlers filtres inchangés) ...
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        }
        if (isSortDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSortDropdownOpen]);

    const handleTogglePair = (pair) => {
        if (pair === 'ALL') { setFilterPairs(['ALL']); } else {
            let newSelection;
            if (filterPairs.includes('ALL')) newSelection = [pair];
            else newSelection = filterPairs.includes(pair) ? filterPairs.filter(p => p !== pair) : [...filterPairs, pair];
            if (newSelection.length === 0) setFilterPairs(['ALL']); else setFilterPairs(newSelection);
        }
    };
    const isChecked = (pair) => filterPairs.includes('ALL') || filterPairs.includes(pair);
    const resetFilters = () => { setFilterPairs(['ALL']); setFilterType('ALL'); setFilterResult('ALL'); setDateStart(''); setDateEnd(''); setMinProfit(''); setMaxProfit(''); setMinPercent(''); setMaxPercent(''); setSortBy('DATE_DESC'); };

    const enrichedTrades = useMemo(() => {
        const chronological = [...validTrades].sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
        let currentBalance = 0;
        return chronological.map(trade => {
            const tradeProfit = parseFloat(trade.profit) || 0;
            currentBalance += tradeProfit;
            let percent = 0;
            if (trade.pair !== 'SOLDE' && (currentBalance - tradeProfit) > 0) {
                percent = (tradeProfit / (currentBalance - tradeProfit)) * 100;
            }
            // Recalcul simple pour l'affichage
            let calculatedRiskPct = null;
            let calculatedRR = null;
            // ... (Logique calcul optionnelle ici, ou utiliser celle stockée en DB) ...
            return { ...trade, percentString: trade.pair !== 'SOLDE' ? percent.toFixed(2) + '%' : '-', percentValue: percent, profitValue: tradeProfit };
        });
    }, [validTrades]);

    const displayedTrades = useMemo(() => {
        let result = enrichedTrades;
        if (!filterPairs.includes('ALL')) result = result.filter(t => filterPairs.includes(t.pair));
        if (filterType !== 'ALL') result = result.filter(t => t.type === filterType && t.pair !== 'SOLDE');
        if (filterResult === 'WIN') result = result.filter(t => t.profitValue > 0);
        if (filterResult === 'LOSS') result = result.filter(t => t.profitValue < 0);
        if (dateStart) result = result.filter(t => t.date >= dateStart);
        if (dateEnd) result = result.filter(t => t.date <= dateEnd);
        if (minProfit !== '') result = result.filter(t => t.profitValue >= parseFloat(minProfit));
        if (maxProfit !== '') result = result.filter(t => t.profitValue <= parseFloat(maxProfit));
        if (minPercent !== '') result = result.filter(t => t.percentValue >= parseFloat(minPercent));
        if (maxPercent !== '') result = result.filter(t => t.percentValue <= parseFloat(maxPercent));
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'DATE_DESC': return new Date(b.date) - new Date(a.date) || b.id - a.id;
                case 'DATE_ASC': return new Date(a.date) - new Date(b.date) || a.id - b.id;
                case 'PROFIT_DESC': return b.profitValue - a.profitValue;
                case 'PROFIT_ASC': return a.profitValue - b.profitValue;
                default: return 0;
            }
        });
    }, [enrichedTrades, filterPairs, filterType, filterResult, sortBy, dateStart, dateEnd, minProfit, maxProfit, minPercent, maxPercent]);

    // CSS Helpers
    const labelClass = "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block";
    const inputClass = "w-full bg-gray-100 dark:bg-neutral-800/80 border border-gray-200 dark:border-neutral-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl px-3 py-3 text-sm font-bold outline-none transition-all dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 flex items-center";
    const CustomCheckbox = ({ checked, onChange }) => (<div onClick={onChange} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${checked ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30' : 'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500'}`}>{checked && <Check size={12} className="text-white stroke-[3]" />}</div>);
    const activeFiltersCount = (!filterPairs.includes('ALL') ? 1 : 0) + (filterType !== 'ALL' ? 1 : 0) + (filterResult !== 'ALL' ? 1 : 0) + (dateStart || dateEnd ? 1 : 0) + (minProfit !== '' || maxProfit !== '' ? 1 : 0) + (minPercent !== '' || maxPercent !== '' ? 1 : 0);
    const activeSortOption = SORT_OPTIONS.find(option => option.value === sortBy);

    const renderDisciplineDetails = (trade) => {
        if (!trade.disciplineDetails || Object.keys(trade.disciplineDetails).length === 0) return null;
        const labels = { plan: "Respect du Plan", risk: "Gestion Risque", sl: "Stop Loss", time: "Horaires", doc: "Documentation" };
        return (
            <div className="grid grid-cols-2 gap-2 mt-4">
                {Object.entries(trade.disciplineDetails).map(([key, points]) => (
                    <div key={key} className={`flex items-center justify-between p-2 rounded-lg border ${points > 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'}`}>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{labels[key] || key}</span>
                        <span className={`text-xs font-black ${points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{points > 0 ? `+${points}` : '0'}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (validTrades.length === 0) return <div className="text-center text-gray-400 py-10 italic">Aucune donnée.</div>;

    return (
        <>
            {/* Header ... */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">Historique</h3>
                <button onClick={() => setIsFilterOpen(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm border ${activeFiltersCount > 0 ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}><SlidersHorizontal size={16} /><span>Filtres</span>{activeFiltersCount > 0 && <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[1.2rem] text-center">{activeFiltersCount}</span>}</button>
            </div>

            {/* LISTE MOBILE ... */}
            <div className="md:hidden space-y-3 pb-20">
                {displayedTrades.map((trade) => {
                    // PROTECTION 2: toLowerCase() sécurisé
                    const pairIcon = trade.pair ? trade.pair.toLowerCase() : 'eurusd';
                    const isTransfer = trade.pair === 'SOLDE';
                    const isWin = trade.profitValue >= 0;
                    const profitColor = isWin ? colors.win : colors.loss;
                    const typeColor = trade.type === 'BUY' ? colors.buy : (trade.type === 'SELL' ? colors.sell : colors.balance);
                    const score = trade.disciplineScore || 0;
                    const scoreColor = getScoreColor(score);

                    return (
                        <div key={trade.id} onClick={() => setSummaryTrade(trade)} className="relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm active:scale-[0.99] transition-transform">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${isTransfer ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500' : 'bg-white dark:bg-neutral-800'}`}>{isTransfer ? <Wallet size={18} /> : <img src={`/icons/${pairIcon}.png`} alt="" className="w-6 h-6 object-contain" onError={(e) => {e.target.style.display='none'}} />}</div>
                                    <div><div className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">{isTransfer ? 'Mouvement' : trade.pair}{!isTransfer && score > 0 && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border ${scoreColor.replace('text-', 'border-').replace('bg-', 'bg-opacity-10 ')}`}><BrainCircuit size={8} /> {score}</span>}</div><div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1"><Clock size={10}/> {trade.date}</div></div>
                                </div>
                                <div className="text-right"><div className="text-lg font-black" style={{ color: profitColor }}>{trade.profitValue > 0 ? '+' : ''}{trade.profit}</div>{!isTransfer && <div className="text-[10px] font-bold opacity-80" style={{ color: profitColor }}>{trade.percentString}</div>}</div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-neutral-800/50">
                                <div className="flex gap-2 items-center"><span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border" style={{ color: typeColor, backgroundColor: getBgColor(typeColor), borderColor: getBorderColor(typeColor) }}>{isTransfer ? (trade.type === 'DEPOSIT' ? 'DÉPÔT' : 'RETRAIT') : <>{trade.type === 'BUY' ? <ArrowUpCircle size={10}/> : <ArrowDownCircle size={10}/>} {trade.type}</>}</span>{!isTransfer && <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1"><Hash size={10}/> {trade.lot}</span>}</div>
                                <div className="flex items-center gap-1"><button onClick={() => setSummaryTrade(trade)} className="p-2 rounded-full bg-gray-50 dark:bg-neutral-800 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"><Eye size={16} /></button><button onClick={(e) => { e.stopPropagation(); onEdit(trade); }} className="p-2 rounded-full bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"><Pencil size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }} className="p-2 rounded-full bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={16} /></button></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- VUE PC --- */}
            <div className="hidden md:block overflow-hidden bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left select-none">
                        <thead className="bg-white/50 dark:bg-black/40 text-gray-500 dark:text-neutral-500 uppercase text-xs font-bold tracking-wider"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Paire</th><th className="px-6 py-4 text-center">Type</th><th className="px-6 py-4 text-center">Gain %</th><th className="px-6 py-4 hidden lg:table-cell">Prix</th><th className="px-6 py-4 text-right">P&L ({currencySymbol})</th><th className="px-6 py-4 text-center">Actions</th></tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {displayedTrades.map((trade) => {
                            const pairIcon = trade.pair ? trade.pair.toLowerCase() : 'eurusd';
                            const isTransfer = trade.pair === 'SOLDE';
                            const isWin = trade.profitValue >= 0;
                            const profitColor = isWin ? colors.win : colors.loss;
                            const typeColor = trade.type === 'BUY' ? colors.buy : (trade.type === 'SELL' ? colors.sell : colors.balance);
                            const score = trade.disciplineScore || 0;
                            const scoreColor = getScoreColor(score);

                            return (
                                <tr key={trade.id} onDoubleClick={() => setSummaryTrade(trade)} className={`transition-colors cursor-pointer active:scale-[0.99] active:bg-gray-100 dark:active:bg-neutral-800 ${isTransfer ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                                    <td className="px-6 py-4 text-gray-600 dark:text-neutral-400 whitespace-nowrap text-xs sm:text-sm font-mono">{trade.date}</td>
                                    <td className="px-6 py-4 font-bold text-indigo-900 dark:text-indigo-300">
                                        {isTransfer ? <span className="flex items-center gap-2 text-gray-500 dark:text-gray-300"><Wallet size={16} /> Mouvement</span> :
                                            <div className="flex items-center gap-3"><img src={`/icons/${pairIcon}.png`} alt="" className="w-6 h-6 object-contain" onError={(e) => {e.target.style.display='none'}} /><span>{trade.pair}</span>{score > 0 && (<span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ml-2 ${scoreColor}`}><BrainCircuit size={12} /> {score}%</span>)}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-center"><span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border w-20" style={{ color: typeColor, backgroundColor: getBgColor(typeColor), borderColor: getBorderColor(typeColor) }}>{isTransfer ? (trade.type === 'DEPOSIT' ? 'DÉPÔT' : 'RETRAIT') : <>{trade.type === 'BUY' ? <ArrowUpCircle size={10}/> : <ArrowDownCircle size={10}/>} {trade.type}</>}</span></td>
                                    <td className="px-6 py-4 text-center">{!isTransfer && trade.percentString !== '-' ? (<span className="font-bold text-xs px-2 py-1 rounded-md" style={{ color: profitColor, backgroundColor: getBgColor(profitColor) }}>{trade.percentValue > 0 ? '+' : ''}{trade.percentString}</span>) : <span className="text-gray-300 dark:text-neutral-700">-</span>}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-neutral-500 font-mono hidden lg:table-cell text-xs">{isTransfer ? '-' : <div className="flex flex-col"><span>In: {trade.entry}</span>{trade.exit && <span className="opacity-70">Out: {trade.exit}</span>}</div>}</td>
                                    <td className="px-6 py-4 text-right font-extrabold text-sm" style={{ color: profitColor }}>{trade.profitValue > 0 ? '+' : ''}{trade.profit}</td>
                                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-1"><button onClick={(e) => { e.stopPropagation(); setSummaryTrade(trade); }} className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg hidden md:block"><Eye size={16} /></button><button onClick={(e) => { e.stopPropagation(); onEdit(trade); }} className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><Pencil size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }} className="text-gray-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><Trash2 size={16} /></button></div></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL RETROSPECTIVE --- */}
            {summaryTrade && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSummaryTrade(null)}>
                    <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>

                        <div className="relative p-6 text-white overflow-hidden">
                            <div className={`absolute inset-0 opacity-90 ${summaryTrade.profitValue >= 0 ? 'bg-gradient-to-br from-emerald-600 to-teal-900' : 'bg-gradient-to-br from-rose-600 to-red-900'}`}></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 opacity-80 text-xs font-bold uppercase tracking-widest"><Calendar size={12} /> {summaryTrade.date}{summaryTrade.time && <> • {summaryTrade.time}</>}</div>
                                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">{summaryTrade.pair === 'SOLDE' ? 'Mouvement' : summaryTrade.pair}<span className="text-lg opacity-60 font-medium">{summaryTrade.type}</span></h1>
                                </div>
                                <button onClick={() => setSummaryTrade(null)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-colors"><X size={20} /></button>
                            </div>
                            <div className="relative z-10 mt-6 flex justify-between items-end">
                                <div><span className="block text-xs font-bold opacity-70 uppercase mb-1">Résultat Net</span><div className="text-5xl font-black tracking-tight">{summaryTrade.profitValue > 0 ? '+' : ''}{summaryTrade.profit} <span className="text-2xl align-top opacity-60">{currencySymbol}</span></div></div>
                                {summaryTrade.pair !== 'SOLDE' && (<div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xl font-bold">{summaryTrade.percentValue > 0 ? '+' : ''}{summaryTrade.percentString}</div>)}
                            </div>
                        </div>

                        {summaryTrade.pair !== 'SOLDE' && (
                            <div className="p-6 space-y-6">
                                {/* Prix */}
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 rounded-2xl p-4 border border-gray-100 dark:border-neutral-800">
                                    <div className="text-left"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Entrée</span><div className="text-xl font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.entry}</div></div>
                                    <div className="flex-1 mx-4 h-px bg-gray-300 dark:bg-neutral-700 relative"><div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full ${summaryTrade.profitValue >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>{summaryTrade.profitValue >= 0 ? <TrendingUp size={16} className="text-white"/> : <TrendingDown size={16} className="text-white"/>}</div></div>
                                    <div className="text-right"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sortie</span><div className="text-xl font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.exit}</div></div>
                                </div>

                                {/* Analyse Plan */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Target size={12} /> Analyse du Plan</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-rose-500 uppercase">Stop Loss</span><AlertOctagon size={12} className="text-rose-500"/></div><div className="font-mono font-bold text-gray-700 dark:text-gray-300">{summaryTrade.sl || '-'}</div></div>
                                        <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-emerald-500 uppercase">Take Profit</span><Target size={12} className="text-emerald-500"/></div><div className="font-mono font-bold text-gray-700 dark:text-gray-300">{summaryTrade.tp || '-'}</div></div>
                                    </div>
                                </div>

                                {/* Tags (PROTECTION 3: Safe Split) */}
                                <div className="flex flex-wrap gap-2">
                                    {summaryTrade.lot && <span className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1"><Hash size={12}/> {summaryTrade.lot} Lots</span>}
                                    {summaryTrade.tags && typeof summaryTrade.tags === 'string' && summaryTrade.tags.split(',').map((tag, i) => (
                                        tag.trim() !== '' && <span key={i} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800">{tag.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex justify-end gap-3"><button onClick={() => { onEdit(summaryTrade); setSummaryTrade(null); }} className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">Modifier</button><button onClick={() => onDelete(summaryTrade.id)} className="px-5 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">Supprimer</button></div>
                    </div>
                </div>
            )}

            {/* Modal Filtres */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}>
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-black dark:text-white">Filtres</h3><button onClick={() => setIsFilterOpen(false)}><X size={18} /></button></div>
                        {/* Contenu Filtres (Simplifié pour l'exemple, reprendre le code complet si besoin) */}
                        <div className="mt-6"><button onClick={() => setIsFilterOpen(false)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">Voir Résultats</button></div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TradeHistory;