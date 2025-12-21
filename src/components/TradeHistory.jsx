import React, { useMemo, useState, useRef } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, SlidersHorizontal, X, Check, Search, Pencil, Eye, Target, Clock, AlertOctagon, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';

const TradeHistory = ({ trades, onDelete, onEdit, currencySymbol }) => {

    // --- LISTE DES PAIRES DISPONIBLES ---
    const uniquePairs = useMemo(() => {
        const pairs = trades.map(t => t.pair).filter(p => p !== 'SOLDE');
        return [...new Set(pairs)].sort();
    }, [trades]);

    // --- ÉTATS ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [summaryTrade, setSummaryTrade] = useState(null);

    // Filtres
    const [filterPairs, setFilterPairs] = useState(['ALL']);
    const [filterType, setFilterType] = useState('ALL');
    const [filterResult, setFilterResult] = useState('ALL');
    const [sortBy, setSortBy] = useState('DATE_DESC');

    // --- LOGIQUE LONG PRESS (MOBILE) ---
    const longPressTimer = useRef(null);

    const handleTouchStart = (trade) => {
        longPressTimer.current = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            setSummaryTrade(trade);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleTouchMove = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // --- LOGIQUE FILTRES ---
    const handleTogglePair = (pair) => {
        if (pair === 'ALL') {
            filterPairs.includes('ALL') ? setFilterPairs([]) : setFilterPairs(['ALL']);
        } else {
            let newSelection;
            if (filterPairs.includes('ALL')) {
                newSelection = uniquePairs.filter(p => p !== pair);
            } else {
                newSelection = filterPairs.includes(pair) ? filterPairs.filter(p => p !== pair) : [...filterPairs, pair];
            }
            newSelection.length === uniquePairs.length ? setFilterPairs(['ALL']) : setFilterPairs(newSelection);
        }
    };

    const isChecked = (pair) => {
        if (pair === 'ALL') return filterPairs.includes('ALL');
        return filterPairs.includes('ALL') || filterPairs.includes(pair);
    };

    const enrichedTrades = useMemo(() => {
        const chronological = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
        let currentBalance = 0;

        return chronological.map(trade => {
            const tradeProfit = parseFloat(trade.profit) || 0;
            const startBalance = currentBalance;
            currentBalance += tradeProfit;

            let percent = 0;
            let isValidPercent = false;
            if (trade.pair !== 'SOLDE' && startBalance > 0) {
                percent = (tradeProfit / startBalance) * 100;
                isValidPercent = true;
            }
            return {
                ...trade,
                percentString: isValidPercent ? percent.toFixed(2) + '%' : '-',
                percentValue: percent,
                profitValue: tradeProfit
            };
        });
    }, [trades]);

    const displayedTrades = useMemo(() => {
        let result = enrichedTrades;
        if (!filterPairs.includes('ALL')) result = result.filter(t => filterPairs.includes(t.pair));
        if (filterType !== 'ALL') result = result.filter(t => t.type === filterType && t.pair !== 'SOLDE');
        if (filterResult === 'WIN') result = result.filter(t => t.profitValue > 0);
        if (filterResult === 'LOSS') result = result.filter(t => t.profitValue < 0);

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
    }, [enrichedTrades, filterPairs, filterType, filterResult, sortBy]);

    const calculateRR = (trade) => {
        if (!trade.entry || !trade.sl || !trade.tp) return null;
        const entry = parseFloat(trade.entry);
        const sl = parseFloat(trade.sl);
        const tp = parseFloat(trade.tp);
        const risk = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        if (risk === 0) return null;
        return (reward / risk).toFixed(2);
    };

    const labelClass = "text-xs font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block";
    const selectClass = "w-full bg-gray-100 dark:bg-neutral-800 border border-transparent focus:border-indigo-500 rounded-xl px-3 py-3 text-sm font-medium outline-none transition-all dark:text-white";
    const checkboxClass = "w-5 h-5 rounded border border-gray-300 dark:border-neutral-600 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-indigo-500 focus:ring-2 transition-all cursor-pointer accent-indigo-600";
    const activeFiltersCount = (!filterPairs.includes('ALL') ? 1 : 0) + (filterType !== 'ALL' ? 1 : 0) + (filterResult !== 'ALL' ? 1 : 0);

    if (trades.length === 0) return <div className="text-center text-gray-400 py-10 italic">Aucune donnée.</div>;

    return (
        <>
            {/* --- ENTÊTE --- */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">Historique</h3>
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm
            ${activeFiltersCount > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-neutral-700'}`}
                >
                    <SlidersHorizontal size={16} />
                    <span>Filtres</span>
                    {activeFiltersCount > 0 && <span className="bg-white text-indigo-600 text-[10px] font-bold px-1.5 rounded-full min-w-[1.2rem] text-center">{activeFiltersCount}</span>}
                </button>
            </div>

            {/* --- VUE MOBILE : LISTE DE CARTES --- */}
            <div className="md:hidden space-y-3 pb-20">
                {displayedTrades.map((trade) => {
                    const isTransfer = trade.pair === 'SOLDE';

                    let badgeClass = "";
                    if (isTransfer) {
                        if (trade.type === 'DEPOSIT') badgeClass = "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900";
                        else badgeClass = "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900";
                    } else {
                        if (trade.type === 'BUY') badgeClass = "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900";
                        else badgeClass = "bg-orange-100/50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900";
                    }

                    return (
                        <div
                            key={trade.id}
                            onTouchStart={() => handleTouchStart(trade)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchMove}
                            onClick={() => setSummaryTrade(trade)}
                            className={`relative bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-4 rounded-2xl border ${isTransfer ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-white/20 dark:border-white/5'} shadow-sm active:scale-[0.98] transition-transform`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isTransfer ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                                        {isTransfer ? <Wallet size={14} /> : (
                                            <img src={`/icons/${trade.pair.toLowerCase()}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                                            {isTransfer ? 'Mouvement Solde' : trade.pair}
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                            {trade.date}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${trade.profitValue >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/30'}`}>
                                        {trade.profitValue > 0 ? '+' : ''}{trade.profit} {currencySymbol}
                                    </div>

                                    {!isTransfer && trade.percentString !== '-' && (
                                        <span className={`text-[10px] font-bold ${trade.profitValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {trade.profitValue > 0 ? '+' : ''}{trade.percentString}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-neutral-800/50">
                                <div className="flex gap-2 items-center">
                                     <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border border-transparent ${badgeClass}`}>
                                         {trade.type === 'DEPOSIT' ? 'DÉPÔT' : trade.type === 'WITHDRAWAL' ? 'RETRAIT' : trade.type}
                                     </span>
                                    {!isTransfer && (
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                            {trade.lot} lots
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                                        className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }}
                                        className="p-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
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
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Date</th>
                            <th className="px-6 py-4 whitespace-nowrap">Paire</th>
                            <th className="px-6 py-4 whitespace-nowrap text-center">Type</th>
                            <th className="px-6 py-4 whitespace-nowrap text-center">Gain %</th>
                            <th className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">Prix</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">P&L ({currencySymbol})</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {displayedTrades.map((trade) => {
                            const isTransfer = trade.pair === 'SOLDE';
                            let badgeClass = "";
                            if (isTransfer) {
                                if (trade.type === 'DEPOSIT') badgeClass = "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900";
                                else badgeClass = "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900";
                            } else {
                                if (trade.type === 'BUY') badgeClass = "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900";
                                else badgeClass = "bg-orange-100/50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900";
                            }

                            return (
                                <tr
                                    key={trade.id}
                                    onDoubleClick={() => setSummaryTrade(trade)}
                                    className={`transition-colors cursor-pointer active:scale-[0.99] active:bg-gray-100 dark:active:bg-neutral-800 ${isTransfer ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}
                                >
                                    <td className="px-6 py-4 text-gray-600 dark:text-neutral-400 whitespace-nowrap text-xs sm:text-sm">{trade.date}</td>
                                    <td className="px-6 py-4 font-bold text-indigo-900 dark:text-indigo-300">
                                        {isTransfer ? (
                                            <span className="flex items-center gap-2 text-gray-500 dark:text-gray-300"><Wallet size={16} /> Mouvement</span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <img src={`/icons/${trade.pair.toLowerCase()}.png`} alt="" className="w-6 h-6 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                                <span>{trade.pair.toUpperCase()}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border w-16 ${badgeClass}`}>
                                            {isTransfer ? (trade.type === 'DEPOSIT' ? 'DÉPÔT' : 'RETRAIT') : (
                                                <>
                                                    {trade.type === 'BUY' ? <ArrowUpCircle size={10}/> : <ArrowDownCircle size={10}/>} {trade.type}
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!isTransfer && trade.percentString !== '-' ? (
                                            <span className={`font-bold text-xs px-2 py-1 rounded-md ${trade.percentValue > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/10'}`}>
                                            {trade.percentValue > 0 ? '+' : ''}{trade.percentString}
                                            </span>
                                        ) : <span className="text-gray-300 dark:text-neutral-700">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-neutral-500 font-mono hidden lg:table-cell text-xs">
                                        {isTransfer ? '-' : <div className="flex flex-col"><span>In: {trade.entry}</span>{trade.exit && <span className="opacity-70">Out: {trade.exit}</span>}</div>}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-extrabold text-sm ${parseFloat(trade.profit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {parseFloat(trade.profit) > 0 ? '+' : ''}{trade.profit} {currencySymbol}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); setSummaryTrade(trade); }} className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg hidden md:block">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(trade); }} className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg" title="Modifier">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(trade.id); }} className="text-gray-400 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg" title="Supprimer">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
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

                        <div className={`p-6 flex justify-between items-start ${summaryTrade.profitValue >= 0 ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' : 'bg-gradient-to-br from-rose-500/10 to-orange-500/10'}`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Clock size={12}/> {summaryTrade.date}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    {summaryTrade.pair === 'SOLDE' ? 'Mouvement' : summaryTrade.pair}
                                    {summaryTrade.pair !== 'SOLDE' && <span className={`text-xs px-2 py-1 rounded-lg border font-bold ${summaryTrade.type === 'BUY' ? 'border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20'}`}>{summaryTrade.type}</span>}
                                </h2>
                            </div>
                            <button onClick={() => setSummaryTrade(null)} className="p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 rounded-full transition-colors">
                                <X size={20} className="text-gray-500 dark:text-gray-300" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <div className="text-sm font-bold text-gray-400 uppercase mb-1">Résultat Net</div>
                                <div className={`text-5xl font-black tracking-tighter ${summaryTrade.profitValue >= 0 ? 'text-emerald-500 drop-shadow-sm' : 'text-rose-500 drop-shadow-sm'}`}>
                                    {summaryTrade.profitValue > 0 ? '+' : ''}{summaryTrade.profit} {currencySymbol}
                                </div>
                                {summaryTrade.pair !== 'SOLDE' && (
                                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${summaryTrade.profitValue >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                        {summaryTrade.percentString} de gain
                                    </div>
                                )}
                            </div>

                            {summaryTrade.pair !== 'SOLDE' && (
                                <>
                                    <div className="h-px bg-gray-100 dark:bg-neutral-800"></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><Target size={12} /> ENTRÉE</div>
                                            <div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.entry}</div>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-gray-100 dark:border-neutral-800">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1"><TrendingUp size={12} /> SORTIE</div>
                                            <div className="text-lg font-mono font-bold text-gray-800 dark:text-gray-200">{summaryTrade.exit}</div>
                                        </div>
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-1"><AlertOctagon size={12} /> STOP LOSS</div>
                                            <div className="text-lg font-mono font-bold text-rose-700 dark:text-rose-400">{summaryTrade.sl || '-'}</div>
                                        </div>
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1"><Target size={12} /> TAKE PROFIT</div>
                                            <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">{summaryTrade.tp || '-'}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 px-2">
                                        <div>Taille: <span className="font-bold text-gray-800 dark:text-white">{summaryTrade.lot} Lots</span></div>
                                        {calculateRR(summaryTrade) && (
                                            <div>Ratio R:R : <span className="font-bold text-indigo-500">{calculateRR(summaryTrade)}</span></div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-neutral-800/80 border-t border-gray-100 dark:border-neutral-800 flex justify-end gap-3">
                            <button onClick={() => { setSummaryTrade(null); onEdit(summaryTrade); }} className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                                Modifier
                            </button>
                            <button onClick={() => setSummaryTrade(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-colors">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popups filtres inchangée */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <SlidersHorizontal size={18} /> Filtres & Tri
                            </h3>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500"><X size={18} /></button>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-5">
                            <div>
                                <label className={labelClass}>Trier par</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
                                    <option value="DATE_DESC">Date (Plus récent)</option>
                                    <option value="DATE_ASC">Date (Plus ancien)</option>
                                    <option value="PROFIT_DESC">Gain ($) - Décroissant</option>
                                    <option value="PROFIT_ASC">Gain ($) - Croissant</option>
                                    <option value="PERCENT_DESC">Perf (%) - Meilleure</option>
                                    <option value="PERCENT_ASC">Perf (%) - Pire</option>
                                </select>
                            </div>
                            <div className="h-px bg-gray-100 dark:bg-neutral-800"></div>
                            <div>
                                <label className={labelClass}>Paires</label>
                                <div className="bg-gray-100 dark:bg-neutral-800 rounded-xl p-2 max-h-48 overflow-y-auto border border-transparent focus-within:border-indigo-500 transition-colors">
                                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700 cursor-pointer transition-colors">
                                        <input type="checkbox" checked={isChecked('ALL')} onChange={() => handleTogglePair('ALL')} className={checkboxClass} />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Toutes les paires</span>
                                    </label>
                                    <div className="h-px bg-gray-200 dark:bg-neutral-700 my-1"></div>
                                    {uniquePairs.map(pair => (
                                        <label key={pair} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700 cursor-pointer transition-colors group">
                                            <input type="checkbox" checked={isChecked(pair)} onChange={() => handleTogglePair(pair)} className={checkboxClass} />
                                            <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                                                <img src={`/icons/${pair.toLowerCase()}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{pair}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Type</label>
                                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
                                        <option value="ALL">Tous</option>
                                        <option value="BUY">BUY</option>
                                        <option value="SELL">SELL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Résultat</label>
                                    <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} className={selectClass}>
                                        <option value="ALL">Tous</option>
                                        <option value="WIN">Gains</option>
                                        <option value="LOSS">Pertes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0">
                            <button onClick={() => setIsFilterOpen(false)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                                <Check size={18} /> Voir les Résultats
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TradeHistory;