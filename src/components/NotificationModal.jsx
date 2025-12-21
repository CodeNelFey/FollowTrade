import React from 'react';
import { Bell, X, Crown } from 'lucide-react';

const NotificationModal = ({ isOpen, onClose, notifications }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-start justify-end p-4 md:p-6 animate-in fade-in slide-in-from-right-10 duration-300">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden mt-16 md:mt-0">
                <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell size={18} className="text-indigo-500" /> Notifications</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Aucune notification.</div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className={`p-4 rounded-xl text-sm border ${notif.is_read ? 'bg-white dark:bg-black/20 border-gray-100 dark:border-white/5 opacity-60' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-500/20'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    {/* Style Badge Violet pour GRADE ici aussi */}
                                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${notif.type === 'GRADE' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {notif.type === 'GRADE' && <Crown size={12} />}
                                        {notif.type}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{notif.date}</span>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 mt-1 leading-snug">{notif.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;