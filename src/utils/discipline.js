// src/utils/discipline.js

export const SESSIONS = {
    ASIA: { start: 0, end: 8, name: "Asie" },
    LONDON: { start: 8, end: 16, name: "Londres" },
    NY: { start: 13, end: 22, name: "New York" }
};

// --- CONSTANTES DE TOLÉRANCE ---
// Marge d'erreur acceptée (ex: 0.2% pour le risque, 0.2 pour le RR)
const TOLERANCE = 0.2;

// Helper pour taille contrat
const getContractSize = (pair) => {
    if (!pair) return 100000;
    const p = pair.toUpperCase();
    if (p.includes('XAU') || p.includes('GOLD')) return 100;
    if (p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NDX')) return 1;
    if (p.includes('JPY')) return 1000;
    return 100000;
};

// --- FONCTIONS DE VÉRIFICATION STRICTE ---

// Le risque doit être ÉGAL à la cible (pas juste inférieur)
export const checkRiskCompliance = (riskPct, targetRisk) => {
    if (!riskPct || !targetRisk) return true; // Pas de données = pas de faute
    return Math.abs(riskPct - targetRisk) <= TOLERANCE;
};

// Le RR doit être ÉGAL à la cible (pas juste supérieur)
export const checkRRCompliance = (rr, targetRR) => {
    if (!rr || !targetRR) return true;
    return Math.abs(rr - targetRR) <= TOLERANCE;
};

export const calculateDisciplineScore = (tradeData, account, currentBalance) => {
    let score = 0;
    const breakdown = { plan: 0, risk: 0, sl: 0, time: 0, doc: 0 };

    // Si pas de solde, on ne peut pas juger le risque, on donne les points par défaut
    if (!account || !currentBalance || currentBalance <= 0) {
        return { total: 100, details: { plan: 35, risk: 25, sl: 20, time: 10, doc: 10 } };
    }

    const entry = parseFloat(tradeData.entry);
    const sl = parseFloat(tradeData.sl);
    const tp = parseFloat(tradeData.tp);
    const lot = parseFloat(tradeData.lot);

    // Cibles définies dans le compte
    const targetRiskPct = parseFloat(account.max_risk) || 2.0;
    const targetRR = parseFloat(account.default_rr) || 2.0;

    // 1. RISQUE (25 pts)
    let riskOk = false;
    if (entry && sl && lot) {
        const contractSize = getContractSize(tradeData.pair);
        const riskAmount = Math.abs(entry - sl) * lot * contractSize;
        const calculatedRiskPct = (riskAmount / currentBalance) * 100;

        // Vérification stricte
        if (checkRiskCompliance(calculatedRiskPct, targetRiskPct)) {
            score += 25;
            breakdown.risk = 25;
            riskOk = true;
        }
    }

    // 2. PLAN / RR (35 pts)
    if (entry && sl && tp) {
        const riskDist = Math.abs(entry - sl);
        const rewardDist = Math.abs(tp - entry);
        if (riskDist > 0) {
            const calculatedRR = rewardDist / riskDist;
            // Vérification stricte
            if (checkRRCompliance(calculatedRR, targetRR)) {
                score += 35;
                breakdown.plan = 35;
            }
        }
    } else if (!tp && riskOk) {
        // Pas de TP mais risque respecté = moitié des points
        score += 15;
        breakdown.plan = 15;
    }

    // 3. STOP LOSS (20 pts)
    if (sl > 0 && !tradeData.slMoved) {
        score += 20;
        breakdown.sl = 20;
    }

    // 4. TIMING (10 pts)
    let hour = 12;
    if (tradeData.time) hour = parseInt(tradeData.time.split(':')[0]);
    else if (tradeData.date) { const d = new Date(tradeData.date); if (!isNaN(d.getTime())) hour = d.getHours(); }

    let inSession = (hour >= SESSIONS.ASIA.start && hour < SESSIONS.ASIA.end) ||
        (hour >= SESSIONS.LONDON.start && hour < SESSIONS.LONDON.end) ||
        (hour >= SESSIONS.NY.start && hour < SESSIONS.NY.end);

    if (inSession) {
        score += 10;
        breakdown.time = 10;
    }

    // 5. DOC (10 pts)
    let docScore = 0;
    const hasTags = tradeData.tags && tradeData.tags.length > 0;
    if (hasTags) docScore += 5;
    if (tradeData.hasScreenshot) docScore += 5;
    score += docScore;
    breakdown.doc = docScore;

    return { total: score, details: breakdown };
};

export const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 70) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 50) return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
    return 'text-rose-500 bg-rose-100 dark:bg-rose-900/30';
};