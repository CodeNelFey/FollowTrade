import React from 'react';
import { LayoutDashboard, LineChart, Calendar, Calculator, Megaphone, Settings, LogOut, Crown, ClipboardList, TrendingUp, Wallet, Bell, User, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../api';

const Sidebar = ({ user, activeTab, onNavClick, onLogout, hasNewUpdates, unreadNotifsCount, onOpenNotif }) => {

    const menuItems = [
        { id: 'journal', icon: LayoutDashboard, label: 'Journal' },
        { id: 'routine', icon: ClipboardList, label: 'Routine' },
        { id: 'graphs', icon: LineChart, label: 'Analyses', isPro: true },
        { id: 'calendar', icon: Calendar, label: 'Calendrier', isPro: true },
        { id: 'simulator', icon: TrendingUp, label: 'Simulateur', isPro: true },
        { id: 'calculator', icon: Calculator, label: 'Calculatrice' },
        { id: 'updates', icon: Megaphone, label: 'Nouveautés', hasBadge: hasNewUpdates },
    ];

    if (user?.is_pro === 7) {
        menuItems.push({ id: 'admin', icon: ShieldAlert, label: 'Admin Panel' });
    }

    const avatarSrc = user ? api.getAvatarUrl(user.avatar_url) : null;

    // --- LOGIQUE DE BADGE RESTAURÉE ---
    const renderBadge = () => { if (user.is_pro === 7) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border border-purple-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><ShieldAlert size={10} fill="currentColor" /> ADMIN</span>; if (user.is_pro === 2) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white border border-emerald-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Sparkles size={10} fill="currentColor" /> VIP</span>; if (user.is_pro === 1) return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 border border-yellow-400/30 inline-flex items-center gap-1.5 shadow-sm min-w-[60px] justify-center"><Crown size={10} fill="currentColor" /> PRO</span>; return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 inline-flex items-center gap-1.5 min-w-[60px] justify-center"><User size={10} /> FREE</span>; };


    return (
        <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-[#262626] border-r border-gray-200 dark:border-neutral-800 relative z-20 transition-colors duration-300">
            {/* Header User */}
            <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden border border-gray-200 dark:border-white/10 flex-shrink-0 flex items-center justify-center">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={20} className="text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{user?.first_name || 'Trader'}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            {renderBadge()}
                        </div>
                    </div>
                </div>

                <button onClick={onOpenNotif} className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 transition-colors group">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-indigo-500">
                        <Bell size={14} /> Notifications
                    </div>
                    {unreadNotifsCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {unreadNotifsCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    const isLocked = item.isPro && user.is_pro === 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavClick(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                                isActive
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-bold'
                                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                                <span className="text-sm">{item.label}</span>
                            </div>

                            {isLocked && <Crown size={12} className="text-amber-500" />}
                            {item.hasBadge && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-neutral-800 space-y-1">
                <button onClick={() => onNavClick('settings')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'}`}>
                    <Settings size={18} />
                    <span className="text-sm">Paramètres</span>
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all">
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;