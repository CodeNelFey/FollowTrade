import React from 'react';
import { X, Sparkles, CheckCircle2, User, Crown } from 'lucide-react';

const UpgradeModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 z-20"><X size={20} /></button>
                <div className="md:w-1/3 bg-gradient-to-br from-indigo-900 to-black p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10"><Sparkles className="text-emerald-400" /></div>
                        <h2 className="text-3xl font-black text-white leading-tight mb-2">Débloquez <br/><span className="text-emerald-400">Tout.</span></h2>
                        <p className="text-indigo-200 text-sm">Passez au niveau supérieur.</p>
                    </div>
                    <div className="relative z-10 space-y-3 mt-8">
                        <div className="flex items-center gap-3 text-white/80 text-sm"><CheckCircle2 size={16} className="text-emerald-400"/> Analyses illimitées</div>
                        <div className="flex items-center gap-3 text-white/80 text-sm"><CheckCircle2 size={16} className="text-emerald-400"/> Calendrier interactif</div>
                    </div>
                </div>
                <div className="md:w-2/3 p-8 bg-gray-50 dark:bg-neutral-900/95">
                    <div className="grid grid-cols-1 gap-4 h-full">
                        <div className="p-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 flex justify-between items-center opacity-60 grayscale">
                            <div className="flex items-center gap-4"><div className="p-3 bg-gray-100 dark:bg-neutral-700 rounded-xl"><User size={20} /></div><div><div className="font-bold text-gray-900 dark:text-white">Version FREE</div><div className="text-xs text-gray-500">Standard</div></div></div>
                            <span className="text-[10px] font-bold px-2 py-1 bg-gray-200 dark:bg-neutral-700 rounded text-gray-500">ACTUEL</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-transparent flex justify-between items-center">
                            <div className="flex items-center gap-4"><div className="p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-xl"><Crown size={20} /></div><div><div className="font-bold text-gray-900 dark:text-white">Version PRO</div><div className="text-xs text-gray-500">Bientôt</div></div></div>
                        </div>
                        <a href="https://t.me/sohanbirotheau" target="_blank" rel="noopener noreferrer" className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative p-5 flex justify-between items-center">
                                <div className="flex items-center gap-4"><div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform"><Sparkles size={24} /></div><div><div className="font-black text-lg text-gray-900 dark:text-white">Grade VIP</div><div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Gratuit sur demande</div></div></div>
                                <div className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md group-hover:bg-emerald-500 transition-colors">Contacter</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;