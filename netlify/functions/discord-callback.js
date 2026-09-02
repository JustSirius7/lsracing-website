exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;
  const state = event.queryStringParameters.state || 'prenota';[cite: 3]
  
  // Mappa gli stati consentiti alle rispettive pagine HTML
  const allowedPages = {
    'candidati': 'candidati.html',
    'ruota': 'ruota.html',
    'prenota': 'prenota.html'
  };
  const targetPage = allowedPages[state] || 'prenota.html';

  const CLIENT_ID = "1525515077283876994";[cite: 3]
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;[cite: 3]
  const REDIRECT_URI = "https://lsracing.top/.netlify/functions/discord-callback";[cite: 3]
  const GUILD_ID = "1524524329566736474";[cite: 3]
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;[cite: 3]
  const API_ENDPOINT = "https://discord.com/api/v10";[cite: 3]

  if (!code) {
    return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=no_code` }, body: "" };[cite: 3]
  }

  try {
    const tokenRes = await fetch(`${API_ENDPOINT}/oauth2/token`, {[cite: 3]
      method: 'POST',
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokenData = await tokenRes.json();[cite: 3]

    if (!tokenData.access_token) {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=token_fallito` }, body: "" };[cite: 3]
    }

    const userRes = await fetch(`${API_ENDPOINT}/users/@me`, {[cite: 3]
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();[cite: 3]

    const memberRes = await fetch(`${API_ENDPOINT}/guilds/${GUILD_ID}/members/${userData.id}`, {[cite: 3]
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });

    if (memberRes.status === 200) {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?autenticato=true` }, body: "" };[cite: 3]
    } else {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=non_nel_server` }, body: "" };[cite: 3]
    }
  } catch (err) {
    return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=server` }, body: "" };[cite: 3]
  }
};