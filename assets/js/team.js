document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("data/team.json");
        const membri = await response.json();

        const counter = document.querySelector(".number");

        if (counter) {
            counter.textContent = membri.length.toString().padStart(2, "0");
        }

        const proprieta = document.getElementById("proprieta");
        const direzione = document.getElementById("direzione");
        const officina = document.getElementById("officina");

        proprieta.innerHTML = `
            <h2 class="team-title">PROPRIETÀ</h2>
            <div class="team-owner"></div>
        `;

        direzione.innerHTML = `
            <h2 class="team-title">DIREZIONE</h2>
            <div class="team-management"></div>
        `;

        officina.innerHTML = `
            <h2 class="team-title">OFFICINA</h2>
            <div class="team-grid"></div>
        `;

        const owner = proprieta.querySelector(".team-owner");
        const management = direzione.querySelector(".team-management");
        const grid = officina.querySelector(".team-grid");

        membri.forEach(membro => {

            const card = document.createElement("div");
            card.className = `member-card ${membro.sezione}`;

            card.innerHTML = `
                <img src="${membro.foto}" alt="${membro.nome}">
                <h3>${membro.nome}</h3>
                <p>${membro.ruolo}</p>
            `;

            switch (membro.sezione) {

                case "proprieta":
                    owner.appendChild(card);
                    break;

                case "direzione":
                    management.appendChild(card);
                    break;

                case "officina":
                    grid.appendChild(card);
                    break;
            }
        });

    } catch (err) {
        console.error(err);
    }
});