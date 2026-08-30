exports.handler = async (event, context) => {
  const CLIENT_ID = "1525515077283876994";
  const REDIRECT_URI = "https://lsracing.top/.netlify/functions/discord-callback";
  const API_ENDPOINT = "https://discord.com/api/v10";

  const discordUrl = `${API_ENDPOINT}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.members.read&state=prenota`;

  return {
    statusCode: 302,
    headers: { Location: discordUrl, "Cache-Control": "no-cache" },
    body: ""
  };
};