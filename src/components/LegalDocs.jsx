import React, { useState } from 'react';
import { Shield, FileText, Lock, ArrowLeft } from 'lucide-react';

const LegalDocs = ({ onClose, initialTab = 'terms' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    const tabs = [
        { id: 'terms', label: 'CGV & CGU', icon: FileText },
        { id: 'privacy', label: 'Confidentialité (RGPD)', icon: Lock },
        { id: 'legal', label: 'Mentions Légales', icon: Shield },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-gray-50/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
                        </button>
                    )}
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Centre Légal</h2>
                </div>
            </div>

            {/* Navigation des onglets */}
            <div className="px-4 mb-8">
                <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-bold transition-all ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-neutral-800'
                                }`}
                            >
                                <Icon size={16} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenu */}
            <div className="px-6 md:px-8 text-gray-700 dark:text-gray-300 space-y-8 leading-relaxed text-sm md:text-base">

                {activeTab === 'terms' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Conditions Générales de Vente et d'Utilisation</h3>
                        <p className="opacity-70">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

                        <section className="space-y-2">
                            <h4 className="font-bold text-indigo-500 uppercase text-xs tracking-wider">1. Objet</h4>
                            <p>Les présentes CGV régissent la vente d'abonnements "PRO" et "VIP" sur l'application FollowTrade. L'achat implique l'acceptation sans réserve de ces conditions.</p>
                        </section>

                        <section className="space-y-2">
                            <h4 className="font-bold text-indigo-500 uppercase text-xs tracking-wider">2. Services & Abonnements</h4>
                            <p>Nous proposons des services numériques d'analyse de trading. Les abonnements sont mensuels ou annuels, renouvelables par tacite reconduction.</p>
                        </section>

                        <section className="space-y-2">
                            <h4 className="font-bold text-indigo-500 uppercase text-xs tracking-wider">3. Avertissement sur les risques (AMF/ESMA)</h4>
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
                                Le trading (Forex, Crypto, Indices) comporte un niveau de risque élevé et peut ne pas convenir à tous les investisseurs. FollowTrade est un journal de trading, pas un conseiller financier. Nous ne sommes pas responsables de vos pertes.
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'privacy' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Politique de Confidentialité (RGPD)</h3>

                        <section className="space-y-2">
                            <h4 className="font-bold text-indigo-500 uppercase text-xs tracking-wider">1. Collecte des données</h4>
                            <p>Conformément au RGPD, nous ne collectons que les données strictement nécessaires : Email, Nom (pour le compte), et vos données de trading (pour l'analyse). Ces données sont stockées de manière sécurisée et chiffrée.</p>
                        </section>

                        <section className="space-y-2">
                            <h4 className="font-bold text-indigo-500 uppercase text-xs tracking-wider">2. Vos Droits</h4>
                            <p>Vous disposez d'un droit d'accès, de modification et de suppression de vos données ("Droit à l'oubli"). Vous pouvez exercer ce droit directement depuis les Paramètres ou en nous contactant.</p>
                        </section>
                    </div>
                )}

                {activeTab === 'legal' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mentions Légales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Éditeur du site</h4>
                                <ul className="text-sm space-y-1">
                                    <li>Nom : FollowTrade</li>
                                    <li>Adresse : 29 Avenue de la Cholière, 44700, Orvault</li>
                                    <li>Contact : sohan.birotheau@gmail.com</li>
                                    <li>SIRET : [NUMÉRO SIRET SI APPLICABLE]</li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Hébergement</h4>
                                <ul className="text-sm space-y-1">
                                    <li>Hébergeur : Sohan BIROTHEAU</li>
                                    <li>Localisation des données : France</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalDocs;