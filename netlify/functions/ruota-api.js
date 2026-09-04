import { getStore } from "@netlify/blobs";

export default async (req) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, message: "Metodo non consentito" }), {
            status: 405,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const store = getStore({ name: "fortuna-rp-store", consistency: "strong" });
        const body = await req.json();
        const { action, discordId, codice, premio, descrizione, premi } = body;

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK";

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
            return new Response(JSON.stringify({ success: true, premi: savedPremi }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        if (action === 'update-premi') {
            if (!Array.isArray(premi)) {
                return new Response(JSON.stringify({ success: false, message: "Lista premi non valida." }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }
            await store.setJSON("premi", premi);
            return new Response(JSON.stringify({ success: true, message: "Premi salvati con successo!" }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        if (action === 'create-ticket') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            if (!ticketClean) {
                return new Response(JSON.stringify({ success: false, message: "Codice non valido." }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }
            
            let validTickets = await store.get("valid_tickets", { type: "json" }) || ["TICKET-TEST", "TICKET-123"];
            if (!validTickets.includes(ticketClean)) {
                validTickets.push(ticketClean);
                await store.setJSON("valid_tickets", validTickets);
            }

            return new Response(JSON.stringify({ success: true, message: `Ticket ${ticketClean} creato con successo!` }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        if (action === 'verify') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            
            if (!ticketClean) {
                return new Response(JSON.stringify({ success: false, message: "Inserisci un codice valido." }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            let validTickets = await store.get("valid_tickets", { type: "json" }) || ["TICKET-TEST", "TICKET-123"];
            let usedTickets = await store.get("used_tickets", { type: "json" }) || [];

            const isValido = ticketClean.startsWith("TICKET-") || validTickets.includes(ticketClean);

            if (!isValido) {
                return new Response(JSON.stringify({ success: false, message: "Codice ticket inesistente." }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            if (usedTickets.includes(ticketClean)) {
                return new Response(JSON.stringify({ success: false, message: "Questo ticket è già stato utilizzato!" }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            usedTickets.push(ticketClean);
            await store.setJSON("used_tickets", usedTickets);

            return new Response(JSON.stringify({ success: true, message: "Ticket valido!" }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

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

            return new Response(JSON.stringify({ success: true }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: false, message: "Azione non valida" }), {
            status: 400, headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, message: "Errore interno: " + err.message }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
};