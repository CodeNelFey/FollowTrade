import React from 'react';
import { LayoutDashboard, Megaphone, LineChart, Calendar as CalendarIcon, Calculator, ShieldAlert, Settings, LogOut, ClipboardList, Crown, Sparkles, User, Bell } from 'lucide-react';
import { api } from '../api';

const Sidebar = ({ user, activeTab, onNavClick, onLogout, hasNewUpdates, unreadNotifsCount, onOpenNotif }) => {

    const getBadge = () => {
        if (user.is_pro === 7) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border border-purple-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><ShieldAlert size={10} fill="currentColor" /> ADMIN</span>;
        if (user.is_pro === 2) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white border border-emerald-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Sparkles size={10} fill="currentColor" /> VIP</span>;
        if (user.is_pro === 1) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 border border-yellow-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Crown size={10} fill="currentColor" /> PRO</span>;
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 inline-flex items-center gap-1.5 min-w-[60px] justify-center"><User size={10} /> FREE</span>;
    };

    const navItemClass = (tab) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`;

    const avatarSrc = api.getAvatarUrl(user.avatar_url);

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-neutral-800 p-6 gap-2">

            {/* Header Profil */}
            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/30 bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={20} className="text-white" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-black text-lg text-gray-900 dark:text-white truncate">
                            {user.first_name || 'User'}
                        </h1>
                        {getBadge()}
                    </div>
                </div>

                {/* Juste la cloche de notification ici désormais */}
                <button onClick={onOpenNotif} className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400">
                    <Bell size={20} />
                    {unreadNotifsCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse"></span>}
                </button>
            </div>

            <nav className="space-y-1 flex-1">
                <button onClick={() => onNavClick('journal')} className={navItemClass('journal')}><LayoutDashboard size={20} /> Journal</button>
                <button onClick={() => onNavClick('graphs')} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'graphs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3"><LineChart size={20} /> Analyses</div>
                    {(user.is_pro < 1 || !user.is_pro) && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                </button>
                <button onClick={() => onNavClick('calendar')} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3"><CalendarIcon size={20} /> Calendrier</div>
                    {(user.is_pro < 1 || !user.is_pro) && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                </button>
                <button onClick={() => onNavClick('calculator')} className={navItemClass('calculator')}><Calculator size={20} /> Calculatrice</button>
                <button onClick={() => onNavClick('updates')} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'updates' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3"><Megaphone size={20} /> Nouveautés</div>
                    {hasNewUpdates && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">1</span>}
                </button>
                <button
                    onClick={() => onNavClick('routine')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold ${activeTab === 'routine' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                    <ClipboardList size={20} />
                    <span>Routine</span>
                </button>
            </nav>

            <div className="pt-6 border-t border-gray-200 dark:border-neutral-800 space-y-1">
                {user.is_pro === 7 && <button onClick={() => onNavClick('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'admin' ? 'bg-purple-500 text-white shadow-lg' : 'text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`}><ShieldAlert size={20} /> Admin Panel</button>}
                <button onClick={() => onNavClick('settings')} className={navItemClass('settings')}><Settings size={20} /> Paramètres</button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"><LogOut size={20} /> Déconnexion</button>
            </div>
        </aside>
    );
};

export default Sidebar;