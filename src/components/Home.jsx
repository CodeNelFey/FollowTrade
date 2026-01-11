import React, { Suspense, memo, useState } from 'react';
// Import dynamique (Lazy load)
const Spline = React.lazy(() => import('@splinetool/react-spline'));
import { TrendingUp, Shield, Zap, ChevronRight, BarChart3, Smartphone, Loader2 } from 'lucide-react';
import LegalDocs from './LegalDocs';

// --- COMPOSANT 3D ISOLÉ ---
const SplineScene = memo(() => {
    return (
        <Spline scene="/crypto_bars.splinecode" />
    );
});

const Home = ({ onNavigateToAuth }) => {
    const [showLegal, setShowLegal] = useState(false);

    // Si l'utilisateur clique sur un lien légal, on affiche le composant par-dessus
    if (showLegal) {
        return (
            <div className="min-h-screen bg-white dark:bg-black pt-10">
                <LegalDocs onClose={() => setShowLegal(false)} />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-black text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden flex flex-col">

            <style>{`
                /* --- HACK POUR CACHER LE LOGO SPLINE --- */
                canvas + a {
                    display: none !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                }

                /* --- TEXTE SCINTILLANT (SHIMMER) --- */
                @keyframes shimmer {
                    from { background-position: 0 0; }
                    to { background-position: -200% 0; }
                }
                .animate-shimmer {
                    background: linear-gradient(to right, #6366f1 4%, #ffffff 25%, #6366f1 36%);
                    background-size: 200% auto;
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s linear infinite;
                }

                /* --- ANIMATION ORBES DE FOND --- */
                @keyframes float {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: float 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                /* --- FOND GRILLE --- */
                .bg-grid-white {
                    background-size: 40px 40px;
                    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                }

                /* --- DEGRADÉ LOGO --- */
                .text-gradient-logo {
                    background: linear-gradient(to right, #818cf8, #c084fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>

            {/* --- BACKGROUND FX --- */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-grid-white opacity-20" />
                {/* Orbes ajustés */}
                <div className="absolute top-0 left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-indigo-500/30 rounded-full mix-blend-screen filter blur-[80px] md:blur-[100px] opacity-40 animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-purple-500/30 rounded-full mix-blend-screen filter blur-[80px] md:blur-[100px] opacity-40 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-64 h-64 md:w-96 md:h-96 bg-blue-500/30 rounded-full mix-blend-screen filter blur-[80px] md:blur-[100px] opacity-40 animate-blob animation-delay-4000" />
            </div>

            {/* --- NAVBAR --- */}
            <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 md:top-6">
                <div className="flex items-center justify-between w-full max-w-6xl px-4 py-3 md:px-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-full shadow-2xl shadow-black/50">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                        <img
                            src="/apple-touch-icon.png"
                            alt="FollowTrade Logo"
                            className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-500/20 object-contain"
                        />
                        <span className="font-bold text-lg tracking-tight hidden sm:block">FollowTrade</span>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={() => onNavigateToAuth(false)} className="text-xs md:text-sm font-medium text-gray-300 hover:text-white transition-colors px-2 py-1">Connexion</button>
                        <button onClick={() => onNavigateToAuth(true)} className="bg-white text-black px-4 py-2 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">
                            S'inscrire
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative pt-28 pb-12 md:pt-48 md:pb-24 px-4 md:px-6 max-w-7xl mx-auto z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">

                    {/* 1. TEXTE */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left relative z-20 order-1">

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] md:text-xs font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Nouvelle Version
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                            Ne jouez plus.<br />
                            Devenez <span className="animate-shimmer cursor-default relative inline-block">
                                Enfin Rentable
                                <svg className="absolute w-full h-2 md:h-3 -bottom-1 left-0 text-indigo-500 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                     <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                                </svg>
                            </span>.
                        </h1>

                        <p className="text-base md:text-lg text-gray-400 max-w-xl mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 px-2 md:px-0">
                            Le journal de trading nouvelle génération. Analysez votre psychologie et <span className="text-white font-semibold">éliminez les erreurs coûteuses</span>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                            <button onClick={() => onNavigateToAuth(true)} className="group w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl md:rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] flex items-center justify-center">
                                Commencer <ChevronRight className="ml-2" size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 2. SPLINE 3D */}
                    <div className="hidden lg:flex relative order-2 h-[400px] lg:h-[600px] w-full items-center justify-center animate-in fade-in zoom-in duration-1000 delay-100 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-violet-600/10 rounded-full opacity-60 -z-10 transform scale-75"></div>
                        <div className="w-full h-full relative z-10">
                            <Suspense fallback={<div className="flex items-center justify-center h-full text-indigo-500/50"><Loader2 className="animate-spin w-8 h-8"/></div>}>
                                <SplineScene />
                            </Suspense>
                        </div>
                    </div>

                </div>
            </header>

            {/* --- BENTO GRID --- */}
            <section className="px-4 md:px-6 py-12 md:py-24 max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-10 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Tout ce qu'il vous faut pour <span className="text-gradient-logo">scaler</span>.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">

                    <div className="md:col-span-4 bg-neutral-900/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-indigo-400 border border-white/5"><BarChart3 size={20} className="md:w-6 md:h-6" /></div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">Analyses de Précision</h3>
                            <p className="text-sm md:text-base text-gray-400">Visualisez votre Equity Curve, votre Winrate et votre Risk/Reward ratio en temps réel.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-neutral-900/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                        <div className="relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-violet-400 border border-white/5"><Smartphone size={20} className="md:w-6 md:h-6" /></div>
                            <h3 className="text-lg md:text-xl font-bold mb-2">100% Mobile</h3>
                            <p className="text-sm md:text-base text-gray-400">Tradez sur votre setup, journalisez sur votre téléphone.</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-neutral-900/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                        <div className="relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-blue-400 border border-white/5"><Shield size={20} className="md:w-6 md:h-6" /></div>
                            <h3 className="text-lg md:text-xl font-bold mb-2">Sécurisé</h3>
                            <p className="text-sm md:text-base text-gray-400">Chiffrement de bout en bout.</p>
                        </div>
                    </div>

                    <div className="md:col-span-4 bg-neutral-900/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 duration-500">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 md:mb-6 text-indigo-400 border border-white/5"><Zap size={20} className="md:w-6 md:h-6" /></div>
                                <div className="px-2 py-1 md:px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-[10px] md:text-xs font-bold uppercase tracking-wide">OCR IA</div>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2">Saisie Éclair</h3>
                            <p className="text-sm md:text-base text-gray-400">Importez vos trades via capture d'écran grâce à notre IA.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="px-4 md:px-6 py-12 md:py-20 text-center relative z-10">
                <div className="max-w-4xl mx-auto bg-gradient-to-b from-neutral-900 to-black border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-20 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Le Trading n'est pas un jeu.</h2>
                        <button onClick={() => onNavigateToAuth(true)} className="w-full md:w-auto bg-white text-black hover:bg-indigo-50 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl">
                            Créer mon compte
                        </button>
                    </div>
                </div>
            </section>

            {/* --- FOOTER LÉGAL (MODIFIÉ) --- */}
            <footer className="border-t border-white/5 py-8 md:py-12 relative z-10 bg-black text-gray-500 text-xs md:text-sm mt-auto">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p>&copy; 2025 FollowTrade. Tous droits réservés.</p>

                    <div className="flex items-center gap-6">
                        <button onClick={() => setShowLegal(true)} className="hover:text-white transition-colors">Mentions Légales</button>
                        <button onClick={() => setShowLegal(true)} className="hover:text-white transition-colors">CGV & CGU</button>
                        <button onClick={() => setShowLegal(true)} className="hover:text-white transition-colors">Confidentialité</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;