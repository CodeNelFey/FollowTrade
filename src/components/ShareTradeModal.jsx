import React, { useRef, useState } from 'react';
import { X, Download, Share2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import html2canvas from 'html2canvas';

const ShareTradeModal = ({ isOpen, onClose, trade, currencySymbol }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen || !trade) return null;

    const isWin = parseFloat(trade.profit) >= 0;
    const pnlColor = isWin ? 'text-emerald-400' : 'text-rose-400';
    const bgGradient = isWin
        ? 'from-emerald-900/40 via-neutral-900 to-neutral-950'
        : 'from-rose-900/40 via-neutral-900 to-neutral-950';

    const handleDownload = async () => {
        setIsGenerating(true);
        if (cardRef.current) {
            try {
                const canvas = await html2canvas(cardRef.current, {
                    backgroundColor: '#000000',
                    scale: 2, // Meilleure qualité
                });
                const link = document.createElement('a');
                link.download = `trade-${trade.pair}-${trade.date}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (err) {
                console.error("Erreur génération image", err);
            }
        }
        setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-neutral-900 w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">

                {/* Header Modal */}
                <div className="p-4 flex justify-between items-center border-b border-white/5">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Share2 size={18} className="text-indigo-500" /> Partager le Trade
                    </h3>
                    <button onClick={onClose}><X className="text-gray-500 hover:text-white" /></button>
                </div>

                {/* --- LA CARTE À PARTAGER (Ce qui sera capturé) --- */}
                <div className="p-6 flex justify-center bg-neutral-950">
                    <div
                        ref={cardRef}
                        className={`w-full aspect-[4/5] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between border border-white/10 bg-gradient-to-br ${bgGradient}`}
                    >
                        {/* Background Noise/Pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                        {/* Header Carte */}
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trading Journal</span>
                                <h2 className="text-3xl font-black text-white mt-1">{trade.pair}</h2>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${trade.type === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {trade.type}
                                </span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
                                {isWin ? <TrendingUp size={24} className="text-emerald-400" /> : <TrendingDown size={24} className="text-rose-400" />}
                            </div>
                        </div>

                        {/* Résultats */}
                        <div className="relative z-10 text-center my-8">
                            <div className={`text-5xl font-black ${pnlColor} drop-shadow-lg`}>
                                {isWin ? '+' : ''}{parseFloat(trade.profit).toFixed(2)}
                                <span className="text-2xl ml-1">{currencySymbol}</span>
                            </div>
                            <div className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-wide">Profit / Perte</div>
                        </div>

                        {/* Détails Techniques */}
                        <div className="relative z-10 grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                <span className="text-gray-500 block mb-1">Entrée</span>
                                <span className="text-white font-mono font-bold">{trade.entry}</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                <span className="text-gray-500 block mb-1">Sortie</span>
                                <span className="text-white font-mono font-bold">{trade.exit}</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                <span className="text-gray-500 block mb-1">Date</span>
                                <span className="text-white font-bold">{trade.date}</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                <span className="text-gray-500 block mb-1">Discipline</span>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`h-1.5 w-full rounded-full ${i < (trade.disciplineScore / 20) ? (isWin ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-gray-700'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Logo */}
                        <div className="relative z-10 mt-auto pt-6 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <span className="text-[10px] text-gray-500">Généré par</span>
                                <div className="text-sm font-bold text-white flex items-center gap-1">
                                    <Wallet size={14} className="text-indigo-500" /> Mon Journal Pro
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-600 italic">
                                #TradingDiscipline
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-neutral-900 border-t border-white/5">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Génération...' : <><Download size={18} /> Télécharger l'image</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareTradeModal;