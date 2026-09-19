exports.handler = async function(event, context) {
    const clientId = process.env.DISCORD_CLIENT_ID || "IL_TUO_CLIENT_ID";
    // Recupera l'URL del sito dinamico su Netlify o usa localhost per i test locali
    const baseUrl = process.env.URL || "http://localhost:8888";
    const redirectUri = `${baseUrl}/.netlify/functions/discord-callback-ruota`;
    
    const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
    
    return {
        statusCode: 302,
        headers: {
            Location: discordOAuthUrl,
            "Cache-Control": "no-cache"
        },
        body: ""
    };
};