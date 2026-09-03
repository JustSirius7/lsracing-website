const usedTicketsStore = new Set();
const validTicketsStore = new Set(["TICKET-TEST", "TICKET-123"]);

// Lista predefinita dei premi della ruota (modificabile via admin)
let currentPremiStore = [
    { id: 1, nome: "Auto Import", colore: "#d97706" },
    { id: 2, nome: "Denaro Sporco", colore: "#111827" },
    { id: 3, nome: "Arma Speciale", colore: "#b91c1c" },
    { id: 4, nome: "Fullkit 100k", colore: "#1f2937" },
    { id: 5, nome: "Jackpot", colore: "#d97706" },
    { id: 6, nome: "Riprova", colore: "#111827" }
];

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: "Metodo non consentito" }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { action, discordId, codice, premio, premi } = body;

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK";

        // Azione: Restituisce l'elenco dei premi attuali alla pagina della ruota
        if (action === 'get-premi') {
            return { 
                statusCode: 200, 
                body: JSON.stringify({ success: true, premi: currentPremiStore }) 
            };
        }

        // Azione Admin: Aggiornamento dei premi della ruota
        if (action === 'update-premi') {
            if (!Array.isArray(premi) || premi.length === 0) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Lista premi non valida." }) };
            }
            currentPremiStore = premi;
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "Premi aggiornati con successo!" }) };
        }

        // Azione Admin: Creazione nuovo ticket
        if (action === 'create-ticket') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            if (!ticketClean) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Codice non valido." }) };
            }
            
            validTicketsStore.add(ticketClean);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: `Ticket ${ticketClean} creato con successo!` }) };
        }

        // Azione 1: Verifica del Ticket (Monouso)
        if (action === 'verify') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            
            if (!ticketClean) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Inserisci un codice valido." }) };
            }

            // Accetta sia i ticket salvati nello store che qualsiasi codice che inizi per TICKET-
            const isValido = ticketClean.startsWith("TICKET-") || validTicketsStore.has(ticketClean);

            if (!isValido) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Codice ticket inesistente." }) };
            }

            if (usedTicketsStore.has(ticketClean)) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Questo ticket è già stato utilizzato!" }) };
            }

            usedTicketsStore.add(ticketClean);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "Ticket valido!" }) };
        }

        // Azione 2: Salvataggio Vincita e Invio Webhook
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
        return { statusCode: 500, body: JSON.stringify({ success: false, message: "Errore interno: " + err.message }) };
    }
};