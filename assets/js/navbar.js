document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("components/navbar.html");

        if (!response.ok) {
            throw new Error("Impossibile caricare la navbar.");
        }

        const html = await response.text();

        // Inserisce l'HTML nella pagina
        document.getElementById("navbar").innerHTML = html;

        // --- ATTIVAZIONE MENU MOBILE (HAMBURGER) ---
        // Lo attiviamo ORA che l'HTML è stato inserito con successo
        const hamburger = document.getElementById("navHamburger");
        const navLinks = document.getElementById("navLinks");

        if (hamburger && navLinks) {
            hamburger.addEventListener("click", function () {
                navLinks.classList.toggle("active");
                
                // Cambia l'icona da "barre" (☰) a "X" quando il menu si apre/chiude
                const icon = hamburger.querySelector("i");
                if (icon) {
                    icon.classList.toggle("fa-bars");
                    icon.classList.toggle("fa-xmark");
                }
            });
        }

    } catch (error) {
        console.error(error);
    }
});