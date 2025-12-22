import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, SlidersHorizontal, X, Check, Pencil, Eye, Target, Clock, AlertOctagon, TrendingUp, TrendingDown, Calendar, Percent, Filter, ChevronDown, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

// Options de tri
const SORT_OPTIONS = [
    { value: 'DATE_DESC', label: 'Date (Plus récent)', icon: Calendar },
    { value: 'DATE_ASC', label: 'Date (Plus ancien)', icon: Calendar, iconRotate: true },
    { value: 'PROFIT_DESC', label: 'Gain - Décroissant', icon: TrendingDown },
    { value: 'PROFIT_ASC', label: 'Gain - Croissant', icon: TrendingUp },
    { value: 'PERCENT_DESC', label: 'Perf (%) - Meilleure', icon: ArrowUpAZ },
    { value: 'PERCENT_ASC', label: 'Perf (%) - Pire', icon: ArrowDownAZ },
];

const TradeHistory = ({ trades, onDelete, onEdit, currencySymbol, colors }) => { // Ajout de colors

    // --- UTILS COULEURS ---
    const getBgColor = (color) => `${color}20`; // ~12% opacity
    const getBorderColor = (color) => `${color}40`; // ~25% opacity

    // --- LISTE DES PAIRES DISPONIBLES ---
    const uniquePairs = useMemo(() => {
        const pairs = trades.map(t => t.pair).filter(p => p !== 'SOLDE');
        return [...new Set(pairs)].sort();
    }, [trades]);

    // --- ÉTATS ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [summaryTrade, setSummaryTrade] = useState(null);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortDropdownRef = useRef(null);

    // Filtres
    const [filterPairs, setFilterPairs] = useState(['ALL']);
    const [filterType, setFilterType] = useState('ALL');
    const [filterResult, setFilterResult] = useState('ALL');
    const [sortBy, setSortBy] = useState('DATE_DESC');

    // Filtres Avancés
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [minProfit, setMinProfit] = useState('');
    const [maxProfit, setMaxProfit] = useState('');
    const [minPercent, setMinPercent] = useState('');
    const [maxPercent, setMaxPercent] = useState('');

    // --- GESTION CLIC EXTÉRIEUR ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
        }
        if (isSortDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSortDropdownOpen]);

    // --- LOGIQUE LONG PRESS ---
    const longPressTimer = useRef(null);
    const handleTouchStart = (trade) => {
        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setSummaryTrade(trade);
        }, 600);
    };
    const handleTouchEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };
    const handleTouchMove = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

    // --- LOGIQUE FILTRES ---
    const handleTogglePair = (pair) => {
        if (pair === 'ALL') {
            filterPairs.includes('ALL') ? setFilterPairs([]) : setFilterPairs(['ALL']);
        } else {
            let newSelection;
            if (filterPairs.includes('ALL')) newSelection = uniquePairs.filter(p => p !== pair);
            else newSelection = filterPairs.includes(pair) ? filterPairs.filter(p => p !== pair) : [...filterPairs, pair];
            newSelection.length === uniquePairs.length ? setFilterPairs(['ALL']) : setFilterPairs(newSelection);
        }
    };

    const isChecked = (pair) => filterPairs.includes('ALL') || filterPairs.includes(pair);

    const resetFilters = () => {
        setFilterPairs(['ALL']); setFilterType('ALL'); setFilterResult('ALL');
        setDateStart(''); setDateEnd(''); setMinProfit(''); setMaxProfit(''); setMinPercent(''); setMaxPercent('');
        setSortBy('DATE_DESC');
    };

    const enrichedTrades = useMemo(() => {
        const chronological = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
        let currentBalance = 0;
        return chronological.map(trade => {
            const tradeProfit = parseFloat(trade.profit) || 0;
            const startBalance = currentBalance;
            currentBalance += tradeProfit;
            let percent = 0; let isValidPercent = false;
            if (trade.pair !== 'SOLDE' && startBalance > 0) { percent = (tradeProfit / startBalance) * 100; isValidPercent = true; }
            return { ...trade, percentString: isValidPercent ? percent.toFixed(2) + '%' : '-', percentValue: percent, profitValue: tradeProfit };
        });
    }, [trades]);

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
                case 'PERCENT_DESC': return b.percentValue - a.percentValue;
                case 'PERCENT_ASC': return a.percentValue - b.percentValue;
                default: return 0;
            }
        });
    }, [enrichedTrades, filterPairs, filterType, filterResult, sortBy, dateStart, dateEnd, minProfit, maxProfit, minPercent, maxPercent]);

    const calculateRR = (trade) => {
        if (!trade.entry || !trade.sl || !trade.tp) return null;
        const risk = Math.abs(parseFloat(trade.entry) - parseFloat(trade.sl));
        const reward = Math.abs(parseFloat(trade.tp) - parseFloat(trade.entry));
        if (risk === 0) return null;
        return (reward / risk).toFixed(2);
    };

    // --- CLASSES CSS ---
    const labelClass = "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block";
    const inputClass = "w-full bg-gray-100 dark:bg-neutral-800/80 border border-gray-200 dark:border-neutral-700 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl px-3 py-3 text-sm font-bold outline-none transition-all dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 flex items-center";

    const CustomCheckbox = ({ checked, onChange }) => (
        <div onClick={onChange} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${checked ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-500/30' : 'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500'}`}>
            {checked && <Check size={12} className="text-white stroke-[3]" />}
        </div>
    );

    const activeFiltersCount = (!filterPairs.includes('ALL') ? 1 : 0) + (filterType !== 'ALL' ? 1 : 0) + (filterResult !== 'ALL' ? 1 : 0) + (dateStart || dateEnd ? 1 : 0) + (minProfit !== '' || maxProfit !== '' ? 1 : 0) + (minPercent !== '' || maxPercent !== '' ? 1 : 0);
    const activeSortOption = SORT_OPTIONS.find(option => option.value === sortBy);

    if (trades.length === 0) return <div className="text-center text-gray-400 py-10 italic">Aucune donnée.</div>;

    return (
        <>
            {/* --- ENTÊTE --- */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">Historique</h3>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm border
            ${activeFiltersCount > 0 ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                >
                    <SlidersHorizontal size={16} />
                    <span>Filtres</span>
                    {activeFiltersCount > 0 && <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[1.2rem] text-center">{activeFiltersCount}</span>}
                </button>
            </div>

            {/* --- VUE MOBILE : LISTE --- */}
            <div className="md:hidden space-y-3 pb-20">
                {displayedTrades.map((trade) => {
                    const isTransfer = trade.pair === 'SOLDE';
                    const isWin = trade.profitValue >= 0;

                    // Détermine la couleur active
                    const profitColor = isWin ? colors.win : colors.loss;
                    const typeColor = trade.type === 'BUY' ? colors.buy : (trade.type === 'SELL' ? colors.sell : colors.balance);

                    return (
                        <div key={trade.id} onTouchStart={() => handleTouchStart(trade)} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove} onClick={() => setSummaryTrade(trade)} className={`relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isTransfer ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                                        {isTransfer ? <Wallet size={14} /> : <img src={`/icons/${trade.pair.toLowerCase()}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.target.style.display='none'}} />}
                                    </div>
                                    <div><div className="font-bold text-gray-900 dark:text-white text-sm">{isTransfer ? 'Mouvement Solde' : trade.pair}</div><div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{trade.date}</div></div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {/* P&L DYNAMIQUE */}
                                    <div
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold border"
                                        style={{ color: profitColor, backgroundColor: getBgColor(profitColor), borderColor: getBorderColor(profitColor) }}
                                    >
                                        {trade.profitValue > 0 ? '+' : ''}{trade.profit} {currencySymbol}
                                    </div>
                                    {!isTransfer && trade.percentString !== '-' && (
                                        <span className="text-[10px] font-bold" style={{ color: profitColor }}>
                                            {trade.profitValue > 0 ? '+' : ''}{trade.percentString}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-neutral-800/50">
                                <div className="flex gap-2 items-center">
                                    {/* TYPE DYNAMIQUE */}
                                    <span
                                        className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border"
                                        style={{ color: typeColor, backgroundColor: getBgColor(typeColor), borderColor: getBorderColor(typeColor) }}
                                    >
                                         {isTransfer ? (trade.type === 'DEPOSIT' ? 'DÉPÔT' : 'RETRAIT') : trade.type}
                                     </span>
                                    {!isTransfer && <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{trade.lot} lots</span>}
                                </div>
                                <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); onEdit(trade); }} className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Pencil size={14} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }} className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={14} /></button></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- VUE PC : TABLEAU --- */}
            <div className="hidden md:block overflow-hidden bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left select-none">
                        <thead className="bg-white/50 dark:bg-black/40 text-gray-500 dark:text-neutral-500 uppercase text-xs font-bold tracking-wider">
                        <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Paire</th><th className="px-6 py-4 text-center">Type</th><th className="px-6 py-4 text-center">Gain %</th><th className="px-6 py-4 hidden lg:table-cell">Prix</th><th className="px-6 py-4 text-right">P&L ({currencySymbol})</th><th className="px-6 py-4 text-center">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {displayedTrades.map((trade) => {
                            const isTransfer = trade.pair === 'SOLDE';
                            const isWin = trade.profitValue >= 0;
                            const profitColor = isWin ? colors.win : colors.loss;
                            const typeColor = trade.type === 'BUY' ? colors.buy : (trade.type === 'SELL' ? colors.sell : colors.balance);

                            return (
                                <tr key={trade.id} onDoubleClick={() => setSummaryTrade(trade)} className={`transition-colors cursor-pointer active:scale-[0.99] active:bg-gray-100 dark:active:bg-neutral-800 ${isTransfer ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                                    <td className="px-6 py-4 text-gray-600 dark:text-neutral-400 whitespace-nowrap text-xs sm:text-sm">{trade.date}</td>
                                    <td className="px-6 py-4 font-bold text-indigo-900 dark:text-indigo-300">{isTransfer ? <span className="flex items-center gap-2 text-gray-500 dark:text-gray-300"><Wallet size={16} /> Mouvement</span> : <div className="flex items-center gap-3"><img src={`/icons/${trade.pair.toLowerCase()}.png`} alt="" className="w-6 h-6 object-contain" onError={(e) => {e.target.style.display='none'}} /><span>{trade.pair.toUpperCase()}</span></div>}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border w-16"
                                            style={{ color: typeColor, backgroundColor: getBgColor(typeColor), borderColor: getBorderColor(typeColor) }}
                                        >
                                            {isTransfer ? (trade.type === 'DEPOSIT' ? 'DÉPÔT' : 'RETRAIT') : <>{trade.type === 'BUY' ? <ArrowUpCircle size={10}/> : <ArrowDownCircle size={10}/>} {trade.type}</>}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!isTransfer && trade.percentString !== '-' ? (
                                            <span className="font-bold text-xs px-2 py-1 rounded-md" style={{ color: profitColor, backgroundColor: getBgColor(profitColor) }}>
                                                {trade.percentValue > 0 ? '+' : ''}{trade.percentString}
                                            </span>
                                        ) : <span className="text-gray-300 dark:text-neutral-700">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-neutral-500 font-mono hidden lg:table-cell text-xs">{isTransfer ? '-' : <div className="flex flex-col"><span>In: {trade.entry}</span>{trade.exit && <span className="opacity-70">Out: {trade.exit}</span>}</div>}</td>
                                    <td className="px-6 py-4 text-right font-extrabold text-sm" style={{ color: profitColor }}>{parseFloat(trade.profit) > 0 ? '+' : ''}{trade.profit} {currencySymbol}</td>
                                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-1"><button onClick={(e) => { e.stopPropagation(); setSummaryTrade(trade); }} className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg hidden md:block"><Eye size={16} /></button><button onClick={(e) => { e.stopPropagation(); onEdit(trade); }} className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><Pencil size={16} /></button><button onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }} className="text-gray-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><Trash2 size={16} /></button></div></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL DE RÉSUMÉ --- */}
            {summaryTrade && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSummaryTrade(null)}>
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header coloré dynamique */}
                        <div className="p-6 flex justify-between items-start" style={{ background: `linear-gradient(to bottom right, ${getBgColor(summaryTrade.profitValue >= 0 ? colors.win : colors.loss)}, transparent)` }}>
                            <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1"><Clock size={12}/> {summaryTrade.date}</span></div><h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">{summaryTrade.pair === 'SOLDE' ? 'Mouvement' : summaryTrade.pair}{summaryTrade.pair !== 'SOLDE' && <span className="text-xs px-2 py-1 rounded-lg border font-bold" style={{ color: summaryTrade.type === 'BUY' ? colors.buy : colors.sell, borderColor: getBorderColor(summaryTrade.type === 'BUY' ? colors.buy : colors.sell), backgroundColor: getBgColor(summaryTrade.type === 'BUY' ? colors.buy : colors.sell) }}>{summaryTrade.type}</span>}</h2></div>
                            <button onClick={() => setSummaryTrade(null)} className="p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full transition-colors"><X size={20} className="text-gray-500 dark:text-gray-300" /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <div className="text-sm font-bold text-gray-400 uppercase mb-1">Résultat Net</div>
                                <div className="text-5xl font-black tracking-tighter" style={{ color: summaryTrade.profitValue >= 0 ? colors.win : colors.loss }}>
                                    {summaryTrade.profitValue > 0 ? '+' : ''}{summaryTrade.profit} {currencySymbol}
                                </div>
                                {summaryTrade.pair !== 'SOLDE' && (
                                    <div className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold" style={{ color: summaryTrade.profitValue >= 0 ? colors.win : colors.loss, backgroundColor: getBgColor(summaryTrade.profitValue >= 0 ? colors.win : colors.loss) }}>
                                        {summaryTrade.percentString} de gain
                                    </div>
                                )}
                            </div>
                            {/* ... Reste de la modale inchangé mais propre ... */}
                            {summaryTrade.pair !== 'SOLDE' && (
                                <><div className="h-px bg-gray-100 dark:bg-neutral-800"></div><div className="grid grid-cols-2 gap-4"><div className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-100 dark:border-neutral-800"><div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><Target size={12} /> ENTRÉE</div><div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.entry}</div></div><div className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-100 dark:border-neutral-800"><div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><TrendingUp size={12} /> SORTIE</div><div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.exit}</div></div><div className="p-3 bg-gray-50 rounded-xl border border-gray-100 dark:bg-neutral-800/50 dark:border-neutral-800"><div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><AlertOctagon size={12} /> STOP LOSS</div><div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.sl || '-'}</div></div><div className="p-3 bg-gray-50 rounded-xl border border-gray-100 dark:bg-neutral-800/50 dark:border-neutral-800"><div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><Target size={12} /> TAKE PROFIT</div><div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.tp || '-'}</div></div></div></>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-neutral-800/80 border-t border-gray-100 dark:border-neutral-800 flex justify-end gap-3"><button onClick={() => { setSummaryTrade(null); onEdit(summaryTrade); }} className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">Modifier</button><button onClick={() => setSummaryTrade(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-colors">Fermer</button></div>
                    </div>
                </div>
            )}

            {/* --- MODAL FILTRES --- */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <div className="flex items-center gap-2"><h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2"><Filter size={20} className="text-indigo-500"/> Filtres</h3>{activeFiltersCount > 0 && <button onClick={resetFilters} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 px-2 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-lg transition-colors">Réinitialiser</button>}</div>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500"><X size={18} /></button>
                        </div>

                        <div className="overflow-y-auto pr-2 space-y-6">

                            {/* TRI */}
                            <div>
                                <label className={labelClass}>Trier par</label>
                                <div className="relative" ref={sortDropdownRef}>
                                    <button
                                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                        className={`${inputClass} justify-between`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {React.createElement(activeSortOption.icon, { size: 16, className: `text-indigo-500 ${activeSortOption.iconRotate ? 'rotate-180' : ''}` })}
                                            <span>{activeSortOption.label}</span>
                                        </div>
                                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isSortDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-700 overflow-hidden z-20 animate-in zoom-in-95 duration-150">
                                            {SORT_OPTIONS.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => { setSortBy(option.value); setIsSortDropdownOpen(false); }}
                                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${sortBy === option.value ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {React.createElement(option.icon, { size: 16, className: option.iconRotate ? 'rotate-180' : '' })}
                                                        {option.label}
                                                    </div>
                                                    {sortBy === option.value && <Check size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-neutral-800"></div>

                            {/* PAIRES */}
                            <div>
                                <label className={labelClass}>Paires</label>
                                <div className="bg-gray-100 dark:bg-neutral-800/50 rounded-xl p-2 max-h-32 overflow-y-auto border border-transparent transition-colors custom-scrollbar">
                                    <div onClick={() => handleTogglePair('ALL')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700 cursor-pointer transition-colors">
                                        <CustomCheckbox checked={isChecked('ALL')} onChange={() => handleTogglePair('ALL')} />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Toutes les paires</span>
                                    </div>
                                    <div className="h-px bg-gray-200 dark:bg-neutral-700 my-1"></div>
                                    {uniquePairs.map(pair => (
                                        <div key={pair} onClick={() => handleTogglePair(pair)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700 cursor-pointer transition-colors group">
                                            <CustomCheckbox checked={isChecked(pair)} onChange={() => handleTogglePair(pair)} />
                                            <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                                                <img src={`/icons/${pair.toLowerCase()}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{pair}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-neutral-800"></div>

                            {/* DATES */}
                            <div>
                                <label className={labelClass}>Période (Début - Fin)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative group"><Calendar size={14} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" /><input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className={`${inputClass} pl-9 text-xs dark:[color-scheme:dark]`} placeholder="Début" /></div>
                                    <div className="relative group"><Calendar size={14} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" /><input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className={`${inputClass} pl-9 text-xs dark:[color-scheme:dark]`} placeholder="Fin" /></div>
                                </div>
                            </div>

                            {/* TYPE & RESULTAT - BOUTONS COLORÉS DYNAMIQUES */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={labelClass}>Type de position</label>
                                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl">
                                        <button onClick={() => setFilterType('ALL')} className={`py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'ALL' ? 'bg-white dark:bg-neutral-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>TOUS</button>
                                        <button onClick={() => setFilterType('BUY')} className={`py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'BUY' ? 'shadow-lg text-white' : 'text-gray-400'}`} style={filterType === 'BUY' ? { backgroundColor: colors.buy } : {}}>BUY</button>
                                        <button onClick={() => setFilterType('SELL')} className={`py-2 rounded-lg text-xs font-bold transition-all ${filterType === 'SELL' ? 'shadow-lg text-white' : 'text-gray-400'}`} style={filterType === 'SELL' ? { backgroundColor: colors.sell } : {}}>SELL</button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Résultat du trade</label>
                                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl">
                                        <button onClick={() => setFilterResult('ALL')} className={`py-2 rounded-lg text-xs font-bold transition-all ${filterResult === 'ALL' ? 'bg-white dark:bg-neutral-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>TOUS</button>
                                        <button onClick={() => setFilterResult('WIN')} className={`py-2 rounded-lg text-xs font-bold transition-all ${filterResult === 'WIN' ? 'shadow-lg text-white' : 'text-gray-400'}`} style={filterResult === 'WIN' ? { backgroundColor: colors.win } : {}}>WIN</button>
                                        <button onClick={() => setFilterResult('LOSS')} className={`py-2 rounded-lg text-xs font-bold transition-all ${filterResult === 'LOSS' ? 'shadow-lg text-white' : 'text-gray-400'}`} style={filterResult === 'LOSS' ? { backgroundColor: colors.loss } : {}}>LOSS</button>
                                    </div>
                                </div>
                            </div>

                            {/* PROFIT & POURCENTAGE */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Profit ({currencySymbol}) Min-Max</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative w-full"><span className="absolute left-3 top-3.5 text-gray-400 font-bold text-xs">{currencySymbol}</span><input type="number" placeholder="0" value={minProfit} onChange={(e) => setMinProfit(e.target.value)} className={`${inputClass} pl-8 px-1 text-center`} /></div>
                                        <span className="text-gray-400 font-bold">-</span>
                                        <div className="relative w-full"><span className="absolute left-3 top-3.5 text-gray-400 font-bold text-xs">{currencySymbol}</span><input type="number" placeholder="∞" value={maxProfit} onChange={(e) => setMaxProfit(e.target.value)} className={`${inputClass} pl-8 px-1 text-center`} /></div>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Perf (%) Min-Max</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative w-full"><Percent size={10} className="absolute left-3 top-3.5 text-gray-400"/><input type="number" placeholder="0" value={minPercent} onChange={(e) => setMinPercent(e.target.value)} className={`${inputClass} pl-8 px-1 text-center`} /></div>
                                        <span className="text-gray-400 font-bold">-</span>
                                        <div className="relative w-full"><Percent size={10} className="absolute left-3 top-3.5 text-gray-400"/><input type="number" placeholder="∞" value={maxPercent} onChange={(e) => setMaxPercent(e.target.value)} className={`${inputClass} pl-8 px-1 text-center`} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0">
                            <button onClick={() => setIsFilterOpen(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                                <Check size={18} /> Voir {displayedTrades.length} Résultats
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TradeHistory;