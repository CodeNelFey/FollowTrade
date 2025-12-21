import React, { useState, useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, Wallet, Percent, LineChart, BarChart3, CalendarDays } from 'lucide-react';

const GraphView = ({ trades, currencySymbol }) => {
    const [chartType, setChartType] = useState('BALANCE'); // 'BALANCE', 'PROFIT', 'PERCENT'
    const [graphStyle, setGraphStyle] = useState('AREA'); // 'AREA' ou 'BAR'
    const [timeRange, setTimeRange] = useState('ALL'); // '1W', '1M', '3M', '1Y', 'ALL'

    // --- 1. PRÉPARATION DES DONNÉES GLOBALES ---
    const fullData = useMemo(() => {
        const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id);
        const daysMap = {};
        let runningBalance = 0;

        sorted.forEach(trade => {
            const date = trade.date;
            const profit = parseFloat(trade.profit) || 0;
            const isTransfer = trade.pair === 'SOLDE';

            if (!daysMap[date]) {
                daysMap[date] = {
                    date: date,
                    fullDate: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                    rawDate: new Date(date),
                    dailyProfit: 0,
                    dailyDeposits: 0,
                    startBalance: runningBalance
                };
            }

            if (isTransfer) {
                if (trade.type === 'DEPOSIT') daysMap[date].dailyDeposits += profit;
            } else {
                daysMap[date].dailyProfit += profit;
            }

            runningBalance += profit;
            daysMap[date].endBalance = runningBalance;
        });

        return Object.values(daysMap).map(day => {
            const effectiveCapital = day.startBalance + day.dailyDeposits;
            let dailyPercent = 0;
            if (effectiveCapital > 0) dailyPercent = (day.dailyProfit / effectiveCapital) * 100;
            else if (day.dailyDeposits > 0) dailyPercent = (day.dailyProfit / day.dailyDeposits) * 100;

            return {
                ...day,
                balance: day.endBalance,
                profit: day.dailyProfit,
                percent: dailyPercent
            };
        });
    }, [trades]);

    // --- 2. FILTRAGE TEMPOREL ---
    const filteredData = useMemo(() => {
        if (timeRange === 'ALL') return fullData;

        const now = new Date();
        const cutoff = new Date();

        if (timeRange === '1W') cutoff.setDate(now.getDate() - 7);
        if (timeRange === '1M') cutoff.setMonth(now.getMonth() - 1);
        if (timeRange === '3M') cutoff.setMonth(now.getMonth() - 3);
        if (timeRange === '1Y') cutoff.setFullYear(now.getFullYear() - 1);

        return fullData.filter(item => item.rawDate >= cutoff);
    }, [fullData, timeRange]);

    // --- 3. CONFIGURATION GRAPHIQUE ---
    const getChartConfig = () => {
        switch (chartType) {
            case 'PROFIT': return { dataKey: 'profit', label: `Gain Quotidien (${currencySymbol})`, color: '#10b981' };
            case 'PERCENT': return { dataKey: 'percent', label: 'Performance Quotidienne (%)', color: '#10b981' }; // VERT (comme Profit)
            case 'BALANCE': default: return { dataKey: 'balance', label: `Évolution Solde (${currencySymbol})`, color: '#6366f1' };
        }
    };

    const config = getChartConfig();
    const lastValue = filteredData.length > 0 ? filteredData[filteredData.length - 1][config.dataKey] : 0;

    // --- 4. CALCUL DU GRADIENT (ROUGE SI NÉGATIF pour Profit/Percent) ---
    const gradientOffset = () => {
        const dataMax = Math.max(...filteredData.map((i) => i[config.dataKey]));
        const dataMin = Math.min(...filteredData.map((i) => i[config.dataKey]));

        if (dataMax <= 0) return 0;
        if (dataMin >= 0) return 1;

        return dataMax / (dataMax - dataMin);
    };

    const off = gradientOffset();

    // --- COMPOSANTS UI ---
    const FilterButton = ({ type, label, icon: Icon }) => (
        <button
            onClick={() => setChartType(type)}
            className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 px-2 rounded-xl border transition-all ${
                chartType === type
                    ? 'bg-white dark:bg-neutral-800 border-indigo-500 shadow-lg shadow-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
            }`}
        >
            <Icon size={16} />
            <span className="text-[10px] md:text-xs font-bold uppercase">{label}</span>
        </button>
    );

    const TimeButton = ({ value, label }) => (
        <button
            onClick={() => setTimeRange(value)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                timeRange === value
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
        >
            {label}
        </button>
    );

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const val = payload[0].value;
            const isPositive = val >= 0;
            return (
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/20 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-400 mb-1">{payload[0].payload.fullDate}</p>
                    <p className={`text-lg font-black ${chartType === 'BALANCE' ? (isPositive ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-600 dark:text-indigo-400') : (isPositive ? 'text-emerald-500' : 'text-rose-500')}`}>
                        {chartType !== 'BALANCE' && (isPositive ? '+' : '')}
                        {val.toFixed(2)}
                        {chartType === 'PERCENT' ? '%' : ` ${currencySymbol}`}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (trades.length === 0) return <div className="text-center text-gray-400 py-20 italic">Aucune donnée pour générer un graphique.</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 mb-24">

            {/* CONTROLS */}
            <div className="space-y-4">
                <div className="flex gap-3">
                    <div className="flex-1 bg-gray-100/50 dark:bg-neutral-900/50 p-1.5 rounded-2xl flex gap-1">
                        <FilterButton type="BALANCE" label="Solde" icon={Wallet} />
                        <FilterButton type="PROFIT" label="Gains" icon={TrendingUp} />
                        <FilterButton type="PERCENT" label="Perf %" icon={Percent} />
                    </div>
                    <button
                        onClick={() => setGraphStyle(prev => prev === 'AREA' ? 'BAR' : 'AREA')}
                        className="w-14 bg-gray-100/50 dark:bg-neutral-900/50 p-1.5 rounded-2xl flex items-center justify-center hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-indigo-500/30 transition-all text-indigo-500 shadow-sm"
                    >
                        {graphStyle === 'AREA' ? <BarChart3 size={20} /> : <LineChart size={20} />}
                    </button>
                </div>

                <div className="flex items-center justify-between bg-white/40 dark:bg-neutral-900/40 p-2 rounded-xl backdrop-blur-sm border border-white/20 dark:border-white/5 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1 text-gray-400 mr-2 px-2 border-r border-gray-200 dark:border-neutral-700">
                        <CalendarDays size={16} />
                    </div>
                    <div className="flex gap-1">
                        <TimeButton value="1W" label="1S" />
                        <TimeButton value="1M" label="1M" />
                        <TimeButton value="3M" label="3M" />
                        <TimeButton value="1Y" label="1A" />
                        <TimeButton value="ALL" label="Tout" />
                    </div>
                </div>
            </div>

            {/* CHART */}
            <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/40 dark:border-white/5 h-[400px] md:h-[500px] flex flex-col">

                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                            {chartType === 'BALANCE' ? 'Valeur Actuelle' : `Cumul Période ${config.label}`}
                        </h3>
                        <div className={`text-4xl font-black tracking-tight ${chartType === 'BALANCE' ? 'text-gray-900 dark:text-white' : (lastValue >= 0 ? 'text-emerald-500' : 'text-rose-500')}`}>
                            {chartType !== 'BALANCE' && lastValue > 0 ? '+' : ''}{lastValue.toFixed(2)}
                            <span className="text-lg text-gray-400 ml-1">
                                {chartType === 'PERCENT' ? '%' : currencySymbol}
                            </span>
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-indigo-500">
                        {graphStyle === 'AREA' ? <LineChart size={24} /> : <BarChart3 size={24} />}
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        {graphStyle === 'AREA' ? (
                            <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    {/* Dégradé SOLDE (Simple) */}
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>

                                    {/* Dégradé GAINS/PERCENT (Split Vert/Rouge) */}
                                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={off} stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset={off} stopColor="#f43f5e" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                                        <stop offset={off} stopColor="#f43f5e" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis
                                    dataKey="fullDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                                {/* LOGIQUE D'AFFICHAGE COURBE */}
                                {chartType === 'BALANCE' ? (
                                    <Area
                                        type="monotone"
                                        dataKey={config.dataKey}
                                        stroke={config.color}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                        animationDuration={1000}
                                    />
                                ) : (
                                    <Area
                                        type="monotone"
                                        dataKey={config.dataKey}
                                        stroke="url(#splitStroke)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#splitColor)"
                                        animationDuration={1000}
                                    />
                                )}
                            </AreaChart>
                        ) : (
                            <BarChart data={filteredData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis
                                    dataKey="fullDate"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                                <Bar dataKey={config.dataKey} radius={[4, 4, 0, 0]} animationDuration={1000}>
                                    {filteredData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            // Balance = Toujours Indigo. Autres = Vert/Rouge
                                            fill={chartType === 'BALANCE' ? config.color : (entry[config.dataKey] >= 0 ? '#10b981' : '#f43f5e')}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default GraphView;