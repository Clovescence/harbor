import sqlite3
import os

DB_FILE = "sequoia.db"

def get_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cursor = conn.cursor()
    
    # Create journal entries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL
        )
    ''')
    
    # Check if journal is empty
    cursor.execute("SELECT COUNT(*) FROM journal_entries")
    if cursor.fetchone()[0] == 0:
        # Seed with initial data
        entries = [
            ("Initial System Boot", "The Sequoia OS has been initialized. Environment variables loaded, atmosphere rendered.", "2026-09-22"),
            ("Field Observation", "Water systems seem stable despite recent weather fluctuations.", "2026-09-20"),
            ("Design Notes", "Typography needs to feel more like a printed book than a digital screen. Adjusting kerning.", "2026-09-18")
        ]
        cursor.executemany("INSERT INTO journal_entries (title, content, date) VALUES (?, ?, ?)", entries)
        conn.commit()

    # Create VFS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vfs_nodes (
            path TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            content TEXT
        )
    ''')

    # Seed VFS if empty
    cursor.execute("SELECT COUNT(*) FROM vfs_nodes")
    if cursor.fetchone()[0] == 0:
        initial_vfs = [
            ("/", "dir", ""),
            ("/archive", "dir", ""),
            ("/system", "dir", ""),
            ("/journal", "dir", ""),
            ("/readme.txt", "file", "Welcome to Sequoia OS. Navigate using 'ls', 'cd', and 'cat'. Try 'theme matrix'."),
            ("/archive/project_alpha.txt", "file", "Project Alpha: A study on water as a way into systems. Abandoned 2025."),
            ("/archive/blueprint.dat", "file", "01001000 01100001 01100111 01100001"),
            ("/system/config.sys", "file", "THEME=auto\nAUDIO=enabled\nGL=active"),
            ("/system/kernel.log", "file", "[OK] Boot sequence initialized.\n[WARN] Connection unstable."),
            ("/journal/entry_001.txt", "file", "It started raining today. The system responds as expected."),
            ("/journal/entry_002.txt", "file", "I found an old photograph. The frame is distorted.")
        ]
        cursor.executemany("INSERT INTO vfs_nodes (path, type, content) VALUES (?, ?, ?)", initial_vfs)
        conn.commit()
    
    conn.close()

def get_journal_entries():
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM journal_entries ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(ix) for ix in rows]

# --- VFS FUNCTIONS ---

def vfs_ls(cwd: str):
    conn = get_conn()
    cursor = conn.cursor()
    prefix = cwd if cwd == "/" else cwd + "/"
    # Find direct children
    cursor.execute("SELECT path, type FROM vfs_nodes WHERE path LIKE ?", (prefix + "%",))
    nodes = cursor.fetchall()
    conn.close()
    
    children = []
    for node in nodes:
        sub = node['path'][len(prefix):]
        # Only take direct children (no slashes in sub path)
        if "/" not in sub and sub != "":
            children.append(sub)
    return sorted(children)

def vfs_cat(path: str):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM vfs_nodes WHERE path = ? AND type = 'file'", (path,))
    node = cursor.fetchone()
    conn.close()
    return node['content'] if node else None

def vfs_is_dir(path: str):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT type FROM vfs_nodes WHERE path = ?", (path,))
    node = cursor.fetchone()
    conn.close()
    return node and node['type'] == 'dir'

def vfs_mkdir(path: str):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO vfs_nodes (path, type, content) VALUES (?, 'dir', '')", (path,))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

def vfs_touch(path: str):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO vfs_nodes (path, type, content) VALUES (?, 'file', '')", (path,))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

def vfs_write(path: str, content: str):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT type FROM vfs_nodes WHERE path = ?", (path,))
    node = cursor.fetchone()
    if not node:
        # Create it if it doesn't exist
        cursor.execute("INSERT INTO vfs_nodes (path, type, content) VALUES (?, 'file', ?)", (path, content))
        success = True
    elif node['type'] == 'file':
        cursor.execute("UPDATE vfs_nodes SET content = ? WHERE path = ?", (content, path))
        success = True
    else:
        success = False # It's a dir
    conn.commit()
    conn.close()
    return success

if __name__ == "__main__":
    init_db()
    print("Database initialized.")

