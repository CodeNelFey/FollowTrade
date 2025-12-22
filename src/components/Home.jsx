import React from 'react';
import { TrendingUp, Shield, Zap, ChevronRight, BarChart3, Smartphone } from 'lucide-react';

const Home = ({ onNavigateToAuth }) => {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden text-white font-sans selection:bg-indigo-500/30">

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 bg-black/50 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <img
                        src="/followTradeLogo.png"
                        alt="Logo FollowTrade"
                        className="w-10 h-10 object-contain rounded-xl"
                    />

                    <span className="font-bold text-lg tracking-tight">FollowTrade</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigateToAuth(false)}
                        className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-2"
                    >
                        Connexion
                    </button>
                    <button
                        onClick={() => onNavigateToAuth(true)}
                        className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-transform active:scale-95"
                    >
                        S'inscrire
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center max-w-5xl mx-auto z-10">

                {/* Badge "Nouveau" */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Beta Disponible des maintenant
                </div>

                {/* Titre Principal */}
                <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                    Devenez un Trader <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Enfin Rentable.
                    </span>
                </h1>

                {/* Sous-titre */}
                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Le journal de trading intelligent qui analyse vos performances, détecte vos erreurs et vous aide à progresser. Rejoignez l'élite.
                </p>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <button
                        onClick={() => onNavigateToAuth(true)}
                        className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        Commencer Gratuitement <ChevronRight size={20} />
                    </button>
                    <button
                        onClick={() => onNavigateToAuth(false)}
                        className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-md transition-all active:scale-95"
                    >
                        Se Connecter
                    </button>
                </div>
            </header>

            {/* --- FONCTIONNALITÉS (BENTO GRID) --- */}
            <section className="px-6 pb-24 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                    {/* Carte 1 */}
                    <div className="md:col-span-2 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px] -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Analyses Détaillées</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Ne tradez plus à l'aveugle. Obtenez des graphiques précis sur votre Winrate, votre Risk/Reward et l'évolution de votre capital jour après jour.
                            </p>
                        </div>
                    </div>

                    {/* Carte 2 */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 text-emerald-400">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Sécurisé</h3>
                            <p className="text-gray-400 text-sm">
                                Vos données sont chiffrées et protégées. Votre journal est personnel et privé.
                            </p>
                        </div>
                    </div>

                    {/* Carte 3 */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 text-amber-400">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Rapide</h3>
                            <p className="text-gray-400 text-sm">
                                Ajoutez vos trades en quelques secondes. Interface optimisée pour ne pas perdre de temps.
                            </p>
                        </div>
                    </div>

                    {/* Carte 4 */}
                    <div className="md:col-span-2 bg-neutral-900/50 border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] -mr-10 -mb-10 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                                <Smartphone size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">100% Mobile Friendly</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Accédez à votre journal partout. Que vous soyez sur votre bureau ou en déplacement, FollowTrade s'adapte parfaitement à votre écran.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="px-6 py-20 text-center">
                <div className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 rounded-3xl p-8 md:p-16 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-6">Prêt à passer au niveau supérieur ?</h2>
                        <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
                            Rejoignez des centaines de traders qui ont amélioré leur rentabilité grâce à un journal rigoureux.
                        </p>
                        <button
                            onClick={() => onNavigateToAuth(true)}
                            className="bg-white text-indigo-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95"
                        >
                            Créer mon compte gratuit
                        </button>
                    </div>
                </div>
            </section>

            {/* --- FOOTER SIMPLE --- */}
            <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <TrendingUp size={16} />
                    <span className="font-bold text-gray-300">FollowTrade</span>
                </div>
                <p>&copy; 2025 FollowTrade. Tous droits réservés.</p>
            </footer>

        </div>
    );
};

export default Home;