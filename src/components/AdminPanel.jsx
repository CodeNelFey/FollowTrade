import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, Trash2, Edit2, ShieldAlert, User, Crown, Sparkles, X, Plus, Mail, Send, Lock } from 'lucide-react';

const AdminPanel = () => {
    // URL de ton backend (à modifier si tu mets en ligne plus tard)
    const API_URL = 'http://localhost:3000';

    const [activeTab, setActiveTab] = useState('users');

    // USERS STATES
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({});

    // UPDATES STATES
    const [updates, setUpdates] = useState([]);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [updateForm, setUpdateForm] = useState({ title: '', content: '', type: 'INFO', date: new Date().toISOString().split('T')[0] });
    const [editingUpdateId, setEditingUpdateId] = useState(null);

    // EMAILS STATE
    const [sendingEmail, setSendingEmail] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction pour corriger l'URL de l'image
    const getAvatarUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        return `${API_URL}${url}`;
    };

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'updates') loadUpdates();
    }, [activeTab]);

    useEffect(() => {
        if (!searchTerm) setFilteredUsers(users);
        else {
            const lower = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(u => u.email.toLowerCase().includes(lower) || (u.first_name + ' ' + u.last_name).toLowerCase().includes(lower)));
        }
    }, [searchTerm, users]);

    const loadUsers = async () => {
        setLoading(true); setError(null);
        try {
            const data = await api.adminGetAllUsers();
            if (Array.isArray(data)) {
                setUsers(data);
                setFilteredUsers(data);
            }
        } catch (error) {
            console.error(error);
            setError("Erreur chargement users");
        } finally { setLoading(false); }
    };

    const loadUpdates = async () => {
        setLoading(true);
        try {
            const data = await api.getUpdates();
            if (Array.isArray(data)) setUpdates(data);
        } catch (e) { setError("Erreur chargement updates"); } finally { setLoading(false); }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            await api.adminUpdateUser(editingUser.id, formData);
            await loadUsers();
            setEditingUser(null);
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde : " + (e.response?.data?.error || e.message));
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Supprimer ce compte définitivement ?")) return;
        try {
            await api.adminDeleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            setFilteredUsers(filteredUsers.filter(u => u.id !== id));
        } catch (e) { alert("Erreur lors de la suppression"); }
    };

    const handleEditUserClick = (user) => {
        setEditingUser(user);
        setFormData({ ...user });
    };

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        try {
            if (editingUpdateId) {
                await api.adminUpdateUpdate(editingUpdateId, updateForm);
                setUpdates(updates.map(u => u.id === editingUpdateId ? { ...updateForm, id: editingUpdateId } : u));
            } else {
                const res = await api.adminCreateUpdate(updateForm);
                setUpdates([res, ...updates]);
            }
            setIsUpdateModalOpen(false);
            setUpdateForm({ title: '', content: '', type: 'INFO', date: new Date().toISOString().split('T')[0] });
            setEditingUpdateId(null);
        } catch (e) { alert("Erreur sauvegarde update"); }
    };

    const handleDeleteUpdate = async (id) => {
        if (!window.confirm("Supprimer ce message ?")) return;
        try { await api.adminDeleteUpdate(id); setUpdates(updates.filter(u => u.id !== id)); } catch (e) { alert("Erreur"); }
    };

    const openUpdateModal = (update = null) => {
        if (update) { setUpdateForm(update); setEditingUpdateId(update.id); }
        else { setUpdateForm({ title: '', content: '', type: 'INFO', date: new Date().toISOString().split('T')[0] }); setEditingUpdateId(null); }
        setIsUpdateModalOpen(true);
    };

    // --- FONCTION DE TEST EMAIL ---
    const handleTestEmail = async (type) => {
        setSendingEmail(type);
        try {
            await api.adminTestEmail(type);
            alert(`Email ${type} envoyé avec succès ! Vérifie ta boîte mail.`);
        } catch (e) {
            alert("Erreur lors de l'envoi : " + (e.response?.data?.error || e.message));
        } finally {
            setSendingEmail(null);
        }
    };

    const renderBadge = (is_pro) => {
        if (is_pro === 7) return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border border-purple-400/30 shadow-sm w-fit justify-center"><ShieldAlert size={12} fill="currentColor" /> ADMIN</div>;
        if (is_pro === 2) return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white border border-emerald-400/30 shadow-sm w-fit justify-center"><Sparkles size={12} fill="currentColor" /> VIP</div>;
        if (is_pro === 1) return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-300 to-yellow-500 text-yellow-900 border border-yellow-400/30 shadow-sm w-fit justify-center"><Crown size={12} fill="currentColor" /> PRO</div>;
        return <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/10 w-fit justify-center"><User size={12} /> FREE</div>;
    };

    const labelClass = "text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 block";
    const inputClass = "w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><ShieldAlert className="text-purple-500" /> Panel Administrateur</h2>
                <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl overflow-x-auto">
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white dark:bg-neutral-800 shadow text-indigo-600' : 'text-gray-500'}`}>Utilisateurs</button>
                    <button onClick={() => setActiveTab('updates')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'updates' ? 'bg-white dark:bg-neutral-800 shadow text-indigo-600' : 'text-gray-500'}`}>Mises à jour</button>
                    <button onClick={() => setActiveTab('emails')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'emails' ? 'bg-white dark:bg-neutral-800 shadow text-indigo-600' : 'text-gray-500'}`}>Emails & Tests</button>
                </div>
            </div>

            {activeTab === 'users' && (
                <>
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input type="text" placeholder="Rechercher un utilisateur..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-neutral-900/50 pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 dark:text-white transition-all backdrop-blur-sm" />
                    </div>

                    {/* VUE MOBILE : CARTES */}
                    <div className="md:hidden space-y-4">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700 flex-shrink-0">
                                        {u.avatar_url ? (
                                            <img src={getAvatarUrl(u.avatar_url)} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20}/></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{u.first_name} {u.last_name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{u.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
                                    {renderBadge(u.is_pro)}
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditUserClick(u)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold flex items-center gap-2">
                                            <Edit2 size={14} /> Modifier
                                        </button>
                                        {u.is_pro !== 7 && (
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* VUE BUREAU : TABLEAU */}
                    <div className="hidden md:block bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/50 dark:bg-black/40 text-gray-500 dark:text-neutral-500 uppercase text-xs font-bold tracking-wider">
                                <tr><th className="px-6 py-4">Utilisateur</th><th className="px-6 py-4">Email</th><th className="px-6 py-4 text-center">Statut</th><th className="px-6 py-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700 flex-shrink-0">
                                                {u.avatar_url ? (
                                                    <img src={getAvatarUrl(u.avatar_url)} className="w-full h-full object-cover" alt="Avatar" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={14}/></div>
                                                )}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white">{u.first_name} {u.last_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{u.email}</td>
                                        <td className="px-6 py-4 text-center"><div className="flex justify-center">{renderBadge(u.is_pro)}</div></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEditUserClick(u)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 rounded-lg"><Edit2 size={16} /></button>
                                                {u.is_pro !== 7 && <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-lg"><Trash2 size={16} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'updates' && (
                <>
                    <div className="flex justify-end mb-6"><button onClick={() => openUpdateModal()} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:bg-indigo-700"><Plus size={18}/> Nouveau Message</button></div>
                    <div className="space-y-4">
                        {updates.map(up => (
                            <div key={up.id} className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-sm flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${up.type === 'ALERT' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-blue-100 text-blue-600 border-blue-200'}`}>{up.type}</span><span className="text-xs text-gray-400 font-mono">{up.date}</span></div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{up.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 whitespace-pre-wrap">{up.content}</p>
                                </div>
                                <div className="flex gap-2"><button onClick={() => openUpdateModal(up)} className="p-2 text-gray-400 hover:text-indigo-500"><Edit2 size={16}/></button><button onClick={() => handleDeleteUpdate(up.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* --- VUE EMAILS --- */}
            {activeTab === 'emails' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Carte Bienvenue */}
                    <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-sm flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4"><Sparkles size={24}/></div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Bienvenue</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Envoyé lors de l'inscription d'un nouvel utilisateur.</p>
                        <button
                            onClick={() => handleTestEmail('WELCOME')}
                            disabled={!!sendingEmail}
                            className="w-full py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {sendingEmail === 'WELCOME' ? <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"/> : <Send size={16} className="text-indigo-500 group-hover:translate-x-1 transition-transform"/>}
                            Envoyer un test
                        </button>
                    </div>

                    {/* Carte Reset Password */}
                    <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-sm flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4"><Lock size={24}/></div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Mot de passe oublié</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Contient le lien sécurisé pour réinitialiser le mot de passe.</p>
                        <button
                            onClick={() => handleTestEmail('RESET_PASSWORD')}
                            disabled={!!sendingEmail}
                            className="w-full py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {sendingEmail === 'RESET_PASSWORD' ? <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"/> : <Send size={16} className="text-indigo-500 group-hover:translate-x-1 transition-transform"/>}
                            Envoyer un test
                        </button>
                    </div>

                    {/* Carte Alerte */}
                    <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-sm flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4"><ShieldAlert size={24}/></div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Alerte Sécurité</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">Envoyé lors d'une connexion suspecte ou changement important.</p>
                        <button
                            onClick={() => handleTestEmail('ALERT')}
                            disabled={!!sendingEmail}
                            className="w-full py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {sendingEmail === 'ALERT' ? <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"/> : <Send size={16} className="text-indigo-500 group-hover:translate-x-1 transition-transform"/>}
                            Envoyer un test
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODALE MODIFICATION UTILISATEUR (Responsive) --- */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center flex-none">
                            <h3 className="text-lg font-bold dark:text-white">Modifier Profil</h3>
                            <button onClick={() => setEditingUser(null)}><X size={20} className="text-gray-500"/></button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto">
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-xl bg-gray-100 dark:bg-neutral-700 mb-3">
                                        {/* CORRECTION IMAGE ICI AUSSI */}
                                        {formData.avatar_url ? (
                                            <img src={getAvatarUrl(formData.avatar_url)} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={40} /></div>
                                        )}
                                    </div>
                                    {/* Pas de modification d'image ici pour simplifier, on supprime juste si besoin */}
                                </div>
                                <h4 className="text-xl font-black text-gray-900 dark:text-white">{formData.first_name} {formData.last_name}</h4>
                                <p className="text-sm text-gray-500">{formData.email}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label className={labelClass}>Prénom</label><input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>Nom</label><input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className={inputClass} /></div>
                            </div>
                            <div className="mb-6"><label className={labelClass}>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} /></div>
                            <div className="mb-8"><label className={labelClass}>Grade</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[{ val: 0 }, { val: 1 }, { val: 2 }, { val: 7 }].map((role) => (
                                        <button key={role.val} type="button" onClick={() => setFormData({...formData, is_pro: role.val})} className={`flex items-center justify-center p-3 rounded-xl border ${formData.is_pro === role.val ? 'bg-white dark:bg-neutral-800 border-indigo-500 shadow-lg' : 'bg-gray-50 dark:bg-black/20 border-transparent opacity-60'}`}>{renderBadge(role.val)}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl text-gray-500 font-bold">Annuler</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Sauvegarder</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODALE UPDATES --- */}
            {isUpdateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95">
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center flex-none">
                            <h3 className="text-lg font-bold dark:text-white">Message</h3>
                            <button onClick={() => setIsUpdateModalOpen(false)}><X size={20} className="text-gray-500"/></button>
                        </div>
                        <form onSubmit={handleSaveUpdate} className="p-6 space-y-4 overflow-y-auto">
                            <div><label className={labelClass}>Titre</label><input type="text" value={updateForm.title} onChange={e => setUpdateForm({...updateForm, title: e.target.value})} className={inputClass} required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelClass}>Type</label><select value={updateForm.type} onChange={e => setUpdateForm({...updateForm, type: e.target.value})} className={inputClass}><option value="INFO">Info</option><option value="FEATURE">Nouveauté</option><option value="FIX">Correctif</option><option value="ALERT">Alerte</option></select></div>
                                <div><label className={labelClass}>Date</label><input type="date" value={updateForm.date} onChange={e => setUpdateForm({...updateForm, date: e.target.value})} className={inputClass} required /></div>
                            </div>
                            <div><label className={labelClass}>Contenu</label><textarea rows="5" value={updateForm.content} onChange={e => setUpdateForm({...updateForm, content: e.target.value})} className={inputClass} required></textarea></div>
                            <div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 rounded-xl text-gray-500 font-bold">Annuler</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl">Publier</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;