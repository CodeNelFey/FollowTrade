import React from 'react';

const TradingBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 bg-[#0f172a] dark:bg-black transition-colors duration-500">

            {/* 1. FOND DEGRADÉ */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-black"></div>

            {/* 2. GRILLE INFINIE (ANIMÉE) */}
            {/* C'est ici que l'animation 'grid-flow' crée l'effet de mouvement */}
            <div
                className="absolute inset-0 opacity-[0.2] dark:opacity-[0.3] animate-grid-flow"
                style={{
                    backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px', // Correspond à l'animation CSS
                    transform: 'perspective(500px) rotateX(60deg) scale(2.5)',
                    transformOrigin: 'bottom center',
                    maskImage: 'linear-gradient(to top, black 20%, transparent 90%)', // Fondu propre vers l'horizon
                    WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent 90%)'
                }}
            ></div>

            {/* 3. BLOBS DE COULEUR (FLOTTANTS) */}
            <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob opacity-40"></div>
            <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000 opacity-40"></div>
            <div className="absolute top-[20%] left-[30%] w-[40vw] h-[40vw] bg-cyan-600/20 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000 opacity-30"></div>

            {/* 4. ÉTOILES (SCINTILLANTES) */}
            <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
            <div className="absolute top-1/4 left-1/3 w-0.5 h-0.5 bg-white rounded-full animate-twinkle animation-delay-2000"></div>
            <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-indigo-300 rounded-full animate-twinkle animation-delay-4000"></div>
            <div className="absolute top-1/2 left-20 w-1.5 h-1.5 bg-white rounded-full blur-[1px] animate-twinkle"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-purple-300 rounded-full animate-twinkle animation-delay-2000"></div>

            {/* 5. ÉLÉMENTS GRAPHIQUES FLOTTANTS */}
            {/* Ligne de Chart */}
            <svg className="absolute top-1/3 left-0 w-full h-96 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M0,200 Q300,300 600,100 T1200,200"
                    fill="none"
                    stroke="url(#gradientLine)"
                    strokeWidth="3"
                    className="animate-float-candle"
                />
                <defs>
                    <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#818cf8" /> {/* Indigo-400 */}
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>

        </div>
    );
};

export default TradingBackground;