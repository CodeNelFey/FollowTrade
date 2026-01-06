import React from 'react';
import { LayoutDashboard, Megaphone, LineChart, Calendar as CalendarIcon, Calculator, Crown, ClipboardList } from 'lucide-react';

const MobileMenu = ({ activeTab, onNavClick, user, hasNewUpdates, colors }) => {

    const navItems = [
        { id: 'journal', icon: LayoutDashboard, label: 'Journal' },
        { id: 'routine', icon: ClipboardList, label: 'Routine' },
        { id: 'graphs', icon: LineChart, label: 'Analyses', isPro: true },
        { id: 'calendar', icon: CalendarIcon, label: 'Calendrier', isPro: true },
        { id: 'calculator', icon: Calculator, label: 'Calc' },
        { id: 'updates', icon: Megaphone, label: 'News', hasNotif: true },
    ];

    return (
        /* POSITIONNEMENT :
           - 'fixed' : Pour flotter au-dessus du contenu
           - 'bottom-2' : Collé plus bas (réduit la safe zone visible)
           - 'left-2 right-2' : Marges latérales réduites pour maximiser l'espace
           - 'z-50' : Toujours au-dessus
        */
        <div className="md:hidden fixed bottom-2 left-2 right-2 z-50">

            {/* CONTENEUR ÎLOT (Le fond gris vient d'ici s'il n'est pas transparent) */}
            <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl px-1 py-2 flex justify-between items-center relative transition-all duration-300">

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const isLocked = item.isPro && user.is_pro === 0;

                    // Couleur active dynamique (par défaut indigo si non fournie)
                    const activeColor = colors?.balance || '#4f46e5';

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavClick(item.id)}
                            className="relative group flex-1 flex flex-col items-center justify-center transition-all duration-300 active:scale-90 py-1"
                        >
                            {/* Fond Actif (Lueur derrière l'icône) */}
                            {isActive && (
                                <div
                                    className="absolute inset-0 rounded-xl transition-all duration-300"
                                    style={{ backgroundColor: `${activeColor}15` }} // 15% d'opacité
                                />
                            )}

                            {/* Indicateur de sélection (Barre sous l'icône) */}
                            <span
                                className={`absolute -bottom-1 w-6 h-1 rounded-t-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
                                style={{ backgroundColor: activeColor }}
                            ></span>

                            {/* Icône */}
                            <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                                <Icon
                                    size={24}
                                    className={`transition-colors duration-300 ${
                                        isActive
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                    }`}
                                    style={isActive ? { color: activeColor } : {}}
                                />

                                {/* Badge Couronne (PRO) */}
                                {isLocked && (
                                    <div className="absolute -top-1 -right-1 bg-white/90 dark:bg-neutral-800/90 rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-neutral-700">
                                        <Crown size={8} className="text-amber-500 fill-amber-500" />
                                    </div>
                                )}

                                {/* Badge Notification (News) */}
                                {item.hasNotif && hasNewUpdates && (
                                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-neutral-900"></span>
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileMenu;