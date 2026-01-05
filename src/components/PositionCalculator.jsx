import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, BaselineSeries } from 'lightweight-charts';
import { Calculator, AlertCircle, Target, Wallet, ArrowDownToLine, ChevronDown, TrendingUp, Lock, Unlock } from 'lucide-react';

const API_SYMBOLS = {
    'EURUSD': 'EURUSDT',
    'GBPUSD': 'GBPUSDT',
    'USDJPY': 'USDJPY',
    'XAUUSD': 'PAXGUSDT',
    'BTCUSD': 'BTCUSDT',
    'ETHUSD': 'ETHUSDT',
};

const PAIRS = [
    { code: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX' },
    { code: 'GBPUSD', name: 'Great Britain Pound', type: 'FOREX' },
    { code: 'USDJPY', name: 'US Dollar / Yen', type: 'FOREX' },
    { code: 'XAUUSD', name: 'Gold', type: 'COMMODITY' },
    { code: 'BTCUSD', name: 'Bitcoin', type: 'CRYPTO' },
    { code: 'ETHUSD', name: 'Ethereum', type: 'CRYPTO' },
];

const TIMEFRAMES = [
    { label: '1m', value: '1m' },
    { label: '3m', value: '3m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1j', value: '1d' },
];

// Helper HEX -> RGBA
const hexToRgba = (hex, alpha = 1) => {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length=== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(128,128,128,${alpha})`;
}

const PositionCalculator = ({ currentBalance, defaultRisk, currencySymbol = "$", colors }) => {
    // --- COULEURS DYNAMIQUES ---
    const themeColors = {
        win: colors?.win || '#10b981',
        loss: colors?.loss || '#ef4444',
        entry: colors?.buy || '#3b82f6',
        text: '#9CA3AF'
    };

    // --- STATES ---
    const [balance, setBalance] = useState(currentBalance || 10000);
    const [riskPercent, setRiskPercent] = useState(defaultRisk || 1.0);
    const [pair, setPair] = useState(PAIRS[0]);
    const [timeframe, setTimeframe] = useState('1h');

    // NOUVEAU : État pour le suivi automatique du prix
    const [isAutoEntry, setIsAutoEntry] = useState(true);

    const [isPairOpen, setIsPairOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Inputs Prix
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');

    // Data Store
    const [candleData, setCandleData] = useState([]);

    // Chart Refs
    const chartContainerRef = useRef();
    const chartInstance = useRef(null);
    const candlestickSeries = useRef(null);
    const tpSeriesRef = useRef(null);
    const slSeriesRef = useRef(null);

    const parseInput = (val) => parseFloat(val.toString().replace(',', '.')) || 0;

    // Reset auto entry quand on change de paire
    useEffect(() => {
        setIsAutoEntry(true);
        setStopLoss('');
        setTakeProfit('');
    }, [pair]);

    // --- 1. INITIALISATION DU GRAPHE ---
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: themeColors.text,
            },
            grid: {
                vertLines: { color: 'rgba(40, 40, 40, 0.1)' },
                horzLines: { color: 'rgba(40, 40, 40, 0.1)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        // A. Zone de Gain
        const tpSeries = chart.addSeries(BaselineSeries, {
            baseValue: { type: 'price', price: 0 },
            topFillColor1: hexToRgba(themeColors.win, 0.15),
            topFillColor2: hexToRgba(themeColors.win, 0.15),
            topLineColor: 'rgba(0,0,0,0)',
            bottomFillColor1: 'rgba(0,0,0,0)',
            bottomFillColor2: 'rgba(0,0,0,0)',
            bottomLineColor: 'rgba(0,0,0,0)',
        });

        // B. Zone de Perte
        const slSeries = chart.addSeries(BaselineSeries, {
            baseValue: { type: 'price', price: 0 },
            topFillColor1: 'rgba(0,0,0,0)',
            topFillColor2: 'rgba(0,0,0,0)',
            topLineColor: 'rgba(0,0,0,0)',
            bottomFillColor1: hexToRgba(themeColors.loss, 0.15),
            bottomFillColor2: hexToRgba(themeColors.loss, 0.15),
            bottomLineColor: 'rgba(0,0,0,0)',
        });

        // C. Bougies
        const candles = chart.addSeries(CandlestickSeries, {
            upColor: themeColors.win,
            downColor: themeColors.loss,
            borderVisible: false,
            wickUpColor: themeColors.win,
            wickDownColor: themeColors.loss,
        });

        chartInstance.current = chart;
        candlestickSeries.current = candles;
        tpSeriesRef.current = tpSeries;
        slSeriesRef.current = slSeries;

        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    // --- 1.5 MISE À JOUR DYNAMIQUE COULEURS ---
    useEffect(() => {
        if(!chartInstance.current) return;
        if(candlestickSeries.current) {
            candlestickSeries.current.applyOptions({
                upColor: themeColors.win, downColor: themeColors.loss,
                wickUpColor: themeColors.win, wickDownColor: themeColors.loss,
            });
        }
        if(tpSeriesRef.current) {
            tpSeriesRef.current.applyOptions({
                topFillColor1: hexToRgba(themeColors.win, 0.15),
                topFillColor2: hexToRgba(themeColors.win, 0.15),
            });
        }
        if(slSeriesRef.current) {
            slSeriesRef.current.applyOptions({
                bottomFillColor1: hexToRgba(themeColors.loss, 0.15),
                bottomFillColor2: hexToRgba(themeColors.loss, 0.15),
            });
        }
    }, [colors]);

    // --- 2. FETCH DONNÉES & AUTO UPDATE ---
    useEffect(() => {
        const fetchCandles = async () => {
            const symbol = API_SYMBOLS[pair.code];
            if (!symbol) return;

            try {
                const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=200`);
                const data = await response.json();

                const candles = data.map(d => ({
                    time: d[0] / 1000,
                    open: parseFloat(d[1]),
                    high: parseFloat(d[2]),
                    low: parseFloat(d[3]),
                    close: parseFloat(d[4]),
                }));

                setCandleData(candles);

                if (candlestickSeries.current) {
                    candlestickSeries.current.setData(candles);

                    // --- LOGIQUE AUTO UPDATE ---
                    if (candles.length > 0) {
                        const currentPrice = candles[candles.length - 1].close;

                        // Si le mode auto est activé OU si le champ est vide
                        if (isAutoEntry || !entryPrice) {
                            setEntryPrice(currentPrice.toString());
                        }
                    }
                }
            } catch (error) {
                console.error("Erreur Fetch:", error);
            }
        };

        fetchCandles();
        // Mise à jour toutes les 2 secondes pour plus de fluidité si auto update
        const interval = setInterval(fetchCandles, 2000);
        return () => clearInterval(interval);

    }, [pair, timeframe, isAutoEntry]); // Ajout de isAutoEntry aux dépendances pour réagir au changement

    // --- 3. GESTION INPUT MANUEL ---
    const handleEntryChange = (e) => {
        setEntryPrice(e.target.value);
        setIsAutoEntry(false); // Désactive l'auto-update si l'utilisateur tape
    };

    // --- 4. MISE À JOUR DES LIGNES ---
    const entryLineRef = useRef(null);
    const slLineRef = useRef(null);
    const tpLineRef = useRef(null);

    useEffect(() => {
        const series = candlestickSeries.current;
        if (!series) return;

        const updateLine = (ref, price, color, title) => {
            const val = parseInput(price);
            if (val > 0) {
                const opts = { price: val, color: color, lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: title };
                if (ref.current) ref.current.applyOptions(opts);
                else ref.current = series.createPriceLine(opts);
            } else if (ref.current) {
                series.removePriceLine(ref.current);
                ref.current = null;
            }
        };

        updateLine(entryLineRef, entryPrice, themeColors.entry, 'ENTRÉE');
        updateLine(slLineRef, stopLoss, themeColors.loss, 'SL');
        updateLine(tpLineRef, takeProfit, themeColors.win, 'TP');

        const entryVal = parseInput(entryPrice);
        const slVal = parseInput(stopLoss);
        const tpVal = parseInput(takeProfit);

        if (tpSeriesRef.current && slSeriesRef.current && candleData.length > 0 && entryVal > 0) {
            const baseOptions = { baseValue: { type: 'price', price: entryVal } };
            tpSeriesRef.current.applyOptions(baseOptions);
            slSeriesRef.current.applyOptions(baseOptions);

            const tpData = candleData.map(c => ({ time: c.time, value: tpVal > 0 ? tpVal : entryVal }));
            const slData = candleData.map(c => ({ time: c.time, value: slVal > 0 ? slVal : entryVal }));

            tpSeriesRef.current.setData(tpData);
            slSeriesRef.current.setData(slData);
        }

    }, [entryPrice, stopLoss, takeProfit, candleData, colors]);

    // --- CALCULS ---
    const riskAmount = (parseInput(balance) * parseInput(riskPercent)) / 100;
    const entry = parseInput(entryPrice);
    const sl = parseInput(stopLoss);
    const tp = parseInput(takeProfit);

    let lotSize = 0;
    let rewardAmount = 0;
    let rrRatio = 0;

    if (entry > 0 && sl > 0) {
        const priceDistance = Math.abs(entry - sl);
        if (priceDistance > 0) {
            let units = 0;
            if (pair.code === 'USDJPY') units = (riskAmount * entry) / priceDistance;
            else units = riskAmount / priceDistance;

            if (pair.type === 'FOREX') lotSize = units / 100000;
            else if (pair.type === 'COMMODITY') lotSize = units / 100;
            else lotSize = units;

            if (tp > 0) {
                const profitDistance = Math.abs(tp - entry);
                const ratio = profitDistance / priceDistance;
                rewardAmount = riskAmount * ratio;
                rrRatio = ratio;
            }
        }
    }

    const formatLotSize = (size) => {
        if (!isFinite(size) || size <= 0) return "0.00";
        if (size < 0.1) return size.toFixed(4);
        if (size < 1) return size.toFixed(3);
        return size.toFixed(2);
    };

    const inputClass = "w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white placeholder-gray-400";
    const labelClass = "text-xs font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block";

    return (
        <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-6 md:p-8 rounded-3xl shadow-xl border border-white/40 dark:border-white/5 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 mb-20">

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold flex items-center text-indigo-900 dark:text-white">
                    <Calculator className="mr-3 text-indigo-500" size={24} /> Trading Companion
                </h2>
                <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg overflow-x-auto max-w-full">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf.value}
                            onClick={() => setTimeframe(tf.value)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                                timeframe === tf.value
                                    ? 'bg-white dark:bg-neutral-600 text-indigo-600 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {tf.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-8 bg-white dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden relative">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="font-bold text-lg dark:text-white">{pair.code}</span>
                    <span className="text-xs bg-gray-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{timeframe}</span>
                </div>

                <div ref={chartContainerRef} className="w-full h-[300px]" />

                <div className="absolute bottom-2 right-2 flex gap-3 text-[10px] font-bold bg-white/80 dark:bg-black/60 px-2 py-1 rounded-lg backdrop-blur-sm z-20">
                    <span style={{color: themeColors.entry}}>ENTRY</span>
                    <span style={{color: themeColors.loss}}>SL</span>
                    <span style={{color: themeColors.win}}>TP</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className={labelClass}>Capital</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-3.5 text-gray-400" size={16} />
                        <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className={`${inputClass} pl-10`} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Risque %</label>
                    <div className="relative">
                        <AlertCircle className="absolute left-3 top-3.5 text-gray-400" size={16} />
                        <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} className={`${inputClass} pl-10`} />
                    </div>
                </div>
                <div ref={dropdownRef}>
                    <label className={labelClass}>Paire</label>
                    <div className="relative">
                        <button type="button" onClick={() => setIsPairOpen(!isPairOpen)} className={`${inputClass} flex items-center justify-between text-left h-[46px]`}>
                            <div className="flex items-center gap-3">
                                <span className="font-bold">{pair.code}</span>
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isPairOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isPairOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl z-50 p-1 max-h-60 overflow-y-auto">
                                {PAIRS.map((p) => (
                                    <button key={p.code} onClick={() => { setPair(p); setIsPairOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-neutral-700 rounded-lg">
                                        <span className="text-sm font-bold dark:text-white">{p.code}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-neutral-800 my-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4 md:col-span-1">

                    {/* INPUT PRIX D'ENTRÉE AVEC LOCK */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={labelClass.replace('mb-2', 'mb-0')}>Prix d'Entrée</label>
                            <button
                                onClick={() => setIsAutoEntry(!isAutoEntry)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                                    isAutoEntry
                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        : 'bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400'
                                }`}
                            >
                                {isAutoEntry ? <Unlock size={10} /> : <Lock size={10} />}
                                {isAutoEntry ? 'AUTO' : 'MANUEL'}
                            </button>
                        </div>
                        <div className="relative">
                            <Target className="absolute left-3 top-3.5" style={{color: themeColors.entry}} size={16} />
                            <input
                                type="number"
                                placeholder="0.0000"
                                value={entryPrice}
                                onChange={handleEntryChange}
                                className={`${inputClass} pl-10 focus:ring-1 pr-10`}
                                style={{borderColor: themeColors.entry + '40'}}
                            />
                            {/* Petit indicateur visuel de live dans l'input */}
                            {isAutoEntry && (
                                <span className="absolute right-3 top-4 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Stop Loss</label>
                        <div className="relative">
                            <ArrowDownToLine className="absolute left-3 top-3.5" style={{color: themeColors.loss}} size={16} />
                            <input type="number" placeholder="0.0000" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className={`${inputClass} pl-10 focus:ring-1`} style={{borderColor: themeColors.loss + '40'}} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Take Profit</label>
                        <div className="relative">
                            <TrendingUp className="absolute left-3 top-3.5" style={{color: themeColors.win}} size={16} />
                            <input type="number" placeholder="Optionnel" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className={`${inputClass} pl-10 focus:ring-1`} style={{borderColor: themeColors.win + '40'}} />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-black/30 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 flex flex-col justify-center items-center text-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Taille Position</span>
                        <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                            {formatLotSize(lotSize)}
                        </div>
                        <span className="text-xs font-bold text-gray-500 mt-1">
                             {pair.type === 'FOREX' ? 'LOTS' : pair.type === 'CRYPTO' ? pair.code.substring(0,3) : 'CONTRATS'}
                        </span>
                        <div className="mt-4 text-xs font-mono text-gray-400">
                            Risque: -{riskAmount.toFixed(2)} {currencySymbol}
                        </div>
                    </div>

                    <div className={`rounded-2xl p-6 border flex flex-col justify-center items-center text-center transition-colors`}
                         style={{
                             backgroundColor: tp > 0 ? hexToRgba(themeColors.win, 0.05) : '',
                             borderColor: tp > 0 ? hexToRgba(themeColors.win, 0.2) : ''
                         }}
                    >
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Gain Potentiel</span>
                        {tp > 0 && entry > 0 ? (
                            <>
                                <div className="text-4xl font-extrabold" style={{color: themeColors.win}}>
                                    +{rewardAmount.toFixed(2)} {currencySymbol}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 text-xs font-bold rounded" style={{ backgroundColor: hexToRgba(themeColors.win, 0.2), color: themeColors.win }}>
                                        RR 1:{rrRatio.toFixed(1)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-300 dark:text-gray-600 text-sm italic">
                                Entrez un TP pour calculer
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PositionCalculator;