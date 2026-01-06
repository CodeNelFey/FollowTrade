import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw, Target, Calendar, BarChart3, ChevronDown, Wallet, Check, AlertCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SimulatorView = ({ currencySymbol, accounts = [], trades = [] }) => {
    const [mode, setMode] = useState('MANUAL');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedAccountObj, setSelectedAccountObj] = useState(null);
    const [computedBalances, setComputedBalances] = useState({});
    const dropdownRef = useRef(null);

    // --- MODES DE DURÉE ---
    const [duration, setDuration] = useState('ROLLING_YEAR');

    // Inputs Simulation
    const [balance, setBalance] = useState(10000);
    const [winRate, setWinRate] = useState(50);
    const [riskPercent, setRiskPercent] = useState(1);
    const [riskReward, setRiskReward] = useState(2);
    const [tradesPerWeek, setTradesPerWeek] = useState(5);

    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ finalBalance: 0, profit: 0, maxDD: 0 });

    // Calcul des soldes réels
    useEffect(() => {
        const balances = {};
        accounts.forEach(acc => {
            const accountMovements = trades.filter(t => Number(t.account_id) === Number(acc.id));
            const total = accountMovements.reduce((sum, t) => sum + (parseFloat(t.profit) || 0), 0);
            balances[acc.id] = total;
        });
        setComputedBalances(balances);
    }, [accounts, trades]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- 1. CHARGEMENT STATS COMPTE ---
    const loadAccountStats = (account) => {
        if (!account) return;

        const realBalance = computedBalances[account.id] || 0;
        setBalance(realBalance);

        const activeTrades = trades.filter(t =>
            Number(t.account_id) === Number(account.id) &&
            t.pair !== 'SOLDE' &&
            t.type !== 'DEPOSIT' &&
            t.type !== 'WITHDRAWAL'
        ).sort((a,b) => new Date(a.date) - new Date(b.date));

        if (activeTrades.length === 0) return;

        const wins = activeTrades.filter(t => parseFloat(t.profit) >= 0).length;
        const realWinRate = (wins / activeTrades.length) * 100;

        const winsTrades = activeTrades.filter(t => parseFloat(t.profit) > 0);
        const avgWin = winsTrades.length > 0 ? winsTrades.reduce((acc, t) => acc + parseFloat(t.profit), 0) / winsTrades.length : 0;
        const lossesTrades = activeTrades.filter(t => parseFloat(t.profit) < 0);
        const avgLoss = lossesTrades.length > 0 ? Math.abs(lossesTrades.reduce((acc, t) => acc + parseFloat(t.profit), 0) / lossesTrades.length) : 0;
        const realRR = avgLoss > 0 ? (avgWin / avgLoss) : 1.5;

        const firstDate = new Date(activeTrades[0].date);
        const lastDate = new Date(activeTrades[activeTrades.length - 1].date);
        const weeksDiff = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 7));
        const realFreq = Math.round(activeTrades.length / weeksDiff) || 5;

        setWinRate(Math.round(realWinRate) || 50);
        setRiskReward(parseFloat(realRR.toFixed(2)) || 2);
        setTradesPerWeek(realFreq);
    };

    const handleSelectAccount = (acc) => {
        setSelectedAccountObj(acc);
        setIsDropdownOpen(false);
        loadAccountStats(acc);
    };

    // --- CALCULATEUR DE DURÉE ---
    const getWeeksForDuration = (type) => {
        switch (type) {
            case 'WEEK': return 1;
            case 'MONTH': return 4.3;
            case 'ROLLING_YEAR': return 52;
            case 'CALENDAR_YEAR':
                const now = new Date();
                const endOfYear = new Date(now.getFullYear(), 11, 31);
                const diffTime = Math.abs(endOfYear - now);
                const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                return Math.max(1, diffWeeks);
            default: return 52;
        }
    };

    const formatDate = (date) => {
        return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
    };

    // --- 2. MOTEUR DE SIMULATION ---
    const runSimulation = () => {
        const weeksToSimulate = getWeeksForDuration(duration);
        const numTradesToSimulate = Math.round(weeksToSimulate * tradesPerWeek);

        let startBalance = parseFloat(balance) || 0;
        let maxBalance = startBalance;
        let maxDrawdown = 0;
        let data = [];
        let tradeIndex = 0;
        const today = new Date();

        const getTradeDate = (index) => {
            const daysToAdd = (index / tradesPerWeek) * 7;
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + daysToAdd);
            return formatDate(futureDate);
        };

        // --- HISTORIQUE ---
        if (mode === 'ACCOUNT' && selectedAccountObj) {
            const allMovements = trades.filter(t =>
                Number(t.account_id) === Number(selectedAccountObj.id)
            ).sort((a,b) => new Date(a.date) - new Date(b.date));

            if (allMovements.length > 0) {
                let runningBalance = 0;
                data.push({ trade: 0, dateLabel: 'Début', historical: 0, projected: null });

                allMovements.forEach((t) => {
                    tradeIndex++;
                    runningBalance += parseFloat(t.profit);
                    const dateObj = new Date(t.date);
                    const label = isNaN(dateObj) ? `T${tradeIndex}` : formatDate(dateObj);

                    data.push({
                        trade: tradeIndex,
                        dateLabel: label,
                        historical: parseFloat(runningBalance.toFixed(2)),
                        projected: null
                    });
                });

                data[data.length - 1].projected = parseFloat(runningBalance.toFixed(2));
                startBalance = runningBalance;
            } else {
                data.push({ trade: 0, dateLabel: 'Auj.', historical: startBalance, projected: startBalance });
            }
        } else {
            data.push({ trade: 0, dateLabel: 'Auj.', historical: null, projected: startBalance });
        }

        // --- FUTUR ---
        let simBalance = startBalance;
        const initialSimBalance = simBalance;

        for (let i = 1; i <= numTradesToSimulate; i++) {
            const riskAmount = simBalance * (riskPercent / 100);

            // Logique déterministe
            const currentAccumulatedWin = i * winRate;
            const previousAccumulatedWin = (i - 1) * winRate;
            const isWin = Math.floor(currentAccumulatedWin / 100) > Math.floor(previousAccumulatedWin / 100);

            const pnl = isWin ? (riskAmount * riskReward) : -riskAmount;
            simBalance += pnl;

            if (simBalance > maxBalance) maxBalance = simBalance;
            const dd = ((maxBalance - simBalance) / maxBalance) * 100;
            if (dd > maxDrawdown) maxDrawdown = dd;

            data.push({
                trade: tradeIndex + i,
                dateLabel: getTradeDate(i),
                historical: null,
                projected: Math.round(simBalance)
            });
        }

        setChartData(data);
        setStats({
            finalBalance: Math.round(simBalance),
            profit: Math.round(simBalance - initialSimBalance),
            maxDD: maxDrawdown.toFixed(2),
        });
    };

    useEffect(() => { runSimulation(); }, [mode, duration, selectedAccountObj, balance]);

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex justify-center mb-8">
                <div className="bg-white dark:bg-neutral-900 p-1 rounded-xl border border-gray-200 dark:border-neutral-800 inline-flex shadow-sm">
                    <button onClick={() => setMode('MANUAL')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'MANUAL' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Simulation Libre</button>
                    <button onClick={() => setMode('ACCOUNT')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'ACCOUNT' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Basé sur Compte Réel</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* --- CONFIGURATION --- */}
                <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-sm h-fit z-20">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Target className="text-indigo-500" /> Paramètres</h2>

                    <div className="space-y-5">

                        {mode === 'ACCOUNT' && (
                            <div className="relative" ref={dropdownRef}>
                                {/* CORRECTION LABEL : dark:text-gray-400 */}
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 block">Compte à projeter</label>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 flex items-center justify-between transition-colors hover:border-indigo-500 group">
                                    {selectedAccountObj ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Wallet size={16} /></div>
                                            <div className="text-left">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{selectedAccountObj.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{(computedBalances[selectedAccountObj.id] || 0).toLocaleString()} {currencySymbol}</div>
                                            </div>
                                        </div>
                                    ) : (<span className="text-gray-400 text-sm font-medium">Sélectionner un compte...</span>)}
                                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {accounts.length > 0 ? (
                                            <div className="max-h-60 overflow-y-auto">
                                                {accounts.map(acc => (
                                                    <div key={acc.id} onClick={() => handleSelectAccount(acc)} className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedAccountObj?.id === acc.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedAccountObj?.id === acc.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400'}`}><Wallet size={14} /></div>
                                                            <div>
                                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{acc.name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{(computedBalances[acc.id] || 0).toLocaleString()} {currencySymbol}</div>
                                                            </div>
                                                        </div>
                                                        {selectedAccountObj?.id === acc.id && <Check size={16} className="text-indigo-500" />}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (<div className="p-4 text-center text-gray-400 text-xs">Aucun compte disponible.</div>)}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            {/* CORRECTION LABEL */}
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2"><Clock size={14} /> Durée de projection</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setDuration('WEEK')} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${duration === 'WEEK' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'}`}>1 Semaine</button>
                                <button onClick={() => setDuration('MONTH')} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${duration === 'MONTH' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'}`}>1 Mois</button>
                                <button onClick={() => setDuration('ROLLING_YEAR')} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${duration === 'ROLLING_YEAR' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'}`}>1 An (Glissant)</button>
                                <button onClick={() => setDuration('CALENDAR_YEAR')} className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${duration === 'CALENDAR_YEAR' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'}`}>Fin d'Année</button>
                            </div>
                        </div>

                        {/* INPUTS AVEC BACKGROUND PLUS CLAIR EN DARK MODE ET TEXT BLANC */}
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Solde Initial</label><input type="number" disabled={mode === 'ACCOUNT'} value={balance} onChange={(e) => setBalance(e.target.value)} className={`w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none ${mode==='ACCOUNT' ? 'opacity-50 cursor-not-allowed' : ''}`} /></div>
                            <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Trades / Semaine</label><input type="number" value={tradesPerWeek} onChange={(e) => setTradesPerWeek(e.target.value)} className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Winrate (%)</label><input type="number" value={winRate} onChange={(e) => setWinRate(e.target.value)} className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Risk / Reward</label><input type="number" value={riskReward} step="0.1" onChange={(e) => setRiskReward(e.target.value)} className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                        </div>

                        <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Risque par trade (%)</label><input type="number" value={riskPercent} step="0.1" onChange={(e) => setRiskPercent(e.target.value)} className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" /></div>

                        <button onClick={runSimulation} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 mt-4"><RefreshCcw size={18} /> Actualiser</button>
                    </div>
                </div>

                {/* --- CHART & RESULTS --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/60 dark:bg-neutral-900/60 p-4 rounded-2xl border border-white/20 dark:border-white/5"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Capital Projeté</div><div className="text-xl md:text-2xl font-black text-indigo-500 truncate">{stats.finalBalance.toLocaleString()} {currencySymbol}</div></div>
                        <div className="bg-white/60 dark:bg-neutral-900/60 p-4 rounded-2xl border border-white/20 dark:border-white/5"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Profit Est.</div><div className={`text-xl md:text-2xl font-black truncate ${stats.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{stats.profit > 0 ? '+' : ''}{stats.profit.toLocaleString()} {currencySymbol}</div></div>
                        <div className="bg-white/60 dark:bg-neutral-900/60 p-4 rounded-2xl border border-white/20 dark:border-white/5"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Max Drawdown</div><div className="text-xl md:text-2xl font-black text-orange-500">{stats.maxDD}%</div></div>
                    </div>

                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/5 shadow-sm h-[400px] relative">
                        {mode === 'ACCOUNT' && !selectedAccountObj && (<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-3xl"><p className="font-bold text-gray-500 flex flex-col items-center gap-2"><Target size={32} /> Veuillez sélectionner un compte</p></div>)}
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 flex items-center gap-2"><BarChart3 size={16} /> Projection d'Equity Curve</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                                <XAxis dataKey="dateLabel" stroke="#888" tick={{fontSize: 10}} minTickGap={30} />
                                <YAxis stroke="#888" tick={{fontSize: 10}} domain={['auto', 'auto']} width={40} />
                                {/* CORRECTION TOOLTIP : FORCE LE TEXTE BLANC ET FOND NOIR */}
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    formatter={(value, name) => [`${value} ${currencySymbol}`, name === 'historical' ? 'Historique' : 'Projection']}
                                    labelFormatter={(val) => `Date : ${val}`}
                                />
                                <Area type="monotone" dataKey="historical" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorHistory)" activeDot={{ r: 6 }} />
                                <Area type="monotone" dataKey="projected" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorProjected)" connectNulls={true} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimulatorView;