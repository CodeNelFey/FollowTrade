import React, { useState, useEffect } from 'react';
import { X, Check, Sun, Moon, Zap, Briefcase, Target, Trophy, Clock, Calendar, BarChart2, Flag, Activity, Lock } from 'lucide-react';

export const ICON_MAP = {
    'sun': Sun, 'moon': Moon, 'zap': Zap, 'briefcase': Briefcase,
    'target': Target, 'trophy': Trophy, 'clock': Clock, 'calendar': Calendar,
    'bar-chart': BarChart2, 'flag': Flag, 'activity': Activity
};

const COLORS = [
    { id: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500' },
    { id: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
    { id: 'rose', bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500' },
    { id: 'amber', bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    { id: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' },
    { id: 'purple', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
];

const FREQUENCIES = [
    { id: 'DAILY', label: 'Quotidien (Reset chaque jour)' },
    { id: 'WEEKLY', label: 'Hebdomadaire (Reset Lundi)' },
    { id: 'MONTHLY', label: 'Mensuel (Reset le 1er)' },
    { id: 'YEARLY', label: 'Annuel (Reset 1er Janvier)' },
    { id: 'ONCE', label: 'Unique (Pas de Reset)' },
];

const TodoListModal = ({ isOpen, onClose, onSave, user, listToEdit }) => {
    const [title, setTitle] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('zap');
    const [selectedColor, setSelectedColor] = useState('indigo');
    const [frequency, setFrequency] = useState('DAILY');

    const isFree = user?.is_pro === 0;

    useEffect(() => {
        if (isOpen) {
            if (listToEdit) {
                setTitle(listToEdit.title);
                setSelectedIcon(listToEdit.icon || 'zap');
                setSelectedColor(listToEdit.color || 'indigo');
                setFrequency(listToEdit.frequency || 'DAILY');
            } else {
                setTitle('');
                setSelectedIcon('zap');
                setSelectedColor('indigo');
                setFrequency('DAILY');
            }
        }
    }, [isOpen, listToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({ title, icon: selectedIcon, color: selectedColor, frequency });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {listToEdit ? 'Modifier la liste' : 'Nouvelle Liste'}
                    </h3>
                    <button onClick={onClose}><X className="text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Titre */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Titre de la liste</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Routine Matinale"
                            className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            autoFocus
                        />
                    </div>

                    {/* Fréquence */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Fréquence (Reset Auto)</label>
                        <div className="grid grid-cols-1 gap-2">
                            {FREQUENCIES.map(freq => (
                                <button
                                    key={freq.id}
                                    type="button"
                                    onClick={() => setFrequency(freq.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold text-left transition-all ${frequency === freq.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
                                >
                                    {freq.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- ZONE PERSONNALISATION (VERROUILLÉE POUR FREE) --- */}
                    <div className="relative p-4 -mx-4 rounded-2xl">
                        {isFree && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-2xl select-none">
                                <div className="bg-white dark:bg-neutral-800 px-4 py-2 rounded-full shadow-xl border border-amber-200 dark:border-neutral-700 flex items-center gap-2 animate-in zoom-in-95">
                                    <Lock size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-wide">Personnalisation PRO</span>
                                </div>
                            </div>
                        )}

                        <div className={`space-y-6 ${isFree ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                            {/* Couleurs */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Couleur du thème</label>
                                <div className="flex gap-3">
                                    {COLORS.map(col => (
                                        <button
                                            key={col.id}
                                            type="button"
                                            onClick={() => setSelectedColor(col.id)}
                                            className={`w-8 h-8 rounded-full ${col.bg} transition-transform hover:scale-110 flex items-center justify-center ring-2 ${selectedColor === col.id ? 'ring-offset-2 ring-gray-400 dark:ring-offset-black' : 'ring-transparent'}`}
                                        >
                                            {selectedColor === col.id && <Check size={14} className="text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icônes */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Icône</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {Object.entries(ICON_MAP).map(([key, Icon]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedIcon(key)}
                                            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${selectedIcon === key ? 'bg-gray-200 dark:bg-neutral-700 text-indigo-500' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                                        >
                                            <Icon size={20} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
                        {listToEdit ? 'Enregistrer les modifications' : 'Créer la liste'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TodoListModal;