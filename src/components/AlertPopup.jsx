import React from 'react';
import { Sparkles, Crown, ShieldAlert, User, CheckCircle2 } from 'lucide-react';

const AlertPopup = ({ notification, onClose }) => {
    if (!notification) return null;

    const getTheme = (msg) => {
        const text = msg.toLowerCase();

        // STYLE COMMUN VIOLET (Demandé)
        const purpleBadgeStyle = {
            iconColor: 'text-purple-600 dark:text-purple-300',
            badgeBg: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
        };

        // VIP (Visuel Vert, Badge Violet)
        if (text.includes("vip")) return {
            type: 'VIP',
            gradient: 'from-emerald-500 to-teal-600',
            icon: Sparkles,
            ...purpleBadgeStyle,
            title: 'Nouveau Grade Débloqué !'
        };

        // PRO (Visuel Or, Badge Violet)
        if (text.includes("pro")) return {
            type: 'PRO',
            gradient: 'from-amber-400 to-orange-500',
            icon: Crown,
            ...purpleBadgeStyle,
            title: 'Upgrade Réussi !'
        };

        // ADMIN (Visuel Rouge/Violet, Badge Violet)
        if (text.includes("administrateur") || text.includes("admin")) return {
            type: 'ADMIN',
            gradient: 'from-fuchsia-500 to-purple-600',
            icon: ShieldAlert,
            ...purpleBadgeStyle,
            title: 'Droits Administrateur'
        };

        // FREE (Visuel Gris, Badge Violet)
        if (text.includes("free") || text.includes("standard")) return {
            type: 'FREE',
            gradient: 'from-gray-400 to-slate-500',
            icon: User,
            ...purpleBadgeStyle,
            title: 'Changement de Statut'
        };

        // DÉFAUT
        return {
            type: 'INFO',
            gradient: 'from-indigo-500 to-blue-600',
            icon: CheckCircle2,
            iconColor: 'text-indigo-600 dark:text-indigo-400',
            badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-800',
            title: 'Information'
        };
    };

    const theme = getTheme(notification.message);
    const Icon = theme.icon;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/20 dark:border-neutral-700 overflow-hidden relative animate-in zoom-in-95 duration-300">

                {/* Header Visuel */}
                <div className={`h-36 bg-gradient-to-br ${theme.gradient} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
                    <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-full shadow-2xl flex items-center justify-center transform translate-y-8 animate-bounce ring-4 ring-white/20 dark:ring-black/20">
                        <Icon size={40} className={theme.iconColor} />
                    </div>
                </div>

                <div className="px-8 pt-12 pb-8 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border mb-5 uppercase tracking-wider shadow-sm ${theme.badgeBg}`}>
                        <Icon size={14} fill="currentColor" /> {theme.type}
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        {theme.title}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 font-medium">
                        {notification.message}
                    </p>

                    <button onClick={() => onClose(notification.id)} className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 bg-gradient-to-r ${theme.gradient} hover:brightness-110`}>
                        C'est noté !
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertPopup;