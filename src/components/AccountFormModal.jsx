import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Briefcase, DollarSign, ChevronDown, Check, Euro, PoundSterling, Target, AlertTriangle } from 'lucide-react';

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', icon: DollarSign },
    { code: 'EUR', name: 'Euro', icon: Euro },
    { code: 'GBP', name: 'British Pound', icon: PoundSterling },
];

const AccountFormModal = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [formData, setFormData] = useState({
        name: '', description: '', broker: '', platform: '',
        color: '#4f46e5', currency: 'USD',
        // Plus de initial_balance
        max_risk: '2',       // % par défaut
        default_rr: '2',     // RR par défaut
        commission_pct: 0, commission_min: 0, commission_max: 0
    });

    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const currencyDropdownRef = useRef(null);

    useEffect(() => {
        if (accountToEdit) {
            setFormData({
                ...accountToEdit,
                max_risk: accountToEdit.max_risk || '2',
                default_rr: accountToEdit.default_rr || '2'
            });
        } else {
            setFormData({
                name: '', description: '', broker: '', platform: '',
                color: '#4f46e5', currency: 'USD',
                max_risk: '2', default_rr: '2',
                commission_pct: 0, commission_min: 0, commission_max: 0
            });
        }
    }, [accountToEdit, isOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
                setIsCurrencyOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const currentCurrency = CURRENCIES.find(c => c.code === formData.currency) || CURRENCIES[0];
    const CurrencyIcon = currentCurrency.icon;

    const labelClass = "block text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-2 ml-1";
    const inputClass = "w-full bg-white dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300 dark:placeholder:text-neutral-700 font-medium";

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full md:max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-800">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        {accountToEdit ? 'Modifier le Compte' : 'Nouveau Compte'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 scrollbar-hide">

                    {/* 1. Identité */}
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Nom du compte</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} placeholder="Ex: Principal" autoFocus />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* DEVISE */}
                            <div ref={currencyDropdownRef} className="relative">
                                <label className={labelClass}>Devise</label>
                                <button type="button" onClick={() => setIsCurrencyOpen(!isCurrencyOpen)} className={`${inputClass} flex items-center justify-between text-left`}>
                                    <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-300"><CurrencyIcon size={14} /></div><span>{currentCurrency.code}</span></div>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCurrencyOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                                        {CURRENCIES.map((curr) => {
                                            const Icon = curr.icon;
                                            return (
                                                <button key={curr.code} type="button" onClick={() => { setFormData(prev => ({ ...prev, currency: curr.code })); setIsCurrencyOpen(false); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                                                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-300"><Icon size={12} /></div><span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{curr.code}</span></div>
                                                    {formData.currency === curr.code && <Check size={16} className="text-indigo-600" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* COULEUR */}
                            <div>
                                <label className={labelClass}>Couleur</label>
                                <div className="h-[48px] w-full relative rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-800 cursor-pointer bg-white dark:bg-neutral-950 flex items-center px-2">
                                    <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="flex items-center gap-3 w-full pl-2"><div className="w-6 h-6 rounded-full border border-black/10 shadow-sm flex-shrink-0" style={{ backgroundColor: formData.color }}></div><span className="text-xs font-mono text-gray-500 uppercase truncate">{formData.color}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. STRATÉGIE (NOUVEAU) */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                        <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-2"><Target size={16}/> Stratégie & Discipline</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Risque Max / Trade (%)</label>
                                <div className="relative">
                                    <input type="number" step="0.1" value={formData.max_risk} onChange={e => setFormData({...formData, max_risk: e.target.value})} className={inputClass + " pl-4"} placeholder="2" />
                                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>RR Ciblé (ex: 2)</label>
                                <div className="relative">
                                    <input type="number" step="0.1" value={formData.default_rr} onChange={e => setFormData({...formData, default_rr: e.target.value})} className={inputClass + " pl-4"} placeholder="2" />
                                    <span className="absolute right-4 top-3.5 text-gray-400 font-bold text-xs">R</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic leading-snug">
                            Votre <strong>Score de Discipline</strong> sera calculé automatiquement : si la perte potentielle (SL) dépasse {formData.max_risk || 0}%, vous serez pénalisé.
                        </p>
                    </div>

                    {/* 3. Infos Broker */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                        <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-2"><Briefcase size={16}/> Infos Broker</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>Broker</label><input type="text" value={formData.broker} onChange={e => setFormData({...formData, broker: e.target.value})} className={inputClass} placeholder="Ex: Vantage" /></div>
                            <div><label className={labelClass}>Plateforme</label><input type="text" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className={inputClass} placeholder="Ex: MT4" /></div>
                        </div>
                        <div><label className={labelClass}>Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={inputClass + " min-h-[80px]"} placeholder="Notes..." /></div>
                    </div>

                    {/* 4. Règles de Commission */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                        <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-2"><DollarSign size={16}/> Commissions (Optionnel)</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div><label className={labelClass}>% par lot</label><input type="number" step="0.01" value={formData.commission_pct} onChange={e => setFormData({...formData, commission_pct: parseFloat(e.target.value)})} className={inputClass} placeholder="0" /></div>
                            <div><label className={labelClass}>Min ($)</label><input type="number" step="0.01" value={formData.commission_min} onChange={e => setFormData({...formData, commission_min: parseFloat(e.target.value)})} className={inputClass} placeholder="Min" /></div>
                            <div><label className={labelClass}>Max ($)</label><input type="number" step="0.01" value={formData.commission_max} onChange={e => setFormData({...formData, commission_max: parseFloat(e.target.value)})} className={inputClass} placeholder="Max" /></div>
                        </div>
                    </div>

                </div>

                <div className="p-6 pt-2 pb-8 md:pb-6 bg-white dark:bg-[#1a1a1a]">
                    <button onClick={handleSubmit} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Save size={20} /> Enregistrer le compte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountFormModal;