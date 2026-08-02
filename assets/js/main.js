// Scroll al Team
const teamButton = document.getElementById("teamButton");

if (teamButton) {
    teamButton.addEventListener("click", function () {

        const teamSection = document.getElementById("team");

        if (teamSection) {
            teamSection.scrollIntoView({
                behavior: "smooth"
            });
        }

    });
}

const teamButton = document.getElementById("teamButton");

if (teamButton) {
    teamButton.addEventListener("click", () => {
        window.location.href = "team.html";
    });
}