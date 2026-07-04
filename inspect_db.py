import sqlite3

db_path = r"C:\Users\JaZeR\OneDrive\Desktop\Projects\App - Pallates\generated\palettes.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

for name, sql in tables:
    print(f"Table: {name}")
    print(f"SQL: {sql}\n")
conn.close()
