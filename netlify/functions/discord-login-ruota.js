<div class="input-group">
    <label for="discordTag">ID DISCORD</label>
    
    <!-- Pulsante di verifica (visibile finché l'utente non ha fatto il login) -->
    <div id="discord-verify-container">
        <a href="/.netlify/functions/discord-login-ruota" style="display: flex; align-items: center; justify-content: center; gap: 8px; background-color: #5865F2; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; transition: background 0.3s; width: 100%;">
            <i class="fa-brands fa-discord"></i> Verifica con Discord
        </a>
    </div>

    <!-- Campo input ID Discord (inizialmente nascosto, viene mostrato, compilato e bloccato dopo il login) -->
    <input 
        type="text" 
        id="discordTag" 
        name="discordTag" 
        style="display: none;" 
        readonly 
        placeholder="12345678912345678"
    >
</div>