// Versione autonoma con premi di default precaricati e sincronizzati
let memoryStorage = [
    { nome: "2.000$ Cash", desc: "Contanti in gioco", perc: 25, colore: "#d97706" },
    { nome: "Pacco Misterioso", desc: "Premio a sorpresa", perc: 25, colore: "#78350f" },
    { nome: "Kit Riparazione", desc: "Oggetti per officina", perc: 25, colore: "#b45309" },
    { nome: "VIP Pass", desc: "Accesso prioritario", perc: 25, colore: "#f59e0b" }
];

const usedTicketsStore = new Set();
const validTicketsStore = new Set(["TICKET-TEST", "TICKET-123"]);

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: "Metodo non consentito" }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { action, discordId, codice, premio, descrizione, premi } = body;

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK";

        // Azione: Restituisce l'elenco dei premi attivi[cite: 5]
        if (action === 'get-premi') {
            return { 
                statusCode: 200, 
                body: JSON.stringify({ success: true, premi: memoryStorage }) 
            };
        }

        // Azione Admin: Salvataggio dei premi[cite: 5]
        if (action === 'update-premi') {
            if (!Array.isArray(premi)) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Lista premi non valida." }) };
            }
            memoryStorage = premi;
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "Premi salvati con successo!" }) };
        }

        // Azione Admin: Creazione nuovo ticket[cite: 5]
        if (action === 'create-ticket') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            if (!ticketClean) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Codice non valido." }) };
            }
            
            validTicketsStore.add(ticketClean);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: `Ticket ${ticketClean} creato con successo!` }) };
        }

        // Azione 1: Verifica del Ticket (Monouso)[cite: 5]
        if (action === 'verify') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            
            if (!ticketClean) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Inserisci un codice valido." }) };
            }

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

        // Azione 2: Salvataggio Vincita e Invio Webhook[cite: 5]
        if (action === 'win') {
            let fieldValue = `**${premio}**`;
            if (descrizione && descrizione.trim() !== "") {
                fieldValue += `\n*${descrizione}*`;
            }

            const payload = {
                embeds: [{
                    "title": "🎡 Ruota della Fortuna - Nuova Vincita!",
                    "description": `L'utente con ID <@${discordId}> ha girato la ruota e ha vinto:`,
                    "color": 16753920,
                    "fields": [
                        {"name": "🎁 Premio Ottenuto", "value": fieldValue, "inline": false}
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