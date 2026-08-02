/* ==========================================
   GESTIONE EFFETTI SONORI CON FILE AUDIO
========================================== */
const audioClick = new Audio("assets/audio/click.wav");
const audioEngine = new Audio("assets/audio/engine.wav");

audioClick.volume = 0.4;
audioEngine.volume = 0.5;

function playClickSound() {
    audioClick.currentTime = 0;
    audioClick.play().catch(() => {});
}

function playEngineRevSound() {
    audioEngine.currentTime = 0; 
    audioEngine.play().catch(() => {});
}

/* ==========================================
   LOGICA DELLA GALLERIA E DEI FILTRI
========================================== */
const galleryGrid = document.getElementById("galleryGrid");
const filterButtons = document.querySelectorAll(".gallery-filters button");

let elementi = [];
let elementiFiltrati = [];

const photoCounter = document.getElementById("photoCounter");

async function caricaGalleria(){
    const response = await fetch("data/gallery.json");
    elementi = await response.json();

    // Aggiorna il contatore escludendo i video se preferisci contare solo le foto, o contando tutto
    const soloFoto = elementi.filter(el => el.type !== "video");
    if(photoCounter) {
        photoCounter.textContent = soloFoto.length;
    }

    // Di default all'avvio carichiamo la categoria "tutorial" oppure "all" se vuoi le foto. 
    // Visto che il primo bottone è Tutorial, partiamo mostrando i tutorial o le foto. 
    // Impostiamo il filtro iniziale sul primo bottone attivo:
    const primoFotogramma = document.querySelector(".gallery-filters button.active");
    const filtroIniziale = primoFotogramma ? primoFotogramma.dataset.filter : "tutorial";
    
    mostraElementi(filtroIniziale);
}

function mostraElementi(categoria){
    galleryGrid.innerHTML = "";

    // Filtra in base alla categoria selezionata
    elementiFiltrati = elementi.filter(el => el.category === categoria);

    elementiFiltrati.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "gallery-card";

        // Se è un video, creiamo il box con l'iframe incorporato direttamente
        if (item.type === "video") {
            // Convertiamo eventuale link vimeo standard in embed se necessario, o usiamo l'url diretto
            let embedUrl = item.url;
            if(embedUrl.includes("vimeo.com/") && !embedUrl.includes("/embed/")) {
                const vimeoId = embedUrl.split("/").pop().split("?")[0];
                embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
            }

            card.innerHTML = `
                <div style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
                    <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                </div>
                <div class="gallery-overlay" style="position: relative; margin-top: 10px; background: transparent; padding: 10px 0;">
                    <h3 style="color: #fff; font-size: 1.1rem;">${item.title}</h3>
                    <p style="color: #aaa; font-size: 0.85rem; margin-top: 5px;">${item.description}</p>
                </div>
            `;
        } else {
            // Se è un'immagine normale
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h3>${item.title}</h3>
                    <span>${item.category}</span>
                </div>
            `;

            card.addEventListener("click", () => {
                apriLightbox(index);
            });
        }

        galleryGrid.appendChild(card);
    });
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        playEngineRevSound(); 

        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        mostraElementi(button.dataset.filter);
    });
});

caricaGalleria();

/* ==========================================
   LOGICA DELLA LIGHTBOX (MODAL)
========================================== */
let indiceCorrente = 0;

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxDescription = document.getElementById("lightboxDescription");
const lightboxCounter = document.getElementById("lightboxCounter");
const lightboxCategory = document.getElementById("lightboxCategory");

const btnClose = document.querySelector(".lightbox-close");
const btnPrev = document.querySelector(".lightbox-prev");
const btnNext = document.querySelector(".lightbox-next");

function apriLightbox(index){
    const item = elementiFiltrati[index];
    if (item.type === "video") return; // I video non aprono la lightbox

    playEngineRevSound(); 
    indiceCorrente = index;
    aggiornaLightbox();
    lightbox.classList.add("show");
}

function aggiornaLightbox(){
    const item = elementiFiltrati[indiceCorrente];
    if(!item || item.type === "video") return;

    lightboxImage.src = item.image;
    lightboxTitle.textContent = item.title;
    lightboxDescription.textContent = item.description;

    if (lightboxCounter) {
        // Calcoliamo l'indice escludendo i video se mescolati
        lightboxCounter.textContent = `${indiceCorrente + 1} / ${elementiFiltrati.length}`;
    }

    if (lightboxCategory) {
        lightboxCategory.textContent = item.category;
    }
}

function chiudiLightbox(){
    lightbox.classList.remove("show");
}

function precedente(){
    indiceCorrente--;
    if(indiceCorrente < 0){
        indiceCorrente = elementiFiltrati.length - 1;
    }
    if(elementiFiltrati[indiceCorrente].type === "video") precedente(); // salta i video nella lightbox
    else aggiornaLightbox();
}

function successiva(){
    indiceCorrente++;
    if(indiceCorrente >= elementiFiltrati.length){
        indiceCorrente = 0;
    }
    if(elementiFiltrati[indiceCorrente].type === "video") successiva(); // salta i video nella lightbox
    else aggiornaLightbox();
}

if(btnClose) {
    btnClose.addEventListener("click", () => {
        playClickSound();
        chiudiLightbox();
    });
}

if(btnPrev) {
    btnPrev.addEventListener("click", () => {
        playClickSound();
        precedente();
    });
}

if(btnNext) {
    btnNext.addEventListener("click", () => {
        playClickSound();
        successiva();
    });
}

if(lightbox) {
    lightbox.addEventListener("click", e => {
        if(e.target === lightbox){
            playClickSound();
            chiudiLightbox();
        }
    });
}

document.addEventListener("keydown", e => {
    if(!lightbox || !lightbox.classList.contains("show")) return;

    if(e.key === "Escape") {
        playClickSound();
        chiudiLightbox();
    }

    if(e.key === "ArrowLeft") {
        playClickSound();
        precedente();
    }

    if(e.key === "ArrowRight") {
        playClickSound();
        successiva();
    }
});

/* ==========================================
   GESTIONE SWIPE PER DISPOSITIVI MOBILI
========================================== */
let touchStartX = 0;
let touchEndX = 0;

if(lightbox) {
    lightbox.addEventListener("touchstart", e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener("touchend", e => {
        touchEndX = e.changedTouches[0].screenX;
        gestisciSwipe();
    }, { passive: true });
}

function gestisciSwipe() {
    const sogliaMinima = 40;
    const differenza = touchEndX - touchStartX;

    if (differenza < -sogliaMinima) {
        playClickSound();
        successiva();
    }

    if (differenza > sogliaMinima) {
        playClickSound();
        precedente();
    }
}