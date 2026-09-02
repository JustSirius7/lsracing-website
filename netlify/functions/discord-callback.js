exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;
  const state = event.queryStringParameters.state || 'prenota';
  
  const allowedPages = {
    'candidati': 'candidati.html',
    'ruota': 'ruota.html',
    'prenota': 'prenota.html'
  };
  const targetPage = allowedPages[state] || 'prenota.html';

  const CLIENT_ID = "1525515077283876994";
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = "https://lsracing.top/.netlify/functions/discord-callback";
  const GUILD_ID = "1524524329566736474";
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const API_ENDPOINT = "https://discord.com/api/v10";

  if (!code) {
    return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=no_code` }, body: "" };
  }

  try {
    const tokenRes = await fetch(`${API_ENDPOINT}/oauth2/token`, {
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
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=token_fallito` }, body: "" };
    }

    const userRes = await fetch(`${API_ENDPOINT}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const memberRes = await fetch(`${API_ENDPOINT}/guilds/${GUILD_ID}/members/${userData.id}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });

    if (memberRes.status === 200) {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?autenticato=true` }, body: "" };
    } else {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=non_nel_server` }, body: "" };
    }
  } catch (err) {
    return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=server` }, body: "" };
  }
};