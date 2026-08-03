// ==========================================
// CONFIGURAZIONE WEBHOOK DISCORD
// Sostituisci questo link con l'URL del tuo Webhook Discord segreto
// ==========================================
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1532795703368220746/3xKge7Er4SG3LVsNkfmQRN86470Lwu7Ica_VzeJnIdBb93zdGdhQLqqggMnfp5ipj4eT";

/* ==========================================
   GESTIONE INVIO FORM A DISCORD VIA WEBHOOK
========================================== */
document.addEventListener("DOMContentLoaded", function () {
    const bookingForm = document.getElementById("bookingForm");
    const statusMessage = document.getElementById("statusMessage");
    const btnSubmit = document.getElementById("btnSubmit");

    if (!bookingForm) return;

    bookingForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Disabilita il pulsante durante l'invio per evitare clic multipli
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Invio in corso...`;

        // Raccolta dei dati dai campi del modulo
        const nome = document.getElementById("nomeCliente").value.trim();
        const discord = document.getElementById("discordTag").value.trim();
        const veicolo = document.getElementById("veicolo").value.trim();
        const targa = document.getElementById("targa").value.trim();
        const servizio = document.getElementById("servizio").value;
        const dataApp = document.getElementById("dataApp").value;
        const oraApp = document.getElementById("oraApp").value;
        const note = document.getElementById("note").value.trim() || "Nessuna nota aggiuntiva.";

        // Formattazione data in formato italiano (GG/MM/AAAA)
        let dataFormattata = dataApp;
        if (dataApp) {
            const partiData = dataApp.split("-");
            if (partiData.length === 3) {
                dataFormattata = `${partiData[2]}/${partiData[1]}/${partiData[0]}`;
            }
        }

        // Formattazione Tag / Menzione (IDENTICA A CANDIDATI.JS)
        // Se l'utente inserisce solo cifre (ID numerico), lo trasforma in <@ID>
        const isNumericID = /^\d+$/.test(discord);
        const discordFormatted = isNumericID ? `<@${discord}>` : `\`${discord}\``;

        // Struttura Embed elegante per Discord
        const discordPayload = {
            username: "Los Santos Customs - Prenotazioni",
            avatar_url: "https://imgur.com/bubsL2s.png", // Opzionale: URL di un'icona/logo
            embeds: [
                {
                    title: "🛠️ NUOVA PRENOTAZIONE OFFICINA",
                    description: "È stata ricevuta una nuova richiesta di appuntamento dal sito web.",
                    color: 43775, // Colore azzurro (#00AAFF) in formato decimale
                    fields: [
                        {
                            name: "👤 Cliente / RP",
                            value: nome,
                            inline: true
                        },
                        {
                            name: "💬 ID Discord",
                            value: discordFormatted,
                            inline: true
                        },
                        {
                            name: "🚘 Veicolo",
                            value: veicolo,
                            inline: true
                        },
                        {
                            name: "🏷️ Targa",
                            value: targa,
                            inline: true
                        },
                        {
                            name: "🔧 Servizio Richiesto",
                            value: servizio,
                            inline: false
                        },
                        {
                            name: "📅 Data & Ora Richiesta",
                            value: `${dataFormattata} alle ore ${oraApp}`,
                            inline: false
                        },
                        {
                            name: "📝 Note Aggiuntive",
                            value: note,
                            inline: false
                        }
                    ],
                    footer: {
                        text: "Los Santos Customs • Booking System"
                    },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        try {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(discordPayload)
            });

            if (response.ok || response.status === 204) {
                statusMessage.className = "status-message success";
                statusMessage.innerHTML = `<i class="fa-solid fa-circle-check"></i> Prenotazione inviata con successo! Ti contatteremo su Discord per la conferma.`;
                bookingForm.reset();
            } else {
                throw new Error("Risposta del server non valida.");
            }
        } catch (error) {
            console.error("Errore nell'invio del Webhook:", error);
            statusMessage.className = "status-message error";
            statusMessage.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Si è verificato un errore durante l'invio. Riprova o contattaci direttamente su Discord.`;
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Invia Prenotazione`;
        }
    });
});