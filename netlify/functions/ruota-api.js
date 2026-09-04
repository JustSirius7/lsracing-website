import { getStore } from "@netlify/blobs";

export const handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: "Metodo non consentito" }) };
    }

    try {
        const store = getStore("fortuna-rp-store");
        const body = JSON.parse(event.body);
        const { action, discordId, codice, premio, descrizione, premi } = body;

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK";

        // 1. Gestione Premi
        if (action === 'get-premi') {
            let savedPremi = await store.get("premi", { type: "json" });
            if (!savedPremi) {
                savedPremi = [
                    { nome: "2.000$ Cash", desc: "Contanti in gioco", perc: 25, colore: "#d97706", attivo: true },
                    { nome: "Pacco Misterioso", desc: "Premio a sorpresa", perc: 25, colore: "#78350f", attivo: true },
                    { nome: "Kit Riparazione", desc: "Oggetti per officina", perc: 25, colore: "#b45309", attivo: true },
                    { nome: "VIP Pass", desc: "Accesso prioritario", perc: 25, colore: "#f59e0b", attivo: true }
                ];
                await store.setJSON("premi", savedPremi);
            }
            return { 
                statusCode: 200, 
                body: JSON.stringify({ success: true, premi: savedPremi }) 
            };
        }

        if (action === 'update-premi') {
            if (!Array.isArray(premi)) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Lista premi non valida." }) };
            }
            await store.setJSON("premi", premi);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "Premi salvati con successo!" }) };
        }

        // 2. Gestione Ticket
        if (action === 'create-ticket') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            if (!ticketClean) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Codice non valido." }) };
            }
            
            let validTickets = await store.get("valid_tickets", { type: "json" }) || ["TICKET-TEST", "TICKET-123"];
            if (!validTickets.includes(ticketClean)) {
                validTickets.push(ticketClean);
                await store.setJSON("valid_tickets", validTickets);
            }

            return { statusCode: 200, body: JSON.stringify({ success: true, message: `Ticket ${ticketClean} creato con successo!` }) };
        }

        // 3. Verifica del Ticket
        if (action === 'verify') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            
            if (!ticketClean) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Inserisci un codice valido." }) };
            }

            let validTickets = await store.get("valid_tickets", { type: "json" }) || ["TICKET-TEST", "TICKET-123"];
            let usedTickets = await store.get("used_tickets", { type: "json" }) || [];

            const isValido = ticketClean.startsWith("TICKET-") || validTickets.includes(ticketClean);

            if (!isValido) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Codice ticket inesistente." }) };
            }

            if (usedTickets.includes(ticketClean)) {
                return { statusCode: 200, body: JSON.stringify({ success: false, message: "Questo ticket è già stato utilizzato!" }) };
            }

            usedTickets.push(ticketClean);
            await store.setJSON("used_tickets", usedTickets);

            return { statusCode: 200, body: JSON.stringify({ success: true, message: "Ticket valido!" }) };
        }

        // 4. Salvataggio Vincita e Webhook Discord
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