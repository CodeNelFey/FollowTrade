import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { CheckSquare, Plus, Trash2, Activity, Zap, GripVertical, Trophy, Lock, Edit2 } from 'lucide-react';
import { api } from '../api';
import TodoListModal, { ICON_MAP } from './TodoListModal';

const FREQ_CONFIG = {
    'DAILY': { label: 'Jour', fullLabel: 'Quotidien', color: 'indigo', bg: 'bg-indigo-50 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-500/30', bar: 'bg-indigo-500' },
    'WEEKLY': { label: 'Semaine', fullLabel: 'Hebdomadaire', color: 'purple', bg: 'bg-purple-50 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-500/30', bar: 'bg-purple-500' },
    'MONTHLY': { label: 'Mois', fullLabel: 'Mensuel', color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', bar: 'bg-emerald-500' },
    'YEARLY': { label: 'Année', fullLabel: 'Annuel', color: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', bar: 'bg-amber-500' },
    'ONCE': { label: 'Unique', fullLabel: 'Unique', color: 'gray', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700', bar: 'bg-gray-400' },
};

const TodoView = ({ user, onShowUpgrade }) => {
    const [todoLists, setTodoLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingList, setEditingList] = useState(null);
    const [newTasks, setNewTasks] = useState({});
    const [animateProgress, setAnimateProgress] = useState(false);

    const dragItemIndex = useRef(null);
    const [activeId, setActiveId] = useState(null);
    const listRefs = useRef(new Map());
    const prevRects = useRef(new Map());

    useEffect(() => {
        loadData();
        setTimeout(() => setAnimateProgress(true), 100);
    }, []);

    const listOrderSignature = todoLists.map(l => l.id).join(',');
    useLayoutEffect(() => {
        listRefs.current.forEach((node, id) => {
            const prevRect = prevRects.current.get(id);
            if (prevRect && node) {
                const currentRect = node.getBoundingClientRect();
                const deltaX = prevRect.left - currentRect.left;
                const deltaY = prevRect.top - currentRect.top;
                if (deltaX !== 0 || deltaY !== 0) {
                    node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    node.style.transition = 'none';
                }
            }
        });
        requestAnimationFrame(() => {
            listRefs.current.forEach((node) => {
                if (node) {
                    // eslint-disable-next-line no-unused-expressions
                    node.getBoundingClientRect();
                    node.style.transform = '';
                    const isDraggingThisNode = node.getAttribute('data-is-dragging') === 'true';
                    node.style.transition = isDraggingThisNode ? 'none' : 'transform 300ms cubic-bezier(0.2, 0, 0.2, 1)';
                }
            });
        });
    }, [listOrderSignature]);

    const snapshotPositions = () => {
        prevRects.current.clear();
        listRefs.current.forEach((node, id) => {
            if (node) {
                prevRects.current.set(id, node.getBoundingClientRect());
            }
        });
    };

    const loadData = async () => {
        try {
            const data = await api.getTodoLists();
            setTodoLists(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleDragStart = (e, index, id) => { e.stopPropagation(); dragItemIndex.current = index; setActiveId(id); e.dataTransfer.effectAllowed = "move"; snapshotPositions(); };
    const handleDragEnter = (e, index) => { e.stopPropagation(); if (dragItemIndex.current === null || dragItemIndex.current === index) return; snapshotPositions(); const newLists = [...todoLists]; const draggedItemContent = newLists[dragItemIndex.current]; newLists.splice(dragItemIndex.current, 1); newLists.splice(index, 0, draggedItemContent); dragItemIndex.current = index; setTodoLists(newLists); };
    const handleDragEnd = async (e) => { e.stopPropagation(); dragItemIndex.current = null; setActiveId(null); try { const listsToOrder = todoLists.map((l, index) => ({ id: l.id, position: index })); await api.reorderTodoLists(listsToOrder); } catch (error) { console.error("Erreur save order", error); } };

    const handleSaveList = async (listData) => {
        const payload = { ...listData };
        if (user.is_pro === 0) {
            payload.color = 'indigo';
            payload.icon = null;
        }

        try {
            if (editingList) {
                const updatedList = await api.updateTodoList(editingList.id, payload);
                setTodoLists(todoLists.map(l => l.id === editingList.id ? { ...l, ...updatedList, tasks: l.tasks } : l));
            } else {
                const newList = await api.createTodoList(payload);
                setTodoLists([...todoLists, newList]);
            }
        } catch (error) {
            console.error(error);
            if (error.message.includes('403')) {
                alert("Limite atteinte.");
                onShowUpgrade();
            } else {
                alert("Erreur sauvegarde liste");
            }
        }
    };

    const handleDeleteList = async (id) => {
        if (!window.confirm("Supprimer cette liste et toutes ses missions ?")) return;
        try {
            await api.deleteTodoList(id);
            setTodoLists(todoLists.filter(l => l.id !== id));
        } catch (error) { console.error(error); }
    };

    const handleEditClick = (list) => {
        setEditingList(list);
        setIsCreateModalOpen(true);
    };

    const handleCreateClick = () => {
        const canCreate = user.is_pro >= 1 || todoLists.length < 3;
        if (canCreate) {
            setEditingList(null);
            setIsCreateModalOpen(true);
        } else {
            onShowUpgrade();
        }
    };

    const handleAddTask = async (e, listId) => { e.preventDefault(); const text = newTasks[listId]; if (!text || !text.trim()) return; const currentList = todoLists.find(l => l.id === listId); if (user.is_pro === 0 && currentList.tasks.length >= 10) { alert("Limite de 10 tâches atteinte. Passez en PRO !"); onShowUpgrade(); return; } try { const addedTask = await api.addTodo({ list_id: listId, text: text }); const updatedLists = todoLists.map(list => { if (list.id === listId) return { ...list, tasks: [...list.tasks, addedTask] }; return list; }); setTodoLists(updatedLists); setNewTasks({ ...newTasks, [listId]: '' }); } catch (error) { console.error(error); } };
    const handleToggleTask = async (listId, taskId, currentStatus) => { const newStatus = currentStatus ? 0 : 1; const updatedLists = todoLists.map(list => { if (list.id === listId) return { ...list, tasks: list.tasks.map(t => t.id === taskId ? { ...t, is_completed: newStatus } : t) }; return list; }); setTodoLists(updatedLists); try { await api.toggleTodo(taskId, newStatus); } catch (error) { loadData(); } };
    const handleDeleteTask = async (listId, taskId) => { const updatedLists = todoLists.map(list => { if (list.id === listId) return { ...list, tasks: list.tasks.filter(t => t.id !== taskId) }; return list; }); setTodoLists(updatedLists); try { await api.deleteTodo(taskId); } catch (error) { loadData(); } };
    const calculateProgress = (frequency) => { const lists = todoLists.filter(l => l.frequency === frequency); const tasks = lists.flatMap(l => l.tasks); const total = tasks.length; const completed = tasks.filter(t => t.is_completed).length; return total === 0 ? 0 : Math.round((completed / total) * 100); };
    const allTasks = todoLists.flatMap(l => l.tasks); const totalGlobal = allTasks.length; const completedGlobal = allTasks.filter(t => t.is_completed).length; const progressGlobal = totalGlobal === 0 ? 0 : Math.round((completedGlobal / totalGlobal) * 100);
    const dailyProg = calculateProgress('DAILY'); const weeklyProg = calculateProgress('WEEKLY'); const monthlyProg = calculateProgress('MONTHLY'); const yearlyProg = calculateProgress('YEARLY');

    const MiniProgressBar = ({ freqKey, percent }) => {
        const config = FREQ_CONFIG[freqKey];
        const isComplete = percent === 100;
        const baseColor = config.color;
        return (
            <div className={`p-4 rounded-xl border flex flex-col justify-between h-full transition-all duration-500 ${isComplete ? `bg-${baseColor}-50/80 dark:bg-${baseColor}-900/20 border-${baseColor}-500/50 shadow-md shadow-${baseColor}-500/20` : 'bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-white/5'}`}>
                <div className="flex justify-between items-end mb-3"><span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isComplete ? `text-${baseColor}-600 dark:text-${baseColor}-400` : 'text-gray-500 dark:text-gray-400'}`}>{config.label}{isComplete && <CheckSquare size={10} />}</span><span className={`text-xl font-black transition-all ${isComplete ? `text-${baseColor}-600 dark:text-${baseColor}-400 scale-110` : config.text}`}>{percent}%</span></div>
                <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ease-out ${isComplete ? `bg-gradient-to-r from-${baseColor}-400 to-${baseColor}-600` : config.bar}`} style={{ width: animateProgress ? `${percent}%` : '0%' }}></div></div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Dashboard */}
            <div className={`mb-8 backdrop-blur-xl rounded-3xl p-6 md:p-8 border shadow-sm relative overflow-hidden transition-all duration-700 ${progressGlobal === 100 ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'bg-white/60 dark:bg-neutral-900/60 border-white/20 dark:border-white/5'}`}>
                {progressGlobal === 100 && (<div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Trophy size={150} className="text-indigo-500 rotate-12" /></div>)}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 relative z-10"><div><h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">{progressGlobal === 100 ? <Trophy className="text-yellow-500 animate-bounce" /> : <Activity className="text-indigo-500" />}Dashboard Routine</h2><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{progressGlobal === 100 ? "Félicitations ! Tous les objectifs sont atteints." : `${totalGlobal} missions actives réparties sur ${todoLists.length} listes.`}</p></div><div className="text-left md:text-right"><span className={`text-5xl font-black transition-colors duration-500 ${progressGlobal === 100 ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600' : 'text-indigo-600 dark:text-indigo-400'}`}>{progressGlobal}%</span><span className="text-xs font-bold text-gray-400 uppercase block mt-1">Accompli Globalement</span></div></div>
                <div className="w-full h-4 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-8 shadow-inner relative z-10"><div className={`h-full transition-all duration-1000 ease-out ${progressGlobal === 100 ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-[gradient_3s_infinite]' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`} style={{ width: animateProgress ? `${progressGlobal}%` : '0%' }}></div></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10"><MiniProgressBar freqKey="DAILY" percent={dailyProg} /><MiniProgressBar freqKey="WEEKLY" percent={weeklyProg} /><MiniProgressBar freqKey="MONTHLY" percent={monthlyProg} /><MiniProgressBar freqKey="YEARLY" percent={yearlyProg} /></div>
            </div>

            {/* Listes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todoLists.map((list, index) => {
                    const Icon = list.icon ? (ICON_MAP[list.icon] || Zap) : Zap;
                    const colorClass = `text-${list.color}-500`;
                    const bgClass = `bg-${list.color}-50 dark:bg-${list.color}-900/10`;
                    const badgeConfig = FREQ_CONFIG[list.frequency] || FREQ_CONFIG['DAILY'];
                    const isDragging = activeId === list.id;

                    return (
                        <div key={list.id} ref={(el) => listRefs.current.set(list.id, el)} data-is-dragging={isDragging} className={`rounded-3xl p-5 border flex flex-col h-full min-h-[350px] relative group cursor-grab active:cursor-grabbing transition-all duration-300 ease-out ${isDragging ? 'bg-indigo-50/30 dark:bg-indigo-900/5 border-dashed border-2 border-indigo-300 dark:border-indigo-700 opacity-60 scale-[0.98]' : 'bg-white dark:bg-neutral-900/40 dark:border-white/5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800'}`} draggable onDragStart={(e) => handleDragStart(e, index, list.id)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}>
                            <div className={`transition-opacity duration-200 flex flex-col h-full ${isDragging ? 'opacity-0' : 'opacity-100'}`}>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <GripVertical className="text-gray-300 dark:text-neutral-700 cursor-grab opacity-50 group-hover:opacity-100" size={16} />
                                    {/* Bouton EDIT */}
                                    <button onClick={() => handleEditClick(list)} className="text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 p-1"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteList(list.id)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 p-1"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex items-center gap-3 mb-2 pr-16 flex-shrink-0">
                                    {list.icon && (<div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}><Icon size={20} /></div>)}
                                    <div><h3 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[150px]">{list.title}</h3><span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${badgeConfig.bg} ${badgeConfig.text} ${badgeConfig.border}`}>{badgeConfig.fullLabel}</span></div>
                                </div>
                                <div className="h-px bg-gray-100 dark:bg-neutral-800 my-4 flex-shrink-0"></div>
                                <div className="space-y-3 flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                                    {list.tasks.length > 0 ? (list.tasks.map(task => (<div key={task.id} className="flex items-start gap-3 group/task"><button onClick={() => handleToggleTask(list.id, task.id, task.is_completed)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${task.is_completed ? `bg-${list.color}-500 border-${list.color}-500 text-white` : 'border-gray-300 dark:border-neutral-600 hover:border-indigo-400'}`}>{!!task.is_completed && <CheckSquare size={12} />}</button><span className={`text-sm flex-1 break-words ${task.is_completed ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>{task.text}</span><button onClick={() => handleDeleteTask(list.id, task.id)} className="opacity-0 group-hover/task:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><XIcon size={14} /></button></div>))) : (<div className="text-center py-6 text-gray-400 text-xs italic">Aucune mission</div>)}
                                </div>
                                <form onSubmit={(e) => handleAddTask(e, list.id)} className="mt-auto pt-3 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0">
                                    <div className="relative"><input type="text" placeholder="Ajouter une mission..." className="w-full bg-gray-50 dark:bg-neutral-950/50 border border-gray-200 dark:border-neutral-800 rounded-xl py-2 pl-3 pr-9 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white" value={newTasks[list.id] || ''} onChange={(e) => setNewTasks({ ...newTasks, [list.id]: e.target.value })} /><button type="submit" className={`absolute right-2 top-1/2 -translate-y-1/2 ${colorClass} hover:scale-110 transition-transform`}><Plus size={16} /></button></div>
                                </form>
                            </div>
                        </div>
                    );
                })}

                <button onClick={handleCreateClick} className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all min-h-[350px] group">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {user.is_pro >= 1 || todoLists.length < 3 ? <Plus size={32} /> : <Lock size={32} className="text-amber-500" />}
                    </div>
                    <span className="font-bold">{user.is_pro >= 1 ? 'Créer une nouvelle liste' : todoLists.length < 3 ? 'Créer une liste (Gratuit)' : 'Limite atteinte (3/3)'}</span>
                </button>
            </div>

            <TodoListModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleSaveList} user={user} listToEdit={editingList} />
        </div>
    );
};

const XIcon = ({size}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);

export default TodoView;