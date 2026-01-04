import React from 'react';
import { Plus, Edit2, Trash2, Briefcase } from 'lucide-react';

const AccountSelector = ({ accounts, currentAccount, onSelect, onOpenCreate, onOpenEdit, onDelete }) => {

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={14}/> Mes Comptes
                </h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {accounts.map(acc => {
                    const isActive = currentAccount?.id === acc.id;
                    const activeColor = acc.color || '#4f46e5';

                    return (
                        <div
                            key={acc.id}
                            onClick={() => onSelect(acc)}
                            className={`
                                min-w-[200px] p-4 rounded-2xl cursor-pointer transition-all relative group snap-start
                                flex flex-col justify-between border-2
                                ${isActive
                                ? 'text-white shadow-xl translate-y-[-2px]'
                                : 'bg-white dark:bg-neutral-900 border-transparent text-gray-500 hover:border-gray-200 dark:hover:border-neutral-800'}
                            `}
                            style={isActive ? {
                                backgroundColor: activeColor,
                                borderColor: activeColor,
                                boxShadow: `0 10px 30px -10px ${activeColor}80`
                            } : {}}
                        >
                            {/* En-tête Carte */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className={`font-black text-sm truncate max-w-[120px] ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {acc.name}
                                    </h4>
                                    <span className="text-[10px] opacity-70 uppercase tracking-wide">
                                        {acc.broker || 'Broker N/A'}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenEdit(acc); }}
                                        className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200'}`}
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(acc.id); }}
                                        className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20 hover:bg-red-500 hover:text-white' : 'bg-gray-100 dark:bg-neutral-800 hover:bg-red-100 hover:text-red-500'}`}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Footer Carte */}
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] opacity-60">Plateforme</span>
                                    <span className="text-xs font-bold">{acc.platform || '-'}</span>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-neutral-800'}`}>
                                    {acc.currency}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* BOUTON AJOUTER */}
                <button
                    onClick={onOpenCreate}
                    className="min-w-[60px] flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-neutral-800 text-gray-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all snap-start"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
};

export default AccountSelector;