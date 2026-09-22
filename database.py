import sqlite3
import os

DB_FILE = "sequoia.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
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
    
    # Check if empty
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
    
    conn.close()

def get_journal_entries():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM journal_entries ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(ix) for ix in rows]

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
