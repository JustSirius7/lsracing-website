document.addEventListener("DOMContentLoaded", function() {
    const footerHTML = `
    <footer class="site-footer">
        <div class="container footer-container">
            
            <!-- Colonna Info / Brand -->
            <div class="footer-col footer-brand">
                <img src="assets/img/logo-navbar.webp" alt="LS Racing Logo" class="footer-logo">
                <p>L'officina ufficiale e punto di riferimento per il tuning e l'elaborazione veicoli in città. Passione, qualità e performance senza compromessi.</p>
            </div>

            <!-- Colonna Link Rapidi -->
            <div class="footer-col">
                <h3>Link Rapidi</h3>
                <ul class="footer-links">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="team.html">Il Team</a></li>
                    <li><a href="faq.html">Termini & FAQ</a></li>
                    <li><a href="candidati.html">Lavora con Noi</a></li>
                    <li><a href="prenota.html">Prenota Appuntamento</a></li>
                </ul>
            </div>

            <!-- Colonna Contatti & Social -->
            <div class="footer-col">
                <h3>Community</h3>
                <p>Unisciti al nostro server Discord ufficiale per rimanere aggiornato sugli eventi e richiedere assistenza.</p>
                <a href="https://discord.gg/tuolink" target="_blank" class="footer-discord-btn">
                    <i class="fa-brands fa-discord"></i> Unisciti a Discord
                </a>
            </div>

        </div>

        <!-- Copyright / Sottopancia -->
        <div class="footer-bottom">
            <div class="container footer-bottom-flex">
                <p>&copy; 2026 LS Racing - Tutti i diritti riservati. Progetto Roleplay indipendente e non affiliato a Rockstar Games / Take-Two Interactive.</p>
                <p class="footer-credits">Design Fiery Edition</p>
            </div>
        </div>
    </footer>
    `;

    const footerContainer = document.getElementById("footer");
    if (footerContainer) {
        footerContainer.innerHTML = footerHTML;
    }
});