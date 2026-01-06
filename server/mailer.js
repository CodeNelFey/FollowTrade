const nodemailer = require('nodemailer');

// 1. Configuration du transporteur (Exemple avec GMAIL)
// Si tu utilises Brevo/Resend, les paramètres host/port changeront
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Ton adresse gmail (ex: monprojet@gmail.com)
        pass: process.env.EMAIL_PASS  // Ton MOT DE PASSE D'APPLICATION (pas le mot de passe normal)
    }
});

// 2. Fonction pour envoyer l'email de bienvenue
const sendWelcomeEmail = async (toEmail, firstName) => {
    try {
        const info = await transporter.sendMail({
            from: '"TradingSpace 📈" <ne-pas-repondre@tradingspace.com>', // L'expéditeur
            to: toEmail, // Le destinataire (celui qui s'inscrit)
            subject: "Bienvenue sur TradingSpace !", // Objet
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Bienvenue ${firstName} ! 👋</h1>
                    <p>Nous sommes ravis de vous compter parmi nous.</p>
                    <p>Votre compte a été créé avec succès.</p>
                    <br/>
                    <p>À bientôt sur les marchés,</p>
                    <p><strong>L'équipe TradingSpace</strong></p>
                </div>
            `, // Corps du mail en HTML
        });

        console.log("✅ Email envoyé: %s", info.messageId);
    } catch (error) {
        console.error("❌ Erreur envoi email:", error);
    }
};

module.exports = { sendWelcomeEmail };