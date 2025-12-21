import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Mail, Save, AlertTriangle, Sliders, Palette, Eye, Layout, CheckCircle, ChevronDown, Check, DollarSign, Euro, PoundSterling, ArrowLeft, Camera, LogOut } from 'lucide-react'; // Added LogOut icon
import { api } from '../api';

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', icon: DollarSign },
    { code: 'EUR', name: 'Euro', icon: Euro },
    { code: 'GBP', name: 'British Pound', icon: PoundSterling },
];

const SettingsView = ({ user, onUpdateUser, onClose, onLogout }) => { // Added onLogout prop
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        password: '',
        confirmPassword: '',
        default_risk: user?.default_risk || 1.0,
        defaultView: user?.preferences?.defaultView || 'journal',
        showImages: user?.preferences?.showImages !== false,
        currency: user?.preferences?.currency || 'USD',
    });

    // Gestion de l'avatar
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const currencyDropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                default_risk: user.default_risk || 1.0,
                defaultView: user.preferences?.defaultView || 'journal',
                showImages: user.preferences?.showImages !== false,
                currency: user.preferences?.currency || 'USD',
            }));
            setAvatarUrl(user.avatar_url || '');
        }
    }, [user]);

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        function handleClickOutside(event) {
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
                setIsCurrencyOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectCurrency = (currencyCode) => {
        setFormData(prev => ({ ...prev, currency: currencyCode }));
        setIsCurrencyOpen(false);
    };

    // Gestion du changement de fichier (Avatar)
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Prévisualisation locale immédiate
        const objectUrl = URL.createObjectURL(file);
        setAvatarUrl(objectUrl);

        try {
            // Upload immédiat
            const res = await api.uploadAvatar(file);
            if (res.avatar_url) {
                const updatedUser = { ...user, avatar_url: res.avatar_url };
                api.setUser(updatedUser); // Stockage local
                if (onUpdateUser) onUpdateUser(updatedUser);
                setMessage({ type: 'success', text: "Photo de profil mise à jour !" });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: "Erreur lors de l'upload de l'image." });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: "Les mots de passe ne correspondent pas." });
            setIsLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...dataToSend } = formData;
            if (!dataToSend.password) delete dataToSend.password;

            const preferences = {
                defaultView: dataToSend.defaultView,
                showImages: dataToSend.showImages,
                currency: dataToSend.currency
            };

            await onUpdateUser({ ...dataToSend, preferences });
            setMessage({ type: 'success', text: "Profil mis à jour avec succès !" });
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));

        } catch (error) {
            setMessage({ type: 'error', text: "Erreur lors de la mise à jour." });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-white/50 dark:bg-neutral-950/50 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-gray-500 dark:text-neutral-500 uppercase tracking-wider mb-2 ml-1";
    const sectionClass = "bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-sm mb-6";

    const currentCurrency = CURRENCIES.find(c => c.code === formData.currency) || CURRENCIES[0];
    const CurrencyIcon = currentCurrency.icon;

    // Construction de l'URL de l'image
    const displayAvatar = avatarUrl
        ? (avatarUrl.startsWith('blob:') ? avatarUrl : `http://localhost:3000${avatarUrl}`)
        : null;

    return (
        <div className="max-w-4xl mx-auto pb-20">

            {/* HEADER AVEC BOUTON RETOUR */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-700 rounded-full text-gray-700 dark:text-gray-200 transition-all shadow-sm border border-gray-200 dark:border-neutral-700 group"
                    title="Retour au journal"
                >
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Mon Profil</h2>
                        <p className="text-gray-500 dark:text-gray-400 hidden sm:block">Gérez vos informations personnelles</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {/* --- SECTION 1 : IDENTITÉ & AVATAR --- */}
                {/* z-index standard ici */}
                <div className={`${sectionClass} relative z-30`}>
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
                        <User size={18} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identité</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* ZONE AVATAR */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                                    {displayAvatar ? (
                                        <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={48} className="text-gray-400" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG (Max 5MB)</span>
                        </div>

                        {/* INPUTS TEXTE */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Prénom</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="Votre prénom"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Nom</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="Votre nom"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Adresse Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-11`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SECTION 2 : SÉCURITÉ --- */}
                <div className={sectionClass}>
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
                        <Lock size={18} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sécurité</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Nouveau mot de passe</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Laisser vide pour ne pas changer"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Confirmer</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Répéter le mot de passe"
                            />
                        </div>
                    </div>
                </div>

                {/* --- SECTION 3 : TRADING (Z-INDEX 20) --- */}
                {/* C'est ici que le fix opère : z-20 est supérieur à z-10 de la section suivante */}
                <div className={`${sectionClass} relative z-20`}>
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
                        <Sliders size={18} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Préférences de Trading</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Risque par défaut (%)</label>
                            <div className="relative">
                                <span className="absolute right-4 top-3.5 text-gray-400 font-bold">%</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="default_risk"
                                    value={formData.default_risk}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Dropdown Devise */}
                        <div ref={currencyDropdownRef} className="relative">
                            <label className={labelClass}>Devise du compte</label>
                            <button
                                type="button"
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className={`${inputClass} flex items-center justify-between text-left`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <CurrencyIcon size={14} />
                                    </div>
                                    <span>{currentCurrency.code} - {currentCurrency.name}</span>
                                </div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCurrencyOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {CURRENCIES.map((curr) => {
                                        const Icon = curr.icon;
                                        return (
                                            <button
                                                key={curr.code}
                                                type="button"
                                                onClick={() => handleSelectCurrency(curr.code)}
                                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.currency === curr.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500'}`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className={`font-bold ${formData.currency === curr.code ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {curr.code}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{curr.name}</div>
                                                    </div>
                                                </div>
                                                {formData.currency === curr.code && <Check size={16} className="text-indigo-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- SECTION 4 : INTERFACE (Z-INDEX 10) --- */}
                {/* z-10 pour être en dessous de la section trading */}
                <div className={`${sectionClass} relative z-10`}>
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
                        <Palette size={18} className="text-indigo-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Interface</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent hover:border-indigo-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-gray-500">
                                    <Layout size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white text-sm">Vue de démarrage</div>
                                    <div className="text-xs text-gray-500">Page affichée à l'ouverture</div>
                                </div>
                            </div>
                            <select
                                name="defaultView"
                                value={formData.defaultView}
                                onChange={handleChange}
                                className="bg-transparent text-sm font-medium text-indigo-600 dark:text-indigo-400 focus:outline-none cursor-pointer text-right"
                            >
                                <option value="journal">Journal</option>
                                <option value="calendar">Calendrier</option>
                                <option value="calculator">Calculatrice</option>
                            </select>
                        </div>

                        <div
                            onClick={() => setFormData(prev => ({ ...prev, showImages: !prev.showImages }))}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent hover:border-indigo-500/30 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-neutral-800 rounded-lg text-gray-500 group-hover:text-indigo-500 transition-colors">
                                    <Eye size={20} />
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Afficher les logos des paires</span>
                            </div>

                            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${formData.showImages ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-neutral-800'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.showImages ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOUTON ENREGISTRER */}
                <div className="mb-10 md:flex md:justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        // J'ai ajouté 'w-full' (largeur max mobile) et 'md:w-auto' (taille normale PC)
                        // J'ai aussi ajouté 'justify-center' pour centrer le texte sur mobile
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {isLoading ? 'Sauvegarde...' : <><Save size={18} /> Enregistrer les modifications</>}
                    </button>
                </div>

                {/* --- BOUTON DE DECONNEXION --- */}
                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-neutral-800">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-100 dark:border-red-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                        <LogOut size={20} /> Se déconnecter
                    </button>
                </div>

            </form>
        </div>
    );
};

export default SettingsView;