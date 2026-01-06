import React from 'react';
import { LayoutDashboard, Megaphone, LineChart, Calendar as CalendarIcon, Calculator, Crown, ClipboardList, TrendingUp } from 'lucide-react';

const MobileMenu = ({ activeTab, onNavClick, user, hasNewUpdates, colors }) => {

    const navItems = [
        { id: 'journal', icon: LayoutDashboard, label: 'Journal' },
        { id: 'routine', icon: ClipboardList, label: 'Routine' },
        { id: 'graphs', icon: LineChart, label: 'Analyses', isPro: true },
        { id: 'simulator', icon: TrendingUp, label: 'Simu' }, // <-- AJOUT DU SIMULATEUR
        { id: 'calendar', icon: CalendarIcon, label: 'Agenda', isPro: true },
        { id: 'calculator', icon: Calculator, label: 'Calc' },
        { id: 'updates', icon: Megaphone, label: 'News', hasNotif: true },
    ];

    // Couleur active par défaut
    const activeColor = colors?.balance || '#4f46e5';

    return (
        /* STYLE "FUSION" :
           - fixed bottom-0 : Collé au bas de l'écran.
           - w-full : Pleine largeur.
           - bg-white dark:bg-black : Fond Noir pur en mode sombre pour fusionner avec la barre iPhone.
           - border-t : Petite séparation subtile en haut.
           - pb-[env(safe-area-inset-bottom)] : Étend le fond noir sous la barre de swipe.
        */
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-neutral-900 pb-[env(safe-area-inset-bottom)] transition-colors duration-300">

            {/* overflow-x-auto permet de scroller horizontalement si l'écran est trop petit pour toutes les icônes */}
            <div className="flex justify-between items-center px-1 py-3 overflow-x-auto scrollbar-hide">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isLocked = item.isPro && user?.is_pro === 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavClick(item.id)}
                            className="relative group flex-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 py-1 min-w-[50px]"
                        >
                            {/* Indicateur Actif (Lueur au-dessus) */}
                            {isActive && (
                                <div
                                    className="absolute -top-[13px] w-8 h-1 rounded-b-full shadow-[0_0_10px_rgba(79,70,229,0.5)] transition-all duration-300"
                                    style={{ backgroundColor: activeColor, boxShadow: `0 0 12px ${activeColor}` }}
                                />
                            )}

                            {/* Icône */}
                            <div className={`relative p-1 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                                <Icon
                                    size={22}
                                    className={`transition-colors duration-300 ${
                                        isActive
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-400 dark:text-neutral-600 group-hover:text-gray-600 dark:group-hover:text-gray-400'
                                    }`}
                                    style={isActive ? { color: activeColor } : {}}
                                />

                                {/* Badge PRO */}
                                {isLocked && (
                                    <div className="absolute -top-1 -right-1 bg-black/10 dark:bg-white/10 rounded-full p-0.5 backdrop-blur-sm">
                                        <Crown size={8} className="text-amber-500 fill-amber-500" />
                                    </div>
                                )}

                                {/* Badge Notification */}
                                {item.hasNotif && hasNewUpdates && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-black"></span>
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={`text-[9px] font-bold mt-0.5 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 hidden'}`}
                                style={{ color: activeColor }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileMenu;