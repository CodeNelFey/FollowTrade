import React from 'react';
import { LayoutDashboard, TrendingUp, ShieldCheck, ArrowRight, BarChart3, Lock, Zap } from 'lucide-react';

const Home = ({ onNavigateToAuth }) => {
    return (
        <div className="relative min-h-screen flex flex-col text-white overflow-x-hidden">

            {/* NAVBAR */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    {/* Logo FT */}
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span className="font-bold text-xl">FT</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">FollowTrade</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => onNavigateToAuth(false)} // false = Login
                        className="px-5 py-2.5 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                    >
                        Connexion
                    </button>
                    <button
                        onClick={() => onNavigateToAuth(true)} // true = Register
                        className="px-5 py-2.5 text-sm font-bold bg-white text-black rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        S'inscrire
                    </button>
                </div>
            </nav>

            {/* HERO SECTION */}
            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 max-w-7xl mx-auto w-full relative z-10">

                {/* TEXTE GAUCHE */}
                <div className="flex-1 space-y-8 text-center lg:text-left animate-in slide-in-from-left-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Version Pro Disponible
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                        Maîtrisez vos <br/>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Performances
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Le journal de trading nouvelle génération. Analysez vos trades, optimisez votre risque et atteignez la rentabilité avec une interface conçue pour l'excellence.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button
                            onClick={() => onNavigateToAuth(true)}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Commencer maintenant <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                {/* IMAGE 3D DROITE (CSS PURE) */}
                <div className="flex-1 w-full max-w-lg perspective-1000 animate-in slide-in-from-right-4 duration-1000">
                    <div className="relative w-full aspect-square transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-500 ease-out preserve-3d">

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 blur-[100px] opacity-40 -z-10"></div>

                        {/* Card Principale (Dashboard) */}
                        <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col gap-4">
                            {/* Fake UI Header */}
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="h-2 w-20 bg-white/10 rounded-full"></div>
                            </div>

                            {/* Fake Chart */}
                            <div className="flex-1 flex items-end gap-2 px-2 pb-4 border-b border-white/5">
                                <div className="w-full bg-indigo-500/20 h-[40%] rounded-t-sm"></div>
                                <div className="w-full bg-indigo-500/40 h-[60%] rounded-t-sm"></div>
                                <div className="w-full bg-indigo-500/30 h-[30%] rounded-t-sm"></div>
                                <div className="w-full bg-indigo-500/60 h-[80%] rounded-t-sm relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg">+24%</div>
                                </div>
                                <div className="w-full bg-indigo-500/50 h-[50%] rounded-t-sm"></div>
                            </div>

                            {/* Fake Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="h-2 w-12 bg-white/20 rounded-full mb-2"></div>
                                    <div className="h-6 w-20 bg-emerald-500/20 rounded flex items-center px-2">
                                        <div className="w-full h-2 bg-emerald-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="h-2 w-12 bg-white/20 rounded-full mb-2"></div>
                                    <div className="h-6 w-20 bg-indigo-500/20 rounded flex items-center px-2">
                                        <div className="w-full h-2 bg-indigo-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element 1 (Badge) */}
                        <div className="absolute -right-6 top-10 bg-white text-black p-4 rounded-2xl shadow-xl transform translate-z-10 animate-float-candle">
                            <div className="flex items-center gap-3 font-bold">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={20}/></div>
                                <div>
                                    <div className="text-xs text-gray-500">Gain Hebdo</div>
                                    <div>+1,240 $</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element 2 (Security) */}
                        <div className="absolute -left-6 bottom-20 bg-neutral-800 text-white p-4 rounded-2xl shadow-xl border border-white/10 transform translate-z-20 animate-float-candle animation-delay-2000">
                            <div className="flex items-center gap-3 font-bold">
                                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><ShieldCheck size={20}/></div>
                                <div>
                                    <div className="text-xs text-gray-400">Données</div>
                                    <div>Sécurisées</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* FEATURES SECTION */}
            <section className="relative z-10 py-24 bg-black/20 backdrop-blur-sm border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Pourquoi choisir FollowTrade ?</h2>
                        <p className="text-gray-400">Tous les outils dont vous avez besoin pour passer au niveau supérieur.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={LayoutDashboard}
                            title="Journal de Trading"
                            desc="Enregistrez vos positions en détail. Gardez une trace précise de chaque entrée, sortie et ressenti."
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Analyses Avancées"
                            desc="Visualisez votre progression. Graphiques de performance, taux de réussite et courbe de gains."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Calculateur de Risque"
                            desc="Gérez votre money management instantanément. Calculez vos lots en fonction de votre capital."
                        />
                    </div>
                </div>
            </section>

            {/* FOOTER SIMPLE */}
            <footer className="relative z-10 py-8 text-center text-gray-600 text-sm border-t border-white/5">
                <p>&copy; 2024 FollowTrade. Tous droits réservés.</p>
            </footer>
        </div>
    );
};

// Petit composant interne pour les cartes
const FeatureCard = ({ icon: Icon, title, desc }) => (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-colors group cursor-default">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

export default Home;