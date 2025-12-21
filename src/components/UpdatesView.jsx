import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Megaphone, Calendar, Tag, AlertCircle, CheckCircle2, Zap, Info } from 'lucide-react';

const UpdatesView = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUpdates();
    }, []);

    const loadUpdates = async () => {
        try {
            const data = await api.getUpdates();
            if (Array.isArray(data)) setUpdates(data);
        } catch (e) {
            console.error("Erreur updates", e);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'FEATURE': return <Zap size={18} className="text-purple-500" />;
            case 'FIX': return <CheckCircle2 size={18} className="text-emerald-500" />;
            case 'ALERT': return <AlertCircle size={18} className="text-rose-500" />;
            default: return <Info size={18} className="text-blue-500" />;
        }
    };

    const getTypeBadge = (type) => {
        switch(type) {
            case 'FEATURE': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
            case 'FIX': return 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            case 'ALERT': return 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
            default: return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Chargement des nouveautés...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                    <Megaphone size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nouveautés</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Suivez l'évolution de FollowTrade</p>
                </div>
            </div>

            <div className="space-y-6">
                {updates.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400">
                        Aucune mise à jour pour le moment.
                    </div>
                ) : (
                    updates.map((up) => (
                        <div key={up.id} className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all">

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 ${getTypeBadge(up.type)}`}>
                                        {getTypeIcon(up.type)} {up.type}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                                        <Calendar size={12} /> {up.date}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{up.title}</h3>

                            <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {up.content}
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UpdatesView;