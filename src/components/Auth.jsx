import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Lock, Mail, LogIn, UserPlus, AlertCircle, User, CheckCircle, ArrowLeft } from 'lucide-react';

const Auth = ({ onLoginSuccess, initialSignUp }) => {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(initialSignUp);
    const [error, setError] = useState('');

    // --- NOUVEAU STATE POUR LA VÉRIFICATION ---
    const [verificationStep, setVerificationStep] = useState(false);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']); // Tableau pour 6 chiffres
    const inputRefs = useRef([]);

    // Champs du formulaire
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // --- LOGIQUE INSCRIPTION ---
                if (password !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas.");
                if (password.length < 6) throw new Error("Mot de passe trop court.");

                const data = await api.register(email, password, firstName, lastName);

                if (data.error) throw new Error(data.error);

                // Si l'API nous dit que la vérif est requise
                if (data.requiresVerification) {
                    setVerificationStep(true); // On passe à l'écran de code
                    setLoading(false);
                    return; // On arrête là, on attend le code
                }
            } else {
                // --- LOGIQUE LOGIN ---
                const data = await api.login(email, password);
                if (data.error) throw new Error(data.error);

                api.setToken(data.token);
                api.setUser(data.user);
                onLoginSuccess(data.user);
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // --- GESTION DU CODE OTP ---
    const handleCodeChange = (index, value) => {
        if (isNaN(value)) return;
        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        // Focus automatique case suivante
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Retour arrière : Focus case précédente
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const codeString = verificationCode.join('');

        try {
            const data = await api.verifyEmail(email, codeString);
            if (data.error) throw new Error(data.error);

            // Succès : On connecte l'utilisateur
            api.setToken(data.token);
            api.setUser(data.user);
            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message || "Code invalide");
            setLoading(false);
        }
    };

    // Revenir pour corriger l'email (Réinitialise la vue vérification mais garde les champs remplis)
    const handleBackToEdit = () => {
        setVerificationStep(false);
        setError(null);
        setVerificationCode(['', '', '', '', '', '']);
    };

    const inputClass = "w-full bg-white/50 dark:bg-neutral-950/50 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white px-4 py-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400";

    useEffect(() => {
        const sessionMsg = localStorage.getItem('auth_message');
        if (sessionMsg) { setError(sessionMsg); localStorage.removeItem('auth_message'); }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-500 relative">

                {/* --- HEADER --- */}
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4 text-indigo-600 dark:text-indigo-400">
                        {verificationStep ? <CheckCircle size={32}/> : (isSignUp ? <UserPlus size={32} /> : <LogIn size={32} />)}
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {verificationStep ? 'Vérification' : (isSignUp ? 'Créer un compte' : 'Bon retour')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        {verificationStep
                            ? `Un code a été envoyé à ${email}`
                            : (isSignUp ? 'Rejoignez FollowTrade et suivez vos performances' : 'Connectez-vous pour accéder à votre journal')}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-pulse">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {/* --- VUE VÉRIFICATION (CODE) --- */}
                {verificationStep ? (
                    <form onSubmit={handleVerifySubmit} className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-center gap-2">
                            {verificationCode.map((digit, idx) => (
                                <input
                                    key={idx}
                                    ref={el => inputRefs.current[idx] = el}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className="w-12 h-12 text-center text-xl font-bold bg-white dark:bg-black border border-gray-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
                                />
                            ))}
                        </div>

                        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                            {loading ? 'Validation...' : 'Valider le compte'}
                        </button>

                        <div className="text-center pt-2">
                            <button type="button" onClick={handleBackToEdit} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-2 mx-auto transition-colors">
                                <ArrowLeft size={16}/> Je me suis trompé d'email
                            </button>
                        </div>
                    </form>
                ) : (
                    /* --- VUE NORMALE (LOGIN / REGISTER) --- */
                    <form onSubmit={handleAuth} className="space-y-4">
                        {isSignUp && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="relative"><User className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="text" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} required /></div>
                                <div className="relative"><User className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="text" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} required /></div>
                            </div>
                        )}

                        <div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required /></div>
                        <div className="relative"><Lock className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required /></div>

                        {isSignUp && (
                            <div className="relative animate-in slide-in-from-top-2 fade-in duration-300"><Lock className="absolute left-3 top-3.5 text-gray-400" size={18} /><input type="password" placeholder="Confirmer mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} ${confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`} required /></div>
                        )}

                        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                            {loading ? 'Chargement...' : isSignUp ? <><UserPlus size={18} /> S'inscrire</> : <><LogIn size={18} /> Se connecter</>}
                        </button>
                    </form>
                )}

                {!verificationStep && (
                    <div className="mt-6 text-center">
                        <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;