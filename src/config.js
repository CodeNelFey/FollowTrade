// src/config.js

// Vite détecte automatiquement si on est en "build" (Production) ou en "dev" (Local)
export const BASE_URL = (hostname === 'localhost' || hostname.startsWith('192.168') || hostname.startsWith('10.')) ? `http://${hostname}:3000` : '';
export const config = {
    // 1. L'URL de ton Backend
    // En prod c'est vide (car même domaine), en dev c'est localhost
    API_URL: BASE_URL,

    // 2. Tes IDs Stripe
    STRIPE: {
        // Le système choisit automatiquement le bon ID selon le mode
        PRO_PLAN_ID: isProduction
            ? 'price_1SoR585cfeKwJTEVIK9rQHjx'  // <--- Mets ton ID PROD (Live) ici
            : 'price_1SoRLa5cfeKwJTEVIioxQlt0', // <--- Mets ton ID TEST ici

    }
};