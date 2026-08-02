from flask import Flask, redirect, request, session, jsonify
import requests
import os

app = Flask(__name__, static_folder=".", static_url_path="")
app.secret_key = os.getenv("SECRET_KEY", "LS_Racing_Super_Secret_Key_2026!")

# Credenziali Discord
CLIENT_ID = "1525515077283876994"
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI = "https://lsracing.top/callback"
GUILD_ID = "1524524329566736474" 
BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN") 

API_ENDPOINT = "https://discord.com/api/v10"

@app.route("/")
def home():
    # Serve la pagina principale (index.html o prenota.html)
    return app.send_static_file("index.html")

@app.route("/login")
def login():
    # Salva nella sessione la pagina da cui arriva l'utente (default: prenota.html)
    next_page = request.args.get("next", "prenota.html")
    session['next_page'] = next_page

    discord_login_url = f"{API_ENDPOINT}/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify%20guilds.members.read"
    return redirect(discord_login_url)

@app.route("/callback")
def auth_callback():
    code = request.args.get("code")
    target_page = session.pop('next_page', 'prenota.html')

    if not code:
        return redirect(f"https://lsracing.top/{target_page}?errore=no_code")

    # Scambia il codice con l'Access Token
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    response = requests.post(f"{API_ENDPOINT}/oauth2/token", data=data, headers=headers)
    token_json = response.json()
    
    access_token = token_json.get("access_token")
    if not access_token:
        return redirect(f"https://lsracing.top/{target_page}?errore=token_fallito")

    # Ottiene i dati profilo dell'utente
    user_headers = {"Authorization": f"Bearer {access_token}"}
    user_res = requests.get(f"{API_ENDPOINT}/users/@me", headers=user_headers)
    user_data = user_res.json()
    user_id = user_data.get("id")

    # Verifica la presenza nel server Discord tramite il Bot Token
    bot_headers = {"Authorization": f"Bot {BOT_TOKEN}"}
    member_res = requests.get(f"{API_ENDPOINT}/guilds/{GUILD_ID}/members/{user_id}", headers=bot_headers)

    if member_res.status_code == 200:
        session['logged_in'] = True
        session['user_id'] = user_id
        session['username'] = user_data.get('username')
        
        # Reindirizza alla pagina di partenza con successo
        return redirect(f"https://lsracing.top/{target_page}?autenticato=true")
    else:
        # Reindirizza alla pagina di partenza con errore
        return redirect(f"https://lsracing.top/{target_page}?errore=non_nel_server")

if __name__ == "__main__":
    app.run(port=3000, debug=True)