import React, { useMemo, useState, useEffect } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Wallet, SlidersHorizontal, X, Check, Search } from 'lucide-react';

const TradeHistory = ({ trades, onDelete }) => {

    // --- LISTE DES PAIRES DISPONIBLES ---
    const uniquePairs = useMemo(() => {
        const pairs = trades.map(t => t.pair).filter(p => p !== 'SOLDE');
        return [...new Set(pairs)].sort();
    }, [trades]);

    // --- ÉTATS ---
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // 1. Filtre Paires (Array de strings) - Par défaut contient 'ALL'
    const [filterPairs, setFilterPairs] = useState(['ALL']);

    const [filterType, setFilterType] = useState('ALL');
    const [filterResult, setFilterResult] = useState('ALL');
    const [sortBy, setSortBy] = useState('DATE_DESC');

    // --- LOGIQUE CHECKLIST PAIRES ---
    const handleTogglePair = (pair) => {
        if (pair === 'ALL') {
            // Si on clique sur "Tous", soit on met tout (ALL), soit on vide
            if (filterPairs.includes('ALL')) {
                setFilterPairs([]); // Tout désélectionner
            } else {
                setFilterPairs(['ALL']); // Tout sélectionner
            }
        } else {
            let newSelection;

            // Si "ALL" était actif, on le remplace par la liste complète moins celle qu'on décoche
            if (filterPairs.includes('ALL')) {
                newSelection = uniquePairs.filter(p => p !== pair);
            } else {
                // Sinon comportement classique (Ajout/Retrait)
                if (filterPairs.includes(pair)) {
                    newSelection = filterPairs.filter(p => p !== pair);
                } else {
                    newSelection = [...filterPairs, pair];
                }
            }

            // Si toutes les paires sont cochées manuellement, on remet 'ALL'
            if (newSelection.length === uniquePairs.length) {
                setFilterPairs(['ALL']);
            } else {
                setFilterPairs(newSelection);
            }
        }
    };

    // Helper pour savoir si une case doit être cochée visuellement
    const isChecked = (pair) => {
        if (pair === 'ALL') return filterPairs.includes('ALL');
        return filterPairs.includes('ALL') || filterPairs.includes(pair);
    };

    // --- 1. ENRICHISSEMENT ---
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

    // --- 2. FILTRAGE ET TRI ---
    const displayedTrades = useMemo(() => {
        let result = enrichedTrades;

        // A. Filtre Paire (Multi-select logic)
        // Si 'ALL' n'est pas présent, on ne garde que ce qui est dans le tableau filterPairs
        if (!filterPairs.includes('ALL')) {
            result = result.filter(t => filterPairs.includes(t.pair));
        }

        // Autres filtres
        if (filterType !== 'ALL') result = result.filter(t => t.type === filterType && t.pair !== 'SOLDE');
        if (filterResult === 'WIN') result = result.filter(t => t.profitValue > 0);
        if (filterResult === 'LOSS') result = result.filter(t => t.profitValue < 0);

        // Tri
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

    // Styles
    const labelClass = "text-xs font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block";
    const selectClass = "w-full bg-gray-100 dark:bg-neutral-800 border border-transparent focus:border-indigo-500 rounded-xl px-3 py-3 text-sm font-medium outline-none transition-all dark:text-white";
    const checkboxClass = "w-5 h-5 rounded border border-gray-300 dark:border-neutral-600 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-indigo-500 focus:ring-2 transition-all cursor-pointer accent-indigo-600";

    // Compteur de filtres
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

            {/* --- TABLEAU --- */}
            <div className="overflow-hidden bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/50 dark:bg-black/40 text-gray-500 dark:text-neutral-500 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 whitespace-nowrap">Date</th>
                            <th className="px-6 py-4 whitespace-nowrap">Paire</th>
                            <th className="px-6 py-4 whitespace-nowrap text-center">Type</th>
                            <th className="px-6 py-4 whitespace-nowrap text-center">Gain %</th>
                            <th className="px-6 py-4 whitespace-nowrap hidden md:table-cell">Prix</th>
                            <th className="px-6 py-4 whitespace-nowrap text-right">P&L ($)</th>
                            <th className="px-6 py-4 text-center"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {displayedTrades.map((trade) => {
                            const isTransfer = trade.pair === 'SOLDE';
                            return (
                                <tr key={trade.id} className={`transition-colors ${isTransfer ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
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
                                        {isTransfer ? (
                                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold border w-16 ${trade.type === 'DEPOSIT' ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900' : 'bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900'}`}>{trade.type === 'DEPOSIT' ? 'DÉPÔT' : 'RETRAIT'}</span>
                                        ) : (
                                            <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border w-16 ${trade.type === 'BUY' ? 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900' : 'bg-orange-100/50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900'}`}>
                           {trade.type === 'BUY' ? <ArrowUpCircle size={10}/> : <ArrowDownCircle size={10}/>} {trade.type}
                         </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {!isTransfer && trade.percentString !== '-' ? (
                                            <span className={`font-bold text-xs px-2 py-1 rounded-md ${trade.percentValue > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/10'}`}>
                            {trade.percentValue > 0 ? '+' : ''}{trade.percentString}
                        </span>
                                        ) : <span className="text-gray-300 dark:text-neutral-700">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-neutral-500 font-mono hidden md:table-cell text-xs">
                                        {isTransfer ? '-' : <div className="flex flex-col"><span>In: {trade.entry}</span>{trade.exit && <span className="opacity-70">Out: {trade.exit}</span>}</div>}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-extrabold text-sm ${parseFloat(trade.profit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {parseFloat(trade.profit) > 0 ? '+' : ''}{trade.profit} $
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => onDelete(trade.id)} className="text-gray-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    {displayedTrades.length === 0 && <div className="p-8 text-center text-gray-400 dark:text-neutral-600">Aucun résultat ne correspond à vos filtres.</div>}
                </div>
            </div>

            {/* --- POPUP FILTRES --- */}
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

                            {/* TRI */}
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

                            {/* --- LISTE DES PAIRES (Checklist) --- */}
                            <div>
                                <label className={labelClass}>Paires</label>
                                <div className="bg-gray-100 dark:bg-neutral-800 rounded-xl p-2 max-h-48 overflow-y-auto border border-transparent focus-within:border-indigo-500 transition-colors">
                                    {/* OPTION TOUS */}
                                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isChecked('ALL')}
                                            onChange={() => handleTogglePair('ALL')}
                                            className={checkboxClass}
                                        />
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Toutes les paires</span>
                                    </label>

                                    <div className="h-px bg-gray-200 dark:bg-neutral-700 my-1"></div>

                                    {/* LISTE DYNAMIQUE */}
                                    {uniquePairs.map(pair => (
                                        <label key={pair} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-neutral-700 cursor-pointer transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={isChecked(pair)}
                                                onChange={() => handleTogglePair(pair)}
                                                className={checkboxClass}
                                            />
                                            <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                                                <img src={`/icons/${pair.toLowerCase()}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{pair}</span>
                                            </div>
                                        </label>
                                    ))}
                                    {uniquePairs.length === 0 && <div className="text-xs text-gray-400 p-2">Aucune paire enregistrée.</div>}
                                </div>
                            </div>

                            {/* AUTRES FILTRES */}
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
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
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