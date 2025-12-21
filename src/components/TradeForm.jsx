import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, X, Calendar, ChevronDown, Check, ArrowRightLeft, Wallet, TrendingUp, Save } from 'lucide-react';

const PAIRS = [
    { code: 'EURUSD', name: 'Euro / US Dollar' },
    { code: 'GBPUSD', name: 'Great Britain Pound' },
    { code: 'USDJPY', name: 'US Dollar / Yen' },
    { code: 'XAUUSD', name: 'Gold' },
    { code: 'US30', name: 'Dow Jones' },
    { code: 'BTCUSD', name: 'Bitcoin' },
    { code: 'ETHUSD', name: 'Ethereum' },
];

const TradeForm = ({ isOpen, onClose, onAddTrade, onUpdateTrade, tradeToEdit, currencySymbol }) => {
    if (!isOpen) return null;

    // Mode: 'trade' ou 'transfer'
    const [mode, setMode] = useState('trade');

    // State pour Trading
    const [formData, setFormData] = useState({
        pair: '', date: new Date().toISOString().split('T')[0],
        type: 'BUY', entry: '', exit: '', sl: '', tp: '', lot: '', profit: ''
    });

    // State pour Transfert (Solde)
    const [transferData, setTransferData] = useState({
        type: 'DEPOSIT', // DEPOSIT ou WITHDRAWAL
        amount: '',
        date: new Date().toISOString().split('T')[0],
    });

    const [isPairOpen, setIsPairOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- EFFET POUR PRÉ-REMPLIR SI ÉDITION ---
    useEffect(() => {
        if (tradeToEdit) {
            // Si c'est un mouvement de solde
            if (tradeToEdit.pair === 'SOLDE') {
                setMode('transfer');
                setTransferData({
                    type: tradeToEdit.type,
                    amount: Math.abs(parseFloat(tradeToEdit.profit)).toString(),
                    date: tradeToEdit.date
                });
            } else {
                // Si c'est un vrai trade
                setMode('trade');
                setFormData({
                    pair: tradeToEdit.pair,
                    date: tradeToEdit.date,
                    type: tradeToEdit.type,
                    entry: tradeToEdit.entry,
                    exit: tradeToEdit.exit,
                    sl: tradeToEdit.sl,
                    tp: tradeToEdit.tp,
                    lot: tradeToEdit.lot,
                    profit: tradeToEdit.profit
                });
            }
        } else {
            // Réinitialisation si mode Création
            setMode('trade');
            setFormData({
                pair: '', date: new Date().toISOString().split('T')[0],
                type: 'BUY', entry: '', exit: '', sl: '', tp: '', lot: '', profit: ''
            });
            setTransferData({
                type: 'DEPOSIT',
                amount: '',
                date: new Date().toISOString().split('T')[0],
            });
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

    const handleSubmit = (e) => {
        e.preventDefault();

        let finalData = {};

        if (mode === 'trade') {
            if(!formData.pair || !formData.entry) return;
            finalData = { ...formData };
        } else {
            // Logique pour Dépôt/Retrait
            if(!transferData.amount) return;
            const profitValue = transferData.type === 'DEPOSIT'
                ? parseFloat(transferData.amount)
                : -parseFloat(transferData.amount);

            finalData = {
                pair: 'SOLDE',
                type: transferData.type,
                date: transferData.date,
                entry: 0, exit: 0, sl: 0, tp: 0, lot: 0,
                profit: profitValue
            };
        }

        // --- DISTINCTION AJOUT / MODIFICATION ---
        if (tradeToEdit) {
            onUpdateTrade({ ...finalData, id: tradeToEdit.id });
        } else {
            onAddTrade(finalData);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const selectPair = (code) => { setFormData({ ...formData, pair: code }); setIsPairOpen(false); }

    // Styles
    const inputContainerClass = "flex flex-col gap-1";
    const labelClass = "text-xs font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider ml-1";
    const inputClass = "w-full bg-gray-100 dark:bg-neutral-800 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all dark:text-white placeholder-gray-400";
    const tabClass = (active) => `flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-900/50 flex-shrink-0">
                    <h3 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
                        {mode === 'trade' ? <TrendingUp className="mr-2 text-indigo-500" /> : <Wallet className="mr-2 text-emerald-500" />}
                        {tradeToEdit ? 'Modifier le Trade' : (mode === 'trade' ? 'Nouveau Trade' : 'Gestion Solde')}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-500 transition-colors"><X size={20} /></button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-8">

                    {/* TABS SWITCHER */}
                    <div className="flex gap-4 mb-8">
                        <button type="button" onClick={() => setMode('trade')} className={tabClass(mode === 'trade')}>
                            <TrendingUp size={16} /> Trading
                        </button>
                        <button type="button" onClick={() => setMode('transfer')} className={tabClass(mode === 'transfer')}>
                            <Wallet size={16} /> Dépôt / Retrait
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* --- FORMULAIRE TRADE --- */}
                        {mode === 'trade' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Selecteur Paire */}
                                    <div className={inputContainerClass} ref={dropdownRef}>
                                        <label className={labelClass}>Paire</label>
                                        <div className="relative">
                                            <button type="button" onClick={() => setIsPairOpen(!isPairOpen)} className={`${inputClass} flex items-center justify-between text-left`}>
                                                {formData.pair ? (
                                                    <div className="flex items-center gap-3">
                                                        <img src={`/icons/${formData.pair.toLowerCase()}.png`} alt={formData.pair} className="w-6 h-6 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                                        <span>{formData.pair}</span>
                                                    </div>
                                                ) : <span className="text-gray-400">Sélectionner</span>}
                                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isPairOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isPairOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-700 max-h-40 overflow-y-auto z-10 p-1">
                                                    {PAIRS.map((pair) => (
                                                        <button key={pair.code} type="button" onClick={() => selectPair(pair.code)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-neutral-700 rounded-lg transition-colors group">
                                                            <img src={`/icons/${pair.code.toLowerCase()}.png`} alt={pair.code} className="w-6 h-6 object-contain" onError={(e) => {e.target.style.display='none'}} />
                                                            <div className="text-left"><div className="font-bold text-gray-700 dark:text-gray-200 text-sm">{pair.code}</div></div>
                                                            {formData.pair === pair.code && <Check size={16} className="ml-auto text-indigo-500" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className={inputContainerClass}>
                                        <label className={labelClass}>Date</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><Calendar size={18} /></div>
                                            <input type="date" name="date" value={formData.date} onChange={handleChange} className={`${inputClass} pl-12 cursor-pointer dark:[color-scheme:dark]`} />
                                        </div>
                                    </div>

                                    {/* Direction */}
                                    <div className={inputContainerClass}>
                                        <label className={labelClass}>Direction</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl">
                                            <button type="button" onClick={() => setFormData({...formData, type: 'BUY'})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'BUY' ? 'bg-white dark:bg-neutral-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>BUY</button>
                                            <button type="button" onClick={() => setFormData({...formData, type: 'SELL'})} className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'SELL' ? 'bg-white dark:bg-neutral-700 text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>SELL</button>
                                        </div>
                                    </div>

                                    {/* Lot */}
                                    <div className={inputContainerClass}>
                                        <label className={labelClass}>Lot Size</label>
                                        <input type="number" name="lot" placeholder="0.00" value={formData.lot} onChange={handleChange} className={inputClass} step="0.01" />
                                    </div>
                                </div>

                                {/* Prix */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={inputContainerClass}><label className={labelClass}>Entrée</label><input type="number" name="entry" value={formData.entry} onChange={handleChange} className={inputClass} step="0.00001" /></div>
                                    <div className={inputContainerClass}><label className={labelClass}>Sortie</label><input type="number" name="exit" value={formData.exit} onChange={handleChange} className={inputClass} step="0.00001" /></div>
                                    <div className={inputContainerClass}><label className={labelClass}>Stop Loss</label><input type="number" name="sl" value={formData.sl} onChange={handleChange} className={inputClass} step="0.00001" /></div>
                                    <div className={inputContainerClass}><label className={labelClass}>Take Profit</label><input type="number" name="tp" value={formData.tp} onChange={handleChange} className={inputClass} step="0.00001" /></div>
                                </div>

                                {/* P&L */}
                                <div className="pt-4 border-t border-gray-100 dark:border-neutral-800">
                                    <label className={labelClass}>Profit / Perte ({currencySymbol})</label>
                                    <input type="number" name="profit" placeholder="0.00" value={formData.profit} onChange={handleChange} className={`w-full bg-transparent text-3xl font-bold outline-none mt-1 ${parseFloat(formData.profit) >= 0 ? 'text-emerald-500' : 'text-rose-500'} placeholder-gray-300`} />
                                </div>
                            </>
                        )}

                        {/* --- FORMULAIRE TRANSFERT --- */}
                        {mode === 'transfer' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setTransferData({...transferData, type: 'DEPOSIT'})}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${transferData.type === 'DEPOSIT' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-200 dark:border-neutral-700 text-gray-400'}`}>
                                        <Wallet size={24} /> <span className="font-bold">Dépôt</span>
                                    </button>
                                    <button type="button" onClick={() => setTransferData({...transferData, type: 'WITHDRAWAL'})}
                                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${transferData.type === 'WITHDRAWAL' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'border-gray-200 dark:border-neutral-700 text-gray-400'}`}>
                                        <ArrowRightLeft size={24} /> <span className="font-bold">Retrait</span>
                                    </button>
                                </div>

                                <div className={inputContainerClass}>
                                    <label className={labelClass}>Date</label>
                                    <input type="date" value={transferData.date} onChange={(e) => setTransferData({...transferData, date: e.target.value})} className={`${inputClass} dark:[color-scheme:dark]`} />
                                </div>

                                <div className={inputContainerClass}>
                                    <label className={labelClass}>Montant ({currencySymbol})</label>
                                    <input type="number" placeholder="0.00" value={transferData.amount} onChange={(e) => setTransferData({...transferData, amount: e.target.value})} className={`${inputClass} text-2xl font-bold`} />
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-neutral-800">
                            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">Annuler</button>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                                {tradeToEdit ? <Save size={18} /> : <PlusCircle size={18} />}
                                {tradeToEdit ? 'Mettre à jour' : 'Valider'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default TradeForm;