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
        const { action, discordId, codice, premio, descrizione, premi, tickets, vincite, operatori, ticket } = body;

        const WEBHOOK_URL = "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK";

        // 1. Recupero di tutti i dati per il pannello Admin
        if (action === 'get-all-data') {
            let savedPremi = await store.get("premi", { type: "json" });
            if (!savedPremi) {
                savedPremi = [
                    { nome: "2.000$ Cash", desc: "Denaro contante", perc: 25, colore: "#d97706", attivo: true },
                    { nome: "Pacco Misterioso", desc: "Premio sorpresa", perc: 25, colore: "#78350f", attivo: true },
                    { nome: "Kit Riparazione", desc: "Oggetti officina", perc: 25, colore: "#b45309", attivo: true },
                    { nome: "VIP Pass", desc: "Accesso prioritario", perc: 25, colore: "#f59e0b", attivo: true }
                ];
                await store.setJSON("premi", savedPremi);
            }

            const savedTickets = await store.get("tickets", { type: "json" }) || [];
            const savedVincite = await store.get("vincite", { type: "json" }) || [];
            const savedOperatori = await store.get("operatori", { type: "json" }) || [];

            return new Response(JSON.stringify({
                success: true,
                premi: savedPremi,
                tickets: savedTickets,
                vincite: savedVincite,
                operatori: savedOperatori
            }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // 2. Solo premi (per la ruota o compatibilità)
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

        // 3. Gestione Ticket (Creazione, Aggiornamento, Eliminazione)
        if (action === 'create-ticket') {
            let savedTickets = await store.get("tickets", { type: "json" }) || [];
            if (ticket) {
                savedTickets.unshift(ticket);
                await store.setJSON("tickets", savedTickets);
            }
            return new Response(JSON.stringify({ success: true, message: "Ticket creato con successo!" }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        if (action === 'update-tickets') {
            if (Array.isArray(tickets)) {
                await store.setJSON("tickets", tickets);
            }
            return new Response(JSON.stringify({ success: true, message: "Tickets aggiornati!" }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // 4. Verifica del Ticket da parte dell'utente sulla Ruota
        if (action === 'verify') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            if (!ticketClean) {
                return new Response(JSON.stringify({ success: false, message: "Inserisci un codice valido." }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            let savedTickets = await store.get("tickets", { type: "json" }) || [];
            const foundTicket = savedTickets.find(t => t.codice === ticketClean);

            if (!foundTicket) {
                return new Response(JSON.stringify({ success: false, message: "Codice ticket inesistente." }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            const residui = foundTicket.giriResidui !== undefined ? foundTicket.giriResidui : foundTicket.giri;
            if (residui <= 0) {
                return new Response(JSON.stringify({ success: false, message: "Questo ticket ha esaurito i giri disponibili!" }), {
                    status: 200, headers: { "Content-Type": "application/json" }
                });
            }

            return new Response(JSON.stringify({ success: true, message: "Ticket valido!", giriResidui: residui }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // 5. Registrazione Vincita, Scalo Giri e Notifica Discord
        if (action === 'win') {
            const ticketClean = codice ? codice.trim().toUpperCase() : '';
            let savedTickets = await store.get("tickets", { type: "json" }) || [];
            let savedVincite = await store.get("vincite", { type: "json" }) || [];

            // Aggiorna i giri residui del ticket usato
            const ticketObj = savedTickets.find(t => t.codice === ticketClean);
            if (ticketObj) {
                if (ticketObj.giriResidui === undefined) ticketObj.giriResidui = ticketObj.giri;
                if (ticketObj.giriResidui > 0) {
                    ticketObj.giriResidui -= 1;
                    if (ticketObj.giriResidui <= 0) ticketObj.stato = 'ESAURITO';
                }
                await store.setJSON("tickets", savedTickets);
            }

            // Aggiunge la vincita allo storico globale del pannello
            const nuovaVincita = {
                player: discordId || "Giocatore",
                premio: premio || "Premio",
                codice: 'WIN-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                ticketUsato: ticketClean || 'N/D',
                stato: 'ATTESA',
                data: new Date().toLocaleDateString(),
                scadenza: new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()
            };
            savedVincite.unshift(nuovaVincita);
            await store.setJSON("vincite", savedVincite);

            // Invio Webhook Discord
            let fieldValue = `**${premio}**`;
            if (descrizione && descrizione.trim() !== "") {
                fieldValue += `\n*${descrizione}*`;
            }

            const payload = {
                embeds: [{
                    "title": "🎡 Ruota della Fortuna - Nuova Vincita!",
                    "description": `L'utente <@${discordId}> ha girato la ruota e ha vinto:`,
                    "color": 16753920,
                    "fields": [
                        {"name": "🎁 Premio Ottenuto", "value": fieldValue, "inline": false},
                        {"name": "🎫 Ticket Utilizzato", "value": ticketClean || "N/D", "inline": true}
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

        // 6. Aggiornamento Storico Vincite (es. segnato come ritirato)
        if (action === 'update-vincite') {
            if (Array.isArray(vincite)) {
                await store.setJSON("vincite", vincite);
            }
            return new Response(JSON.stringify({ success: true, message: "Vincite aggiornate!" }), {
                status: 200, headers: { "Content-Type": "application/json" }
            });
        }

        // 7. Gestione Operatori
        if (action === 'update-operatori') {
            if (Array.isArray(operatori)) {
                await store.setJSON("operatori", operatori);
            }
            return new Response(JSON.stringify({ success: true, message: "Operatori aggiornati!" }), {
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