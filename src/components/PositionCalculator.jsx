import React, { useState, useEffect, useRef } from 'react';
import { Calculator, RefreshCw, AlertCircle, Target, Wallet, ArrowDownToLine, ChevronDown, Check } from 'lucide-react';

// Mapping des symboles pour l'API Binance
const API_SYMBOLS = {
    'EURUSD': 'EURUSDT',
    'GBPUSD': 'GBPUSDT',
    'USDJPY': 'USDJPY',
    'XAUUSD': 'PAXGUSDT',
    'BTCUSD': 'BTCUSDT',
    'ETHUSD': 'ETHUSDT',
    'US30': null,
};

const PAIRS = [
    { code: 'EURUSD', name: 'Euro / US Dollar', type: 'FOREX' },
    { code: 'GBPUSD', name: 'Great Britain Pound', type: 'FOREX' },
    { code: 'USDJPY', name: 'US Dollar / Yen', type: 'FOREX' },
    { code: 'XAUUSD', name: 'Gold', type: 'COMMODITY' },
    { code: 'BTCUSD', name: 'Bitcoin', type: 'CRYPTO' },
    { code: 'ETHUSD', name: 'Ethereum', type: 'CRYPTO' },
];

const PositionCalculator = ({ currentBalance, defaultRisk }) => {
    // --- STATES ---
    const [balance, setBalance] = useState(currentBalance || 10000);
    const [riskPercent, setRiskPercent] = useState(defaultRisk || 1.0);
    const [pair, setPair] = useState(PAIRS[0]);

    // Custom Dropdown State
    const [isPairOpen, setIsPairOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Prix
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);

    // Mettre à jour le solde si celui de l'App change
    useEffect(() => {
        if (currentBalance) setBalance(currentBalance);
    }, [currentBalance]);

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsPairOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- API FETCH PRICE ---
    const fetchPrice = async () => {
        const symbol = API_SYMBOLS[pair.code];
        if (!symbol) return;

        setIsLoadingPrice(true);
        try {
            const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
            const data = await response.json();
            if (data.price) {
                setEntryPrice(parseFloat(data.price).toString());
            }
        } catch (error) {
            console.error("Erreur API Prix:", error);
        } finally {
            setIsLoadingPrice(false);
        }
    };

    // Charger le prix quand on change de paire
    useEffect(() => {
        fetchPrice();
        setStopLoss('');
    }, [pair]);

    const selectPair = (selectedPair) => {
        setPair(selectedPair);
        setIsPairOpen(false);
    };

    // --- CALCULS ---
    const riskAmount = (balance * riskPercent) / 100;

    let positionSize = 0;
    let lotSize = 0;
    let pipsDistance = 0;

    if (entryPrice && stopLoss) {
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const priceDistance = Math.abs(entry - sl);

        if (priceDistance > 0) {
            const units = riskAmount / priceDistance;

            if (pair.type === 'FOREX') {
                lotSize = units / 100000;
                pipsDistance = priceDistance * 10000;
                if (pair.code.includes('JPY')) pipsDistance = priceDistance * 100;
            } else if (pair.type === 'COMMODITY') {
                lotSize = units / 100;
                pipsDistance = priceDistance * 10;
            } else {
                lotSize = units;
                pipsDistance = priceDistance;
            }
        }
    }

    // Styles
    const inputClass = "w-full bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white placeholder-gray-400";
    const labelClass = "text-xs font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 block";

    return (
        <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40 dark:border-white/5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center text-indigo-900 dark:text-white">
                    <Calculator className="mr-3 text-indigo-500" size={24} /> Calculateur de Risque
                </h2>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                    Binance API
                </div>
            </div>

            {/* --- SECTION 1 : COMPTE & PAIRE --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Capital */}
                <div>
                    <label className={labelClass}>Capital ($)</label>
                    <div className="relative">
                        <Wallet className="absolute left-3 top-3.5 text-gray-400" size={16} />
                        <input type="number" value={balance} onChange={(e) => setBalance(parseFloat(e.target.value))} className={`${inputClass} pl-10`} />
                    </div>
                </div>

                {/* Risque % */}
                <div>
                    <label className={labelClass}>Risque (%)</label>
                    <div className="relative">
                        <AlertCircle className="absolute left-3 top-3.5 text-gray-400" size={16} />
                        <input type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(parseFloat(e.target.value))} className={`${inputClass} pl-10`} />
                    </div>
                </div>

                {/* Sélection Paire (Custom Dropdown) */}
                <div ref={dropdownRef}>
                    <label className={labelClass}>Paire</label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsPairOpen(!isPairOpen)}
                            className={`${inputClass} flex items-center justify-between text-left h-[46px]`}
                        >
                            <div className="flex items-center gap-3">
                                <img src={`/icons/${pair.code.toLowerCase()}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} />
                                <span>{pair.code}</span>
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isPairOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isPairOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-700 max-h-60 overflow-y-auto z-50 p-1 animate-in fade-in zoom-in-95 duration-100">
                                {PAIRS.map((p) => (
                                    <button
                                        key={p.code}
                                        type="button"
                                        onClick={() => selectPair(p)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-neutral-700 rounded-lg transition-colors group"
                                    >
                                        <img
                                            src={`/icons/${p.code.toLowerCase()}.png`}
                                            alt=""
                                            className="w-5 h-5 object-contain"
                                            onError={(e) => {e.target.style.display='none'}}
                                        />
                                        <div className="text-left">
                                            <div className="font-bold text-gray-700 dark:text-gray-200 text-sm">{p.code}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{p.type}</div>
                                        </div>
                                        {pair.code === p.code && <Check size={16} className="ml-auto text-indigo-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-neutral-800 my-6"></div>

            {/* --- SECTION 2 : PRIX & SL --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Colonne GAUCHE : Inputs */}
                <div className="space-y-6">

                    {/* Prix Entrée */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className={labelClass}>Prix d'Entrée</label>
                            <button onClick={fetchPrice} disabled={isLoadingPrice} className="text-xs flex items-center gap-1 text-indigo-500 hover:text-indigo-600 font-bold transition-colors">
                                <RefreshCw size={12} className={isLoadingPrice ? "animate-spin" : ""} /> Actualiser
                            </button>
                        </div>
                        <div className="relative">
                            <Target className="absolute left-3 top-3.5 text-gray-400" size={16} />
                            <input
                                type="number"
                                placeholder="0.0000"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(e.target.value)}
                                className={`${inputClass} pl-10 border-indigo-200 dark:border-indigo-900`}
                            />
                        </div>
                    </div>

                    {/* Stop Loss */}
                    <div>
                        <label className={labelClass}>Stop Loss (Prix)</label>
                        <div className="relative">
                            <ArrowDownToLine className="absolute left-3 top-3.5 text-rose-400" size={16} />
                            <input
                                type="number"
                                placeholder="0.0000"
                                value={stopLoss}
                                onChange={(e) => setStopLoss(e.target.value)}
                                className={`${inputClass} pl-10 border-rose-200 dark:border-rose-900/30 focus:ring-rose-500`}
                            />
                        </div>
                        {pipsDistance > 0 && (
                            <div className="text-right mt-1 text-xs text-gray-400 font-mono">
                                Distance: ~{pipsDistance.toFixed(1)} {pair.type === 'FOREX' ? 'pips' : 'pts'}
                            </div>
                        )}
                    </div>

                </div>

                {/* Colonne DROITE : Résultats */}
                <div className="bg-gray-50 dark:bg-black/30 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 flex flex-col justify-center space-y-6">

                    {/* Risque Cash */}
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-neutral-400">Montant à Risquer</span>
                        <span className="text-xl font-bold text-rose-500">
                  {riskAmount.toFixed(2)} $
               </span>
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-neutral-700 border-dashed"></div>

                    {/* Résultat Principal */}
                    <div className="text-center">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest block mb-2">Taille de position conseillée</span>
                        <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight drop-shadow-sm">
                            {isFinite(lotSize) && lotSize > 0 ? lotSize.toFixed(2) : "0.00"}
                        </div>
                        <span className="text-sm font-bold text-gray-500 dark:text-neutral-500 mt-2 block">
                  {pair.type === 'FOREX' ? 'LOTS STANDARD' : pair.type === 'CRYPTO' ? pair.code.substring(0,3) : 'CONTRATS'}
               </span>
                    </div>

                    {/* Units raw */}
                    {isFinite(lotSize) && lotSize > 0 && pair.type === 'FOREX' && (
                        <div className="text-center text-xs text-gray-400 font-mono">
                            ({(lotSize * 100000).toLocaleString()} unités)
                        </div>
                    )}

                </div>

            </div>

            {/* Note de bas de page */}
            <div className="mt-8 bg-yellow-50/50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30 flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={18} />
                <p className="text-xs text-yellow-800 dark:text-yellow-500 leading-relaxed">
                    <strong>Note importante :</strong> Vérifiez toujours la taille de contrat chez votre broker.
                </p>
            </div>

        </div>
    );
};

export default PositionCalculator;