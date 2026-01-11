import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, User, Crown, Loader2, ArrowRight, Lock } from 'lucide-react';
import { api } from '../api';

// ⚠️ Assure-toi que c'est le bon ID de prix Stripe (commençant par price_...)
const STRIPE_PRICE_PRO = import.meta.env.VITE_STRIPE_PRICE_PRO;
const UpgradeModal = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleProSubscribe = async () => {
        setIsLoading(true);
        try {
            const response = await api.createCheckoutSession(STRIPE_PRICE_PRO, 'PRO');
            if (response.url) {
                window.location.href = response.url;
            }
        } catch (error) {
            console.error("Erreur paiement", error);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">

                {/* BOUTON FERMER */}
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 z-20 transition-colors">
                    <X size={20} />
                </button>

                {/* COLONNE GAUCHE : VISUEL & AVANTAGES */}
                <div className="md:w-1/3 bg-gradient-to-br from-indigo-900 to-black p-8 flex flex-col justify-between relative overflow-hidden">
                    {/* Effets de fond */}
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-50"></div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10 shadow-inner backdrop-blur-sm">
                            <Crown className="text-amber-400" fill="currentColor" />
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight mb-2">
                            Passez au <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">Niveau Pro.</span>
                        </h2>
                        <p className="text-indigo-200 text-sm">Débloquez tout le potentiel de votre trading.</p>
                    </div>

                    <div className="relative z-10 space-y-4 mt-8">
                        <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
                            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 size={14} /></div>
                            Analyses illimitées
                        </div>
                        <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
                            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 size={14} /></div>
                            Calendrier interactif
                        </div>
                        <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
                            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400"><CheckCircle2 size={14} /></div>
                            Personnalisation complète
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : LES OFFRES */}
                <div className="md:w-2/3 p-6 md:p-8 bg-gray-50 dark:bg-neutral-900/95 flex flex-col justify-center">
                    <div className="space-y-4">

                        {/* 1. PLAN FREE (Grayscale) */}
                        <div className="p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/30 flex justify-between items-center opacity-60 grayscale select-none hover:opacity-80 transition-opacity">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-xl text-gray-500">
                                    <User size={24} />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">Version FREE</div>
                                    <div className="text-xs text-gray-500 font-medium">Fonctionnalités de base</div>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 bg-gray-200 dark:bg-neutral-700 rounded text-gray-500">ACTUEL</span>
                        </div>

                        {/* 2. PLAN PRO (Le Star - Style VIP appliqué ici) */}
                        <button
                            onClick={handleProSubscribe}
                            disabled={isLoading}
                            className="w-full text-left group relative overflow-hidden rounded-2xl border border-amber-500/30 transition-all hover:shadow-xl hover:shadow-amber-500/20 active:scale-[0.99]"
                        >
                            {/* Fond dégradé subtil */}
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative p-5 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    {/* Icône Couronne Jaune */}
                                    <div className="p-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <Crown size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-black text-lg text-gray-900 dark:text-white">Version PRO</div>
                                            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-amber-200 dark:border-amber-800">Populaire</span>
                                        </div>
                                        <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                            9.99€ / mois
                                        </div>
                                    </div>
                                </div>

                                {/* Bouton d'action */}
                                <div className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2">
                                    {isLoading ? <Loader2 size={18} className="animate-spin"/> : <>Choisir <ArrowRight size={16}/></>}
                                </div>
                            </div>
                        </button>

                        {/* 3. PLAN VIP (Style original conservé) */}
                        <a
                            href="https://t.me/sohanbirotheau"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group relative overflow-hidden rounded-2xl border border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative p-5 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                        <Sparkles size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <div className="font-black text-lg text-gray-900 dark:text-white">Grade VIP</div>
                                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Sur candidature</div>
                                    </div>
                                </div>
                                <div className="bg-emerald-600 group-hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors">
                                    Contacter
                                </div>
                            </div>
                        </a>

                    </div>

                    <p className="text-center text-[10px] text-gray-400 mt-6 flex items-center justify-center gap-1">
                        <Lock size={10} /> Paiement sécurisé par Stripe. Annulation en 1 clic.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;