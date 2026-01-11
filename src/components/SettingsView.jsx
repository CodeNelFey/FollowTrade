import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Mail, Save, AlertTriangle, Sliders, Eye, Layout, CheckCircle, ChevronDown, Check, DollarSign, Euro, PoundSterling, ArrowLeft, Camera, LogOut, ShieldAlert, PaintBucket, RotateCcw, Crown, Sparkles, CheckSquare, CreditCard, ExternalLink } from 'lucide-react';
import { api } from '../api';
import { config } from '../config';

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', icon: DollarSign },
    { code: 'EUR', name: 'Euro', icon: Euro },
    { code: 'GBP', name: 'British Pound', icon: PoundSterling },
];

const DEFAULT_COLORS = { balance: '#4f46e5', buy: '#2563eb', sell: '#ea580c', win: '#10b981', loss: '#f43f5e' };

// --- CONFIG STRIPE ---
const STRIPE_PRICE_PRO = config.STRIPE.PRO_PLAN_ID;

const SettingsView = ({ user, onUpdateUser, onClose, onLogout, onNavigate }) => {
    const BASE_URL = config.API_URL || '';

    // --- PLANS (Configuration) ---
    const PLANS = [
        {
            id: 0,
            name: 'Free',
            icon: User,
            color: 'bg-gray-500',
            price: 'Gratuit',
            features: ['Journal de base', 'Publicités'],
            disabled: false
        },
        {
            id: 1,
            name: 'PRO',
            icon: Crown,
            color: 'bg-amber-500',
            price: '9.99€ / mois',
            features: ['Couleurs perso', 'Zéro Pubs', 'Support Prio'],
            disabled: false,
            action: 'STRIPE' // Active le paiement
        },
        {
            id: 2,
            name: 'VIP',
            icon: Sparkles,
            color: 'bg-emerald-500',
            price: 'Réservé',
            features: ['Accès Calendrier', 'Analyses Graphiques', 'Thèmes & Couleurs'],
            disabled: true, // Verrouillé
            badge: 'Privé'
        },
    ];

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', password: '', confirmPassword: '',
        default_risk: 1.0, defaultView: 'journal', showImages: true, currency: 'USD',
        colors: DEFAULT_COLORS, is_pro: 0
    });

    const [avatarUrl, setAvatarUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const fileInputRef = useRef(null);
    const currencyDropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '',
                password: '', confirmPassword: '', default_risk: user.default_risk || 1.0,
                defaultView: user.preferences?.defaultView || 'journal', showImages: user.preferences?.showImages !== false,
                currency: user.preferences?.currency || 'USD', colors: user.colors || DEFAULT_COLORS, is_pro: user.is_pro || 0
            });
            setAvatarUrl(user.avatar_url || '');
        }
    }, [user]);

    useEffect(() => {
        const handleScroll = (e) => {
            const scrollTop = window.scrollY || e.target.scrollTop || 0;
            setIsScrolled(scrollTop > 20);
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) setIsCurrencyOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsDirty = () => setIsDirty(true);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
        markAsDirty();
    };

    const handleColorChange = (key, color) => {
        setFormData(prev => ({ ...prev, colors: { ...prev.colors, [key]: color } }));
        markAsDirty();
    };

    // --- GESTION DU CLIC SUR UN PLAN (STRIPE & RESILIATION) ---
    const handlePlanClick = async (plan) => {
        // CAS 1 : RÉSILIATION (Je suis PRO et je clique sur FREE)
        if (user.is_pro === 1 && plan.id === 0) {
            if (window.confirm("Voulez-vous vraiment résilier votre abonnement PRO et repasser en version Gratuite ?")) {
                setIsLoading(true);
                try {
                    await api.cancelSubscription();
                    // Mise à jour immédiate de l'interface
                    const updatedUser = { ...user, is_pro: 0 };
                    onUpdateUser(updatedUser);
                    setFormData(prev => ({ ...prev, is_pro: 0 })); // Update local state too
                    setMessage({ type: 'success', text: "Abonnement résilié. Retour au plan Gratuit." });
                } catch (e) {
                    setMessage({ type: 'error', text: "Erreur lors de la résiliation." });
                } finally {
                    setIsLoading(false);
                }
            }
            return;
        }

        // CAS 2 : UPGRADE (Normal)
        if (plan.disabled || user.is_pro >= plan.id) return;

        if (plan.action === 'STRIPE') {
            setIsLoading(true);
            try {
                // Appel API pour créer la session Stripe
                const response = await api.createCheckoutSession(STRIPE_PRICE_PRO, 'PRO');
                if (response.url) {
                    window.location.href = response.url; // Redirection
                }
            } catch (error) {
                setMessage({ type: 'error', text: "Erreur initialisation paiement" });
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarUrl(URL.createObjectURL(file));
        try {
            const res = await api.uploadAvatar(file);
            if (res.avatar_url) {
                const updatedUser = { ...user, avatar_url: res.avatar_url };
                api.setUser(updatedUser); onUpdateUser(updatedUser);
                setMessage({ type: 'success', text: "Photo mise à jour" });
            }
        } catch (error) { setMessage({ type: 'error', text: "Erreur upload" }); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsLoading(true); setMessage(null);
        if (formData.password && formData.password !== formData.confirmPassword) { setMessage({ type: 'error', text: "Mots de passe différents." }); setIsLoading(false); return; }
        try {
            const { confirmPassword, ...dataToSend } = formData;
            if (!dataToSend.password) delete dataToSend.password;
            const preferences = { defaultView: dataToSend.defaultView, showImages: dataToSend.showImages, currency: dataToSend.currency };
            await onUpdateUser({ ...dataToSend, preferences, colors: dataToSend.colors });
            setMessage({ type: 'success', text: "Paramètres sauvegardés !" });
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setIsDirty(false);
            setTimeout(() => setMessage(null), 3000);
        } catch (error) { setMessage({ type: 'error', text: "Erreur sauvegarde." }); } finally { setIsLoading(false); }
    };

    const resetColors = () => { setFormData(prev => ({ ...prev, colors: DEFAULT_COLORS })); markAsDirty(); };

    // Styles
    const sectionClass = "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 dark:border-white/5 shadow-sm mb-8";
    const labelClass = "block text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-2 ml-1";
    const inputClass = "w-full bg-white dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300 dark:placeholder:text-neutral-700 font-medium";
    const colorInputWrapper = "flex flex-col gap-2 p-3 rounded-2xl bg-white/50 dark:bg-neutral-950/50 border border-gray-100 dark:border-neutral-800 transition-colors";
    const currentCurrency = CURRENCIES.find(c => c.code === formData.currency) || CURRENCIES[0];
    const CurrencyIcon = currentCurrency.icon;
    let displayAvatar = null;
    if (avatarUrl) displayAvatar = api.getAvatarUrl(avatarUrl);

    const renderColorInput = (label, key) => (
        <div className={colorInputWrapper}>
            <label className={labelClass}>{label}</label>
            <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-full border border-gray-200 dark:border-neutral-700 shadow-sm overflow-hidden hover:scale-110 transition-transform cursor-pointer">
                    <div className="absolute inset-0 pointer-events-none" style={{backgroundColor: formData.colors[key]}}></div>
                    <input type="color" value={formData.colors[key]} onChange={(e) => handleColorChange(key, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 uppercase">{formData.colors[key]}</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">

            {/* --- HEADER STICKY --- */}
            <div className={`
                z-40 flex items-center justify-between mb-8
                -top-4 -mt-4 -mx-4 px-4 py-4 
                md:-top-8 md:-mt-8 md:-mx-8 md:px-8 md:py-6
                transition-all duration-300 ease-in-out
                ${isScrolled
                ? 'bg-white/70 dark:bg-black/70 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-200/50 dark:border-neutral-800/50'
                : 'bg-transparent border-b border-transparent'}
            `}>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className={`p-2.5 rounded-full text-gray-700 dark:text-gray-200 border hover:scale-105 transition-all ${isScrolled ? 'bg-white/50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700' : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-sm'}`}>
                        <ArrowLeft size={20} />
                    </button>
                    <div><h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white transition-opacity">Paramètres</h2></div>
                </div>
            </div>

            {message && (<div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>{message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}<span className="font-bold text-sm">{message.text}</span></div>)}

            <form onSubmit={handleSubmit}>
                {/* 1. PROFIL */}
                <section className={sectionClass}>
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-neutral-800 pb-4"><User size={20} className="text-indigo-500" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Profil & Sécurité</h3></div>
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex flex-col items-center justify-start pt-2">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">{displayAvatar ? <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-400" />}</div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-110 border-4 border-white dark:border-black"><Camera size={16} /></button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className={labelClass}>Prénom</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={inputClass} /></div><div><label className={labelClass}>Nom</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={inputClass} /></div></div>
                            <div><label className={labelClass}>Email</label><div className="relative"><Mail className="absolute left-4 top-3.5 text-gray-400" size={18} /><input type="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClass} pl-11`} /></div></div>
                            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800/50 mt-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div><label className={labelClass}>Nouveau mot de passe</label><div className="relative"><Lock className="absolute left-4 top-3.5 text-gray-400" size={18} /><input type="password" name="password" value={formData.password} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="••••••••" /></div></div><div><label className={labelClass}>Confirmer</label><div className="relative"><Check className="absolute left-4 top-3.5 text-gray-400" size={18} /><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="••••••••" /></div></div></div></div>
                        </div>
                    </div>
                </section>

                {/* 2. PRÉFÉRENCES */}
                <section className={sectionClass}>
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-neutral-800 pb-4"><Sliders size={20} className="text-indigo-500" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Préférences</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className={labelClass}>Risque par défaut</label><div className="relative"><input type="number" step="0.1" name="default_risk" value={formData.default_risk} onChange={handleChange} className={`${inputClass} pr-12`} /><span className="absolute right-4 top-3.5 text-gray-400 font-bold text-sm">%</span></div></div>
                        <div ref={currencyDropdownRef} className="relative">
                            <label className={labelClass}>Devise du compte</label>
                            <button type="button" onClick={() => setIsCurrencyOpen(!isCurrencyOpen)} className={`${inputClass} flex items-center justify-between text-left`}><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-300"><CurrencyIcon size={14} /></div><span>{currentCurrency.code}</span></div><ChevronDown size={16} className={`text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} /></button>
                            {isCurrencyOpen && <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden animate-in zoom-in-95 duration-200">{CURRENCIES.map((curr) => { const Icon = curr.icon; return (<button key={curr.code} type="button" onClick={() => { setFormData(prev => ({ ...prev, currency: curr.code })); setIsCurrencyOpen(false); markAsDirty(); }} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-300"><Icon size={12} /></div><span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{curr.code}</span></div>{formData.currency === curr.code && <Check size={16} className="text-indigo-600" />}</button>); })}</div>}
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-950/30 rounded-2xl border border-gray-100 dark:border-neutral-800"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-neutral-900 rounded-lg text-gray-500 shadow-sm"><Layout size={18} /></div><span className="font-bold text-sm text-gray-700 dark:text-gray-300">Vue par défaut</span></div><select name="defaultView" value={formData.defaultView} onChange={handleChange} className="bg-transparent text-sm font-bold text-indigo-600 outline-none cursor-pointer text-right"><option value="journal">Journal</option><option value="calendar">Calendrier</option><option value="calculator">Calculatrice</option></select></div>
                        <div onClick={() => { setFormData(prev => ({ ...prev, showImages: !prev.showImages })); markAsDirty(); }} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-950/30 rounded-2xl border border-gray-100 dark:border-neutral-800 cursor-pointer group"><div className="flex items-center gap-3"><div className="p-2 bg-white dark:bg-neutral-900 rounded-lg text-gray-500 shadow-sm"><Eye size={18} /></div><span className="font-bold text-sm text-gray-700 dark:text-gray-300">Logos des paires</span></div><div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${formData.showImages ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-neutral-700'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${formData.showImages ? 'translate-x-4' : 'translate-x-0'}`}></div></div></div>
                    </div>
                </section>

                {/* 3. COULEURS */}
                <section className={`${sectionClass} ${formData.is_pro < 1 ? 'opacity-50 grayscale select-none pointer-events-none' : ''} relative`}>
                    {formData.is_pro < 1 && (<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-[1px] rounded-3xl"><div className="bg-white dark:bg-neutral-900 px-6 py-3 rounded-full shadow-2xl border border-amber-200 dark:border-neutral-700 flex items-center gap-2"><Lock size={16} className="text-amber-500" /><span className="text-xs font-bold text-gray-900 dark:text-white">Réservé aux membres PRO</span></div></div>)}
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-neutral-800 pb-4"><div className="flex items-center gap-2"><PaintBucket size={20} className="text-indigo-500" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Thème Personnalisé</h3></div><button type="button" onClick={resetColors} className="text-xs flex items-center gap-1 text-gray-400 hover:text-indigo-500 font-bold transition-colors"><RotateCcw size={12}/> Rétablir</button></div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{renderColorInput("Solde", "balance")}{renderColorInput("Achat", "buy")}{renderColorInput("Vente", "sell")}{renderColorInput("Gain", "win")}{renderColorInput("Perte", "loss")}</div>
                </section>

                {/* 4. ABONNEMENT */}
                <section className={sectionClass + " border-l-4 border-l-indigo-500"}>
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-neutral-800 pb-4"><CreditCard size={20} className="text-indigo-500" /><h3 className="text-lg font-bold text-gray-900 dark:text-white">Mon Abonnement</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PLANS.map((plan) => {
                            const isCurrent = formData.is_pro === plan.id;
                            const Icon = plan.icon;
                            const containerClass = `relative rounded-2xl p-4 border-2 transition-all flex flex-col justify-between h-full group ${isCurrent ? 'bg-white dark:bg-neutral-800 border-indigo-600 shadow-xl shadow-indigo-500/10 cursor-default' : ''} ${!isCurrent && !plan.disabled ? 'bg-transparent border-gray-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer' : ''} ${plan.disabled && !isCurrent ? 'bg-gray-50 dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 opacity-60 cursor-not-allowed' : ''}`;
                            return (
                                <div key={plan.id} onClick={() => handlePlanClick(plan)} className={containerClass}>
                                    {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">ACTUEL</div>}
                                    {plan.badge && !isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">{plan.badge}</div>}
                                    <div><div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${plan.id === 0 ? 'bg-gray-100 text-gray-500' : (plan.id === 1 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}`}><Icon size={20} /></div><h4 className="text-lg font-black text-gray-900 dark:text-white mb-1">{plan.name}</h4><p className="text-xs font-bold text-gray-400 mb-4">{plan.price}</p><ul className="space-y-2 mb-4">{plan.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400"><CheckSquare size={12} className="text-indigo-500" /> {f}</li>))}</ul></div>
                                    <div className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-colors flex items-center justify-center gap-2 ${isCurrent ? 'bg-indigo-600 text-white' : ''} ${!isCurrent && !plan.disabled ? 'bg-gray-100 dark:bg-neutral-800 text-gray-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600' : ''} ${plan.disabled && !isCurrent ? 'bg-gray-100 dark:bg-neutral-800 text-gray-300' : ''}`}>
                                        {
                                            isCurrent ? 'Plan Actif' :
                                                (plan.id === 0 && user.is_pro === 1 ? 'Résilier' :
                                                    (plan.disabled ? 'Indisponible' :
                                                        (plan.action === 'TELEGRAM' ? <><ExternalLink size={12}/> Contacter</> : 'Choisir')))
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="pt-6 mt-8 border-t border-gray-200 dark:border-neutral-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <button type="button" onClick={() => onNavigate('legal')} className="flex items-center gap-2 text-gray-500 hover:text-indigo-500 font-bold text-sm px-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"><ShieldAlert size={18} /> Mentions Légales & CGV</button>
                        <div className="flex items-center gap-4">
                            {user?.is_pro === 7 && <button type="button" onClick={() => onNavigate('admin')} className="flex items-center gap-2 text-purple-500 hover:text-purple-600 font-bold text-sm px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-xl transition-colors"><ShieldAlert size={18} /> Admin Panel</button>}
                            <button type="button" onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"><LogOut size={18} /> Déconnexion</button>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center mt-6">Conformément au RGPD, vous pouvez télécharger ou supprimer vos données. Contactez le support pour une suppression définitive.</p>
                </div>
            </form>

            {/* --- BOUTON DE SAUVEGARDE FLOTTANT --- */}
            <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-full font-bold shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 active:scale-95 transition-all animate-in zoom-in-95 duration-200">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={20} />}<span>Enregistrer les modifications</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsView;