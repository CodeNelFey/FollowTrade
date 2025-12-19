import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

const CalendarView = ({ trades }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- 1. AGREGATION ET CALCULS ---
    const dailyData = useMemo(() => {
        // On trie chronologiquement pour suivre l'évolution du solde jour après jour
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);

        const stats = {}; // Structure : { 'YYYY-MM-DD': { profit: 0, startBalance: 0, deposits: 0 } }
        let currentBalance = 0;

        sortedTrades.forEach(trade => {
            const date = trade.date;

            // Initialiser la journée si elle n'existe pas encore
            if (!stats[date]) {
                stats[date] = {
                    profit: 0,
                    startBalance: currentBalance, // Le solde au réveil, avant tout trade/dépôt du jour
                    deposits: 0
                };
            }

            const val = parseFloat(trade.profit) || 0;

            if (trade.pair === 'SOLDE') {
                // C'est un mouvement d'argent
                if (trade.type === 'DEPOSIT') {
                    stats[date].deposits += val; // On cumule les dépôts du jour pour ajuster la base de calcul du %
                }
                // Le solde évolue
                currentBalance += val;
            } else {
                // C'est un trade
                stats[date].profit += val;
                // Le solde évolue
                currentBalance += val;
            }
        });

        return stats;
    }, [trades]);

    // --- 2. LOGIQUE CALENDRIER ---
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y, m) => {
        const day = new Date(y, m, 1).getDay();
        return day === 0 ? 6 : day - 1; // Lundi = 0
    };

    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);

    const blanks = Array(startDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    return (
        <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center text-indigo-900 dark:text-white capitalize">
                    <CalIcon className="mr-3 text-indigo-500" size={24} />
                    {monthNames[month]} {year}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-all">
                        <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-all">
                        <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
            </div>

            {/* JOURS SEMAINE */}
            <div className="grid grid-cols-7 mb-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* GRILLE */}
            <div className="grid grid-cols-7 gap-3 auto-rows-[100px]">

                {blanks.map((_, i) => (
                    <div key={`blank-${i}`} className="rounded-2xl bg-transparent"></div>
                ))}

                {days.map(d => {
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dayStat = dailyData[dateString];

                    let dailyProfit = 0;
                    let percent = 0;
                    let hasData = false;

                    if (dayStat) {
                        dailyProfit = dayStat.profit;
                        hasData = true;

                        // Calcul du capital effectif du jour (Solde départ + Dépôts du jour)
                        const effectiveCapital = dayStat.startBalance + dayStat.deposits;

                        // Calcul du % (uniquement si capital > 0 et qu'il y a eu du trading)
                        if (effectiveCapital > 0 && dailyProfit !== 0) {
                            percent = (dailyProfit / effectiveCapital) * 100;
                        }
                    }

                    // Couleurs
                    let bgColor = "bg-gray-100 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-800";
                    let textColor = "text-gray-400 dark:text-neutral-600";

                    if (hasData && dailyProfit > 0) {
                        bgColor = "bg-emerald-500 shadow-lg shadow-emerald-500/20 border-emerald-400";
                        textColor = "text-white";
                    } else if (hasData && dailyProfit < 0) {
                        bgColor = "bg-rose-500 shadow-lg shadow-rose-500/20 border-rose-400";
                        textColor = "text-white";
                    }

                    return (
                        <div
                            key={d}
                            className={`relative rounded-2xl border ${bgColor} p-2 md:p-3 flex flex-col justify-between transition-transform hover:scale-105 group cursor-default`}
                        >
                            <span className={`text-xs font-bold ${textColor} opacity-80`}>{d}</span>

                            {hasData && dailyProfit !== 0 && (
                                <div className="text-center">
                                    {/* MONTANT ($) */}
                                    <div className={`font-extrabold text-sm md:text-base leading-tight ${dailyProfit !== 0 ? 'text-white' : ''}`}>
                                        {dailyProfit > 0 ? '+' : ''}{dailyProfit.toFixed(0)}
                                        <span className="text-[10px] font-normal opacity-70 ml-0.5">$</span>
                                    </div>

                                    {/* POURCENTAGE (%) */}
                                    <div className="text-[10px] font-bold text-white opacity-80 mt-1">
                                        {percent > 0 ? '+' : ''}{percent.toFixed(2)}%
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Légende */}
            <div className="mt-8 flex gap-6 justify-center text-xs text-gray-500 dark:text-neutral-400 font-medium">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Jour gagnant
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-neutral-800"></div> Neutre / Pas de trade
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div> Jour perdant
                </div>
            </div>

        </div>
    );
};

export default CalendarView;