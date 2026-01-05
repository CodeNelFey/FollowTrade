export const SESSIONS = {
    ASIA: { start: 0, end: 8, name: "Asie" },
    LONDON: { start: 8, end: 16, name: "Londres" },
    NY: { start: 13, end: 22, name: "New York" }
};

const TOLERANCE = 0.2; // Tolérance stricte

const getContractSize = (pair) => {
    if (!pair) return 100000;
    const p = pair.toUpperCase();
    if (p.includes('XAU') || p.includes('GOLD')) return 100;
    if (p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NDX')) return 1;
    if (p.includes('JPY')) return 1000;
    return 100000;
};

// Vérification STRICTE : Doit être proche de la cible (pas juste en dessous)
export const checkRiskCompliance = (riskPct, targetRisk) => {
    if (!riskPct || !targetRisk) return false; // Faux si pas de données
    return Math.abs(riskPct - targetRisk) <= TOLERANCE;
};

export const checkRRCompliance = (rr, targetRR) => {
    if (!rr || !targetRR) return false;
    return Math.abs(rr - targetRR) <= TOLERANCE;
};

export const calculateDisciplineScore = (tradeData, account, currentBalance) => {
    let score = 0;
    const breakdown = { plan: 0, risk: 0, sl: 0, time: 0, doc: 0 };

    // Si pas de solde, impossible de juger le risque -> 0 points sur le risque pour éviter les faux positifs 100%
    if (!account || !currentBalance || currentBalance <= 0) {
        // On donne quand même des points pour le reste si c'est rempli
        // Mais on force Risk à 0.
    } else {
        const entry = parseFloat(tradeData.entry);
        const sl = parseFloat(tradeData.sl);
        const tp = parseFloat(tradeData.tp);
        const lot = parseFloat(tradeData.lot);
        const targetRiskPct = parseFloat(account.max_risk) || 2.0;
        const targetRR = parseFloat(account.default_rr) || 2.0;

        // 1. RISQUE (Strict)
        if (entry && sl && lot) {
            const contractSize = getContractSize(tradeData.pair);
            const riskAmount = Math.abs(entry - sl) * lot * contractSize;
            const calculatedRiskPct = (riskAmount / currentBalance) * 100;

            if (checkRiskCompliance(calculatedRiskPct, targetRiskPct)) {
                score += 25;
                breakdown.risk = 25;
            }
        }

        // 2. PLAN / RR (Strict)
        let planOk = false;
        if (entry && sl && tp) {
            const riskDist = Math.abs(entry - sl);
            const rewardDist = Math.abs(tp - entry);
            if (riskDist > 0) {
                const calculatedRR = rewardDist / riskDist;
                if (checkRRCompliance(calculatedRR, targetRR)) {
                    score += 35;
                    breakdown.plan = 35;
                    planOk = true;
                }
            }
        } else if (!tp && breakdown.risk > 0) {
            // Pas de TP mais risque OK = moitié des points plan
            score += 15;
            breakdown.plan = 15;
        }
    }

    // 3. SL
    if (parseFloat(tradeData.sl) > 0 && !tradeData.slMoved) {
        score += 20;
        breakdown.sl = 20;
    }

    // 4. TIMING
    let hour = 12;
    if (tradeData.time) hour = parseInt(tradeData.time.split(':')[0]);
    else if (tradeData.date) { const d = new Date(tradeData.date); if (!isNaN(d.getTime())) hour = d.getHours(); }

    let inSession = (hour >= SESSIONS.ASIA.start && hour < SESSIONS.ASIA.end) || (hour >= SESSIONS.LONDON.start && hour < SESSIONS.LONDON.end) || (hour >= SESSIONS.NY.start && hour < SESSIONS.NY.end);
    if (inSession) { score += 10; breakdown.time = 10; }

    // 5. DOC
    let docScore = 0;
    const hasTags = tradeData.tags && tradeData.tags.length > 0;
    if (hasTags) docScore += 5;
    if (tradeData.hasScreenshot) docScore += 5;
    score += docScore; breakdown.doc = docScore;

    return { total: score, details: breakdown };
};

export const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 70) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 50) return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
    return 'text-rose-500 bg-rose-100 dark:bg-rose-900/30';
};