import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Briefcase, ChevronDown, Wallet, Check, Settings } from 'lucide-react';

const AccountSelector = ({ accounts, currentAccount, onSelect, onOpenCreate, onOpenEdit, onDelete, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [hoveredAccountId, setHoveredAccountId] = useState(null);

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentAccount && accounts.length > 0) return null;

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={14}/> Mes Comptes
                </h3>
            </div>

            {/* --- VERSION MOBILE : DROPDOWN --- */}
            <div className="md:hidden relative z-30" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${isOpen
                        ? 'bg-white dark:bg-neutral-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                        : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 shadow-sm'}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md transform transition-transform" style={{ backgroundColor: currentAccount?.color || '#4f46e5' }}>
                            <Wallet size={18} />
                        </div>
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Compte Actif</span>
                            <span className="font-black text-gray-900 dark:text-white truncate text-base">{currentAccount?.name}</span>
                        </div>
                    </div>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <div className="max-h-[60vh] overflow-y-auto scrollbar-hide p-2 space-y-1">
                            {accounts.map(acc => (
                                <div key={acc.id} onClick={() => { onSelect(acc); setIsOpen(false); }} className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${currentAccount.id === acc.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30' : 'hover:bg-gray-50 dark:hover:bg-neutral-800 border border-transparent'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm flex-shrink-0" style={{ backgroundColor: acc.color }}></div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`font-bold text-sm truncate ${currentAccount.id === acc.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>{acc.name}</span>
                                            <span className="text-[10px] text-gray-400">{acc.broker || 'No Broker'} • {acc.currency}</span>
                                        </div>
                                    </div>
                                    {currentAccount.id === acc.id && <Check size={16} className="text-indigo-500" />}
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 grid grid-cols-2 gap-2">
                            <button onClick={() => { onOpenEdit(currentAccount); setIsOpen(false); }} className="flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-all"><Settings size={14} /> Configurer</button>
                            <button onClick={() => { onOpenCreate(); setIsOpen(false); }} className="flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"><Plus size={14} /> Nouveau</button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- VERSION DESKTOP : CARTES --- */}
            <div className="hidden md:flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {accounts.map(acc => {
                    const isActive = currentAccount?.id === acc.id;
                    const isHovered = hoveredAccountId === acc.id;
                    const activeColor = acc.color || '#4f46e5';

                    // GESTION DES STYLES
                    const cardStyle = {};

                    if (isActive) {
                        // ACTIF : Dégradé, Texte Blanc, SANS BORDURE
                        cardStyle.background = `linear-gradient(135deg, ${activeColor}, ${isDark ? '#171717' : '#e5e7eb'})`;
                        cardStyle.color = 'white';
                        cardStyle.boxShadow = `0 10px 30px -10px ${activeColor}80`;
                        // La classe border-0 gère la suppression de la bordure
                    } else if (isHovered) {
                        // HOVER : Fond neutre, Bordure Colorée, Texte Coloré
                        cardStyle.borderColor = activeColor;
                        cardStyle.color = activeColor;
                        cardStyle.backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
                    }

                    return (
                        <div
                            key={acc.id}
                            onClick={() => onSelect(acc)}
                            onMouseEnter={() => setHoveredAccountId(acc.id)}
                            onMouseLeave={() => setHoveredAccountId(null)}
                            className={`
                                min-w-[200px] p-4 rounded-2xl cursor-pointer transition-all duration-300 relative group snap-start
                                flex flex-col justify-between
                                ${isActive
                                ? 'border-0 translate-y-[-2px]'  // border-0 ici pour retirer les bords
                                : 'border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-500'}
                            `}
                            style={cardStyle}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className={`font-black text-sm truncate max-w-[120px] transition-colors ${!isActive && !isHovered ? 'text-gray-900 dark:text-white' : ''}`}>
                                        {acc.name}
                                    </h4>
                                    <span className={`text-[10px] uppercase tracking-wide transition-opacity ${isActive ? 'text-white/70' : 'opacity-70'}`}>
                                        {acc.broker || 'Broker N/A'}
                                    </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onOpenEdit(acc); }} className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20 hover:bg-white/30 text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}><Edit2 size={12} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }} className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20 hover:bg-red-500 hover:text-white text-white' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'}`}><Trash2 size={12} /></button>
                                </div>
                            </div>

                            <div className={`flex items-center justify-between mt-auto pt-2 border-t transition-colors ${isActive ? 'border-white/10' : 'border-gray-100 dark:border-neutral-800'}`}>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] ${isActive ? 'text-white/60' : 'opacity-60'}`}>Plateforme</span>
                                    <span className="text-xs font-bold">{acc.platform || '-'}</span>
                                </div>
                                <div
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-neutral-800'}`}
                                >
                                    {acc.currency}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button onClick={onOpenCreate} className="min-w-[60px] flex items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-neutral-800 text-gray-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all snap-start"><Plus size={24} /></button>
            </div>
        </div>
    );
};

export default AccountSelector;