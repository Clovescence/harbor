import os
import base64
import json
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import database
import math
import time
import smtplib
from email.message import EmailMessage
import psutil
import asyncio

load_dotenv()

app = FastAPI(title="Sequoia OS Backend")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class ContactForm(BaseModel):
    name: str
    email: str
    message: str

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Sequoia OS Backend is running"}

@app.get("/api/journal")
def get_journal():
    entries = database.get_journal_entries()
    return {"entries": entries}

@app.get("/api/spotify/now-playing")
async def get_spotify_now_playing():
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    refresh_token = os.getenv("SPOTIFY_REFRESH_TOKEN")
    
    if not all([client_id, client_secret, refresh_token]):
        return {"error": "Spotify credentials missing"}
        
    auth_str = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    
    async with httpx.AsyncClient() as client:
        # 1. Get Access Token
        token_res = await client.post(
            "https://accounts.spotify.com/api/token",
            headers={
                "Authorization": f"Basic {auth_str}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token
            }
        )
        
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            return {"error": "Failed to get access token"}
            
        # 2. Get Currently Playing
        track_res = await client.get(
            "https://api.spotify.com/v1/me/player/currently-playing",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if track_res.status_code == 204 or track_res.status_code > 400:
            return {"is_playing": False}
            
        track_data = track_res.json()
        
        # 3. Get Audio Features
        if track_data.get("item") and track_data["item"].get("id"):
            features_res = await client.get(
                f"https://api.spotify.com/v1/audio-features/{track_data['item']['id']}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if features_res.status_code == 200:
                track_data["audio_features"] = features_res.json()
                
        return track_data

@app.get("/api/gl-data")
def get_gl_data():
    # Generate some complex data for WebGL
    # E.g., time-based noise or wave parameters
    t = time.time()
    data = {
        "waveSpeed": 0.5 + math.sin(t * 0.1) * 0.2,
        "waveHeight": 1.5 + math.cos(t * 0.2) * 0.5,
        "colorShift": math.sin(t * 0.05)
    }
    return data

def send_email_background(form: ContactForm):
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")
    
    if not sender_email or not sender_password:
        print("Email credentials missing in .env (EMAIL_USER, EMAIL_PASS). Logged message locally:")
        print(f"From {form.name} ({form.email}): {form.message}")
        return

    msg = EmailMessage()
    msg.set_content(f"Name: {form.name}\\nEmail: {form.email}\\n\\nMessage:\\n{form.message}")
    msg['Subject'] = f"New Contact: {form.name}"
    msg['From'] = sender_email
    msg['To'] = "hagapradiva05@gmail.com"
    msg['Reply-To'] = form.email

    try:
        # Assuming Gmail SMTP for the sender account
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print("Email sent successfully to hagapradiva05@gmail.com")
    except Exception as e:
        print(f"Failed to send email: {e}")

@app.post("/api/contact")
def submit_contact(form: ContactForm, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email_background, form)
    return {"status": "success", "message": "Message received"}



# --- WEBSOCKET DASHBOARD ---
@app.websocket("/ws/dashboard")
async def dashboard_endpoint(websocket: WebSocket):
    await websocket.accept()
    start_time = time.time()
    try:
        while True:
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            uptime = int(time.time() - start_time)
            data = {
                "cpu": cpu,
                "memory_percent": mem.percent,
                "memory_used": mem.used,
                "memory_total": mem.total,
                "uptime": uptime
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Dashboard disconnected")


# --- WEBSOCKET TERMINAL ---
@app.websocket("/ws/terminal")
async def terminal_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text(json.dumps({"type": "boot", "message": "Connection established with Sequoia Kernel."}))
    cwd = "/"
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                # Process command
                parts = data.strip().lower().split()
                if not parts:
                    continue
                    
                cmd = parts[0]
                args = parts[1:]
                response = ""
                
                if cmd == "help":
                    response = "Available commands: help, whoami, status, journal, ls, cd, cat, mkdir, touch, write, theme"
                elif cmd == "whoami":
                    response = "haga_pradiva // guest_user"
                elif cmd == "status":
                    response = "Systems nominal. Weather sync active. Audio link established."
                elif cmd == "journal":
                    entries = database.get_journal_entries()
                    if entries:
                        response = f"Latest Entry: {entries[0]['title']} - {entries[0]['date']}"
                    else:
                        response = "No entries found."
                elif cmd == "ls":
                    children = database.vfs_ls(cwd)
                    if children is not None:
                        response = "  ".join(children) if children else ""
                    else:
                        response = "Directory not found."
                elif cmd == "cd":
                    if not args:
                        cwd = "/"
                        response = cwd
                    else:
                        target = args[0]
                        if target == "..":
                            if cwd != "/":
                                cwd = "/".join(cwd.rstrip("/").split("/")[:-1])
                                if not cwd:
                                    cwd = "/"
                            response = cwd
                        else:
                            new_path = cwd if cwd == "/" else cwd + "/"
                            new_path += target
                            if database.vfs_is_dir(new_path):
                                cwd = new_path
                                response = cwd
                            else:
                                response = f"cd: {target}: No such directory"
                elif cmd == "cat":
                    if not args:
                        response = "cat: missing operand"
                    else:
                        target = args[0]
                        file_path = cwd if cwd == "/" else cwd + "/"
                        file_path += target
                        content = database.vfs_cat(file_path)
                        if content is not None:
                            response = content
                        else:
                            response = f"cat: {target}: No such file"
                elif cmd == "mkdir":
                    if not args:
                        response = "mkdir: missing operand"
                    else:
                        target = args[0]
                        new_path = cwd if cwd == "/" else cwd + "/"
                        new_path += target
                        if database.vfs_mkdir(new_path):
                            response = ""
                        else:
                            response = f"mkdir: cannot create directory '{target}': File exists"
                elif cmd == "touch":
                    if not args:
                        response = "touch: missing operand"
                    else:
                        target = args[0]
                        new_path = cwd if cwd == "/" else cwd + "/"
                        new_path += target
                        if database.vfs_touch(new_path):
                            response = ""
                        else:
                            response = f"touch: cannot touch '{target}': File exists"
                elif cmd == "write":
                    if len(args) < 2:
                        response = "Usage: write <filename> <content...>"
                    else:
                        target = args[0]
                        # Don't lower-case the content
                        raw_parts = data.strip().split(maxsplit=2)
                        if len(raw_parts) >= 3:
                            content = raw_parts[2]
                            content = content.replace("\\n", "\n")
                            new_path = cwd if cwd == "/" else cwd + "/"
                            new_path += target
                            if database.vfs_write(new_path, content):
                                response = f"Written to {target}"
                            else:
                                response = f"write: {target} is a directory"
                        else:
                            response = "Usage: write <filename> <content...>"
                elif cmd == "theme":
                    if not args:
                        response = "Usage: theme [dawn|day|dusk|night|matrix|auto]"
                    else:
                        mode = args[0]
                        if mode in ["dawn", "day", "dusk", "night", "matrix", "auto"]:
                            await websocket.send_text(json.dumps({"type": "theme", "mode": mode}))
                            response = f"Theme set to {mode}"
                        else:
                            response = f"Unknown theme: {mode}"
                else:
                    response = f"Command not found: {cmd}"
                    
                if response:
                    await websocket.send_text(json.dumps({"type": "output", "message": response}))
            except Exception as e:
                await websocket.send_text(json.dumps({"type": "output", "message": f"System Error: {str(e)}"}))
    except WebSocketDisconnect:
        print("Terminal disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
