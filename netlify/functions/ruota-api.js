const fetch = require('node-fetch');

// Lista di ticket validi (puoi aggiornarla qui o gestirla)
const validTickets = {
    "TICKET-L1K230": false,
    "TICKET-ABC123": false
};

const WEBHOOK_URL = "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK";

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: "Metodo non consentito" }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { action, discordId, codice, premio } = body;

        // Azione 1: Verifica del Ticket
        if (action === 'verify') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            
            if (!(ticketClean in validTickets)) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Codice ticket inesistente." }) };
            }
            if (validTickets[ticketClean]) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Questo ticket è già stato utilizzato!" }) };
            }

            // Segna come usato
            validTickets[ticketClean] = true;
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "Ticket valido!" }) };
        }

        // Azione 2: Salvataggio Vincita e Invio Webhook a Discord
        if (action === 'win') {
            const payload = {
                embeds: [{
                    "title": "🎡 Ruota della Fortuna - Nuova Vincita!",
                    "description": `L'utente con ID <@${discordId}> ha girato la ruota e ha vinto:`,
                    "color": 16753920,
                    "fields": [
                        {"name": "🎁 Premio Ottenuto", "value": `**${premio}**`, "inline": false}
                    ],
                    "footer": {"text": "LS Racing • Sistema Automatico Officina"}
                }]
            };

            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            return { statusCode: 200, body: JSON.stringify({ success: true }) };
        }

        return { statusCode: 400, body: JSON.stringify({ success: false, message: "Azione non valida" }) };

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: "Errore interno del server" }) };
    }
};