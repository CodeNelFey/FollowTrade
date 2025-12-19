import React, { useState } from 'react';
import { api } from '../api';
import { Lock, Mail, LogIn, UserPlus, AlertCircle, User } from 'lucide-react';

const Auth = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);

    // Champs du formulaire
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Nouveaux champs pour l'inscription
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validation spécifique à l'inscription
            if (isSignUp) {
                if (password !== confirmPassword) {
                    throw new Error("Les mots de passe ne correspondent pas.");
                }
                if (password.length < 6) {
                    throw new Error("Le mot de passe doit faire au moins 6 caractères.");
                }
            }

            let data;
            if (isSignUp) {
                // On passe les 4 arguments pour l'inscription
                data = await api.register(email, password, firstName, lastName);
            } else {
                data = await api.login(email, password);
            }

            if (data.error) {
                throw new Error(data.error);
            }

            api.setToken(data.token);
            api.setUser(data.user);
            onLoginSuccess(data.user);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-white/50 dark:bg-neutral-950/50 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400";

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4 text-indigo-600 dark:text-indigo-400">
                        {isSignUp ? <UserPlus size={32} /> : <LogIn size={32} />}
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isSignUp ? 'Créer un compte' : 'Bon retour'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        {isSignUp ? 'Rejoignez TradingSpace et suivez vos performances' : 'Connectez-vous pour accéder à votre journal'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-pulse">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">

                    {/* CHAMPS NOM/PRÉNOM (Uniquement si Inscription) */}
                    {isSignUp && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Prénom"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Nom"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* EMAIL */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* MOT DE PASSE */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* CONFIRMATION MOT DE PASSE (Uniquement si Inscription) */}
                    {isSignUp && (
                        <div className="relative animate-in slide-in-from-top-2 fade-in duration-300">
                            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input
                                type="password"
                                placeholder="Confirmer mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`${inputClass} ${confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                                required
                            />
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Chargement...' : isSignUp ? <><UserPlus size={18} /> S'inscrire</> : <><LogIn size={18} /> Se connecter</>}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null); // Reset erreur quand on change de mode
                        }}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;