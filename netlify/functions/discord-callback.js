exports.handler = async (event, context) => {
  const code = event.queryStringParameters.code;
  const state = event.queryStringParameters.state || 'prenota';
  
  const allowedPages = {
    'candidati': 'candidati.html',
    'ruota': 'ruota.html',
    'prenota': 'prenota.html',
    'admin': 'admin_premi.html'
  };
  const targetPage = allowedPages[state] || 'prenota.html';

  const CLIENT_ID = "1525515077283876994";
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = "https://lsracing.top/.netlify/functions/discord-callback";
  const GUILD_ID = "1524524329566736474";
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const API_ENDPOINT = "https://discord.com/api/v10";

  // Ruoli autorizzati per l'accesso admin
  const STAFF_ROLE_IDS = [
    "1524541647168208966",
    "1542864747173511230",
    "1524524329629520014"
  ];

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
      const memberData = await memberRes.json();
      const userRoles = memberData.roles || [];

      // Se la pagina richiesta è l'admin, verifica che l'utente abbia almeno un ruolo autorizzato
      if (state === 'admin') {
        const hasStaffRole = userRoles.some(roleId => STAFF_ROLE_IDS.includes(roleId));
        if (!hasStaffRole) {
          return { statusCode: 302, headers: { Location: `https://lsracing.top/admin_premi.html?errore=unauthorized` }, body: "" };
        }
      }

      return { 
        statusCode: 302, 
        headers: { Location: `https://lsracing.top/${targetPage}?autenticato=true&discordId=${userData.id}` }, 
        body: "" 
      };
    } else {
      return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=non_nel_server` }, body: "" };
    }
  } catch (err) {
    return { statusCode: 302, headers: { Location: `https://lsracing.top/${targetPage}?errore=server` }, body: "" };
  }
};