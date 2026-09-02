from flask import Flask, redirect, request, session, jsonify
import requests
import os
import sqlite3

app = Flask(__name__, static_folder=".", static_url_path="")
app.secret_key = os.getenv("SECRET_KEY", "LS_Racing_Super_Secret_Key_2026!")

# Credenziali Discord
CLIENT_ID = "1525515077283876994"
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI = "https://lsracing.top/auth/callback"
GUILD_ID = "1524524329566736474" 
BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN") 

# Lista degli ID dei ruoli Discord autorizzati ad accedere al pannello admin
STAFF_ROLE_IDS = [
    "1524541647168208966",
    "1542864747173511230",
    "1524524329629520014"
]

API_ENDPOINT = "https://discord.com/api/v10"

# Configurazione Database e Webhook
DB_PATH = "database.db"  
DISCORD_WEBHOOK_URL = os.getenv("Ruota_della_Fortuna", "https://discord.com/api/webhooks/1544692129530642473/lNf8BNVGfVSeOTMIBe3Rcp083GmMXpRYh-G_TByH6a6hxqu1rm_pBEsfRFPGUmid-8TK")

# Inizializzazione automatica tabelle database all'avvio
with sqlite3.connect(DB_PATH) as conn:
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tickets_ruota (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codice TEXT UNIQUE NOT NULL,
            usato INTEGER DEFAULT 0,
            discord_id TEXT
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS premi_ruota (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descrizione TEXT DEFAULT '',
            percentuale REAL DEFAULT 10.0
        )
    ''')
    conn.commit()

@app.route("/")
def home():
    return app.send_static_file("index.html")

@app.route("/login")
def login():
    next_page = request.args.get("next", "ruota.html")
    session['next_page'] = next_page

    discord_login_url = f"{API_ENDPOINT}/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify%20guilds.members.read"
    return redirect(discord_login_url)

@app.route("/auth/callback")
def auth_callback():
    code = request.args.get("code")
    target_page = session.pop('next_page', 'ruota.html')

    if not code:
        return redirect(f"https://lsracing.top/{target_page}?errore=no_code")

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

    user_headers = {"Authorization": f"Bearer {access_token}"}
    user_res = requests.get(f"{API_ENDPOINT}/users/@me", headers=user_headers)
    user_data = user_res.json()
    user_id = user_data.get("id")

    bot_headers = {"Authorization": f"Bot {BOT_TOKEN}"}
    member_res = requests.get(f"{API_ENDPOINT}/guilds/{GUILD_ID}/members/{user_id}", headers=bot_headers)

    if member_res.status_code == 200:
        session['logged_in'] = True
        session['user_id'] = user_id
        session['username'] = user_data.get('username')
        return redirect(f"https://lsracing.top/{target_page}?autenticato=true")
    else:
        return redirect(f"https://lsracing.top/{target_page}?errore=non_nel_server")

# --- ROTTA PROTETTA ADMIN PREMI ---

@app.route("/admin/premi")
def admin_premi():
    user_id = session.get('user_id')
    if not user_id:
        return redirect("/login?next=admin/premi")
        
    bot_headers = {"Authorization": f"Bot {BOT_TOKEN}"}
    member_res = requests.get(f"{API_ENDPOINT}/guilds/{GUILD_ID}/members/{user_id}", headers=bot_headers)
    
    if member_res.status_code == 200:
        member_data = member_res.json()
        user_roles = member_data.get("roles", [])
        
        if any(role_id in user_roles for role_id in STAFF_ROLE_IDS):
            return app.send_static_file("admin_premi.html")
            
    return "Accesso negato: Non possiedi i permessi di staff necessari per visualizzare questa pagina.", 403

# --- API GESTIONE PREMI RUOTA ---

@app.route('/api/premi', methods=['GET'])
def get_premi():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, descrizione, percentuale FROM premi_ruota")
    righe = cursor.fetchall()
    conn.close()
    
    premi = [
        {
            "id": r[0], 
            "nome": r[1], 
            "descrizione": r[2] or '', 
            "percentuale": r[3] if r[3] is not None else 10.0
        } for r in righe
    ]
    return jsonify({"success": True, "premi": premi})

@app.route('/api/premi/add', methods=['POST'])
def add_premio():
    data = request.json
    nome = data.get('nome', '').strip()
    descrizione = data.get('descrizione', '').strip()
    try:
        percentuale = float(data.get('percentuale', 10.0))
    except ValueError:
        percentuale = 10.0
    
    if not nome:
        return jsonify({"success": False, "message": "Il nome del premio non può essere vuoto."}), 400
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO premi_ruota (nome, descrizione, percentuale) VALUES (?, ?, ?)", (nome, descrizione, percentuale))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Premio aggiunto con successo!"})

@app.route('/api/premi/update/<int:premio_id>', methods=['POST'])
def update_premio(premio_id):
    data = request.json
    nome = data.get('nome', '').strip()
    descrizione = data.get('descrizione', '').strip()
    try:
        percentuale = float(data.get('percentuale', 10.0))
    except ValueError:
        percentuale = 10.0
    
    if not nome:
        return jsonify({"success": False, "message": "Il nome non può essere vuoto."}), 400
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE premi_ruota SET nome = ?, descrizione = ?, percentuale = ? WHERE id = ?", (nome, descrizione, percentuale, premio_id))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Premio aggiornato con successo!"})

@app.route('/api/premi/delete/<int:premio_id>', methods=['POST'])
def delete_premio(premio_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM premi_ruota WHERE id = ?", (premio_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Premio eliminato."})

# --- ROTTE PER LA RUOTA DELLA FORTUNA ---

@app.route('/api/check-session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"logged_in": False, "ticket_verified": False})
    
    ticket_verified = session.get('ticket_verified', False)
    return jsonify({"logged_in": True, "ticket_verified": ticket_verified})

@app.route('/api/verify-ticket', methods=['POST'])
def verify_ticket():
    data = request.json
    codice = data.get('codice', '').strip().upper()
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "Devi effettuare prima il login con Discord!"}), 401

    if not os.path.exists(DB_PATH):
        return jsonify({"success": False, "message": "Database non trovato sul server."}), 500

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, usato FROM tickets_ruota WHERE codice = ?", (codice,))
    ticket = cursor.fetchone()
    
    if not ticket:
        conn.close()
        return jsonify({"success": False, "message": "Codice ticket inesistente."})
    
    if ticket[1] == 1:
        conn.close()
        return jsonify({"success": False, "message": "Questo ticket è già stato utilizzato!"})
    
    cursor.execute(
        "UPDATE tickets_ruota SET usato = 1, discord_id = ? WHERE codice = ?",
        (user_id, codice)
    )
    conn.commit()
    conn.close()
    
    session['ticket_verified'] = True
    
    return jsonify({"success": True, "message": "Ticket valido! Gira la ruota."})

@app.route('/api/save-win', methods=['POST'])
def save_win():
    data = request.json
    premio = data.get('premio')
    user_id = session.get('user_id')
    username = session.get('username', 'Utente')
    
    if not user_id or not session.get('ticket_verified'):
        return jsonify({"success": False, "message": "Accesso non autorizzato o nessun ticket attivo."}), 401

    # 1. Invio Webhook al canale log eventi
    payload = {
        "embeds": [{
            "title": "🎡 Ruota della Fortuna - Nuova Vincita!",
            "description": f"L'utente **{username}** (<@{user_id}>) ha girato la ruota e ha vinto:",
            "color": 16753920,
            "fields": [
                {"name": "🎁 Premio Ottenuto", "value": f"**{premio}**", "inline": False}
            ],
            "footer": {"text": "LS Racing • Sistema Automatico Officina"}
        }]
    }
    
    try:
        requests.post(DISCORD_WEBHOOK_URL, json=payload)
    except Exception as e:
        print("Errore invio webhook:", e)
        
    # 2. Invio Messaggio Privato (DM) all'utente tramite Bot
    try:
        dm_channel_res = requests.post(
            f"{API_ENDPOINT}/users/@me/channels",
            headers={"Authorization": f"Bot {BOT_TOKEN}", "Content-Type": "application/json"},
            json={"recipient_id": user_id}
        )
        if dm_channel_res.status_code == 200:
            channel_id = dm_channel_res.json().get("id")
            requests.post(
                f"{API_ENDPOINT}/channels/{channel_id}/messages",
                headers={"Authorization": f"Bot {BOT_TOKEN}", "Content-Type": "application/json"},
                json={"content": f"🎉 Complimenti! Hai girato la ruota della fortuna di LS Racing e hai vinto: **{premio}**!"}
            )
    except Exception as e:
        print("Errore invio DM:", e)
    
    # 3. Rimuove il flag del ticket dalla sessione per renderlo monouso
    session.pop('ticket_verified', None)
    
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(port=3000, debug=True)