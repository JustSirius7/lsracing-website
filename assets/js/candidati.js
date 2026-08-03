// ==========================================
// CONFIGURAZIONE WEBHOOK DISCORD (CANDIDATURE)
// ==========================================
const DISCORD_WEBHOOK_URL_CANDIDATI = "https://discord.com/api/webhooks/1532480049494757397/8H2LbSHfhtwWvNTxMXbltUTvdLMHXIsErCxUY57ipg3GTAfvw-5jRgDXFoFjzcyZcRI6";

document.addEventListener("DOMContentLoaded", function () {
    const candidateForm = document.getElementById("candidateForm");
    const statusMessage = document.getElementById("statusMessage");
    const btnSubmit = document.getElementById("btnSubmit");

    if (!candidateForm) return;

    candidateForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Verifica che sia stata selezionata almeno una fascia oraria
        const fasceSelezionate = Array.from(document.querySelectorAll('input[name="fasceOrarie"]:checked'))
                                      .map(cb => cb.value);

        if (fasceSelezionate.length === 0) {
            statusMessage.className = "status-message error";
            statusMessage.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Seleziona almeno una fascia oraria disponibile.`;
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Invio candidatura...`;

        // Raccolta dati OOC
        const nomeOOC = document.getElementById("nomeOOC").value.trim();
        const etaOOC = document.getElementById("etaOOC").value.trim();
        const discord = document.getElementById("discordTag").value.trim();
        
        // Raccolta dati IC
        const nomeIC = document.getElementById("nomeIC").value.trim();
        const etaIC = document.getElementById("etaIC").value.trim();
        
        // Raccolta Esperienza e Disponibilità
        const esperienza = document.getElementById("esperienza").value;
        const motivazione = document.getElementById("motivazione").value.trim();
        const oreGiornaliere = document.getElementById("oreGiornaliere").value.trim();

        // Formattazione per la menzione cliccabile
        // Se contiene solo numeri (ID Discord), crea la menzione <@ID>, altrimenti formatta il testo
        const isNumericID = /^\d+$/.test(discord);
        const discordFormatted = isNumericID ? `<@${discord}>` : `**${discord}**`;

        // Payload Discord (Opzione A con menzione diretta)
        const discordPayload = {
            username: "Los Santos Customs - Candidature",
            avatar_url: "https://imgur.com/aThmXcC.png",
            // Se è un ID numerico, invia anche una notifica diretta sopra l'embed
            content: isNumericID ? `📩 **Nuova Candidatura da:** <@${discord}>` : null,
            embeds: [
                {
                    title: "📋 NUOVA CANDIDATURA RICEVUTA",
                    description: "È stata inviata una nuova candidatura dal sito web.",
                    color: 15844367, // Colore Oro (#F1C40F)
                    fields: [
                        {
                            name: "👤 Dati OOC",
                            value: `**Nome:** ${nomeOOC}\n**Età:** ${etaOOC} anni\n**Tag / ID Discord:** ${discordFormatted}`,
                            inline: false
                        },
                        {
                            name: "🪪 Dati IC",
                            value: `**Nome Personaggio:** ${nomeIC}\n**Età IC:** ${etaIC} anni`,
                            inline: false
                        },
                        {
                            name: "🧠 Esperienza RP",
                            value: esperienza,
                            inline: false
                        },
                        {
                            name: "📝 Motivazione",
                            value: motivazione,
                            inline: false
                        },
                        {
                            name: "⏰ Fasce Orarie",
                            value: fasceSelezionate.join(", "),
                            inline: true
                        },
                        {
                            name: "⏳ Ore Giornaliere",
                            value: oreGiornaliere,
                            inline: true
                        }
                    ],
                    footer: {
                        text: "Los Santos Customs • Recruitment System"
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        try {
            const response = await fetch(DISCORD_WEBHOOK_URL_CANDIDATI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(discordPayload)
            });

            if (response.ok || response.status === 204) {
                statusMessage.className = "status-message success";
                statusMessage.innerHTML = `<i class="fa-solid fa-circle-check"></i> Candidatura inviata con successo! Ti contatteremo su Discord.`;
                candidateForm.reset();
            } else {
                throw new Error("Errore risposta server");
            }
        } catch (error) {
            console.error("Errore Invio Candidatura:", error);
            statusMessage.className = "status-message error";
            statusMessage.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Impossibile inviare la candidatura. Riprova più tardi o contatta lo staff.`;
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Invia Candidatura`;
        }
    });
});