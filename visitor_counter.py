from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, Response

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "visitors.sqlite3"

app = Flask(__name__)
from flask import request

@app.get("/__common_ping")
def __common_ping():
    print("✅ common.js EXECUTED from", request.remote_addr)
    return "ok", 204


# ---------- Helpers ----------
def is_owner():
    return request.remote_addr in ("127.0.0.1", "::1")


def now_utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS visits (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              ts_utc TEXT NOT NULL,
              path TEXT NOT NULL,
              referrer TEXT,
              user_agent TEXT
            )
        """)


# ---------- Routes ----------
@app.route("/track")
def track():
    init_db()
    with db() as c:
        c.execute(
            "INSERT INTO visits (ts_utc, path, referrer, user_agent) VALUES (?,?,?,?)",
            (
                now_utc(),
                request.args.get("path", "/"),
                request.headers.get("Referer"),
                request.headers.get("User-Agent"),
            ),
        )
    return ("", 204)


@app.route("/owner-stats")
def owner_stats():
    if not is_owner():
        return ("Forbidden", 403)

    init_db()
    with db() as c:
        total = c.execute("SELECT COUNT(*) FROM visits").fetchone()[0]

    return jsonify({"visitors": total})


@app.route("/owner-dashboard")
def owner_dashboard():
    if not is_owner():
        return ("Forbidden", 403)

    init_db()
    with db() as c:
        total = c.execute("SELECT COUNT(*) FROM visits").fetchone()[0]
        daily = c.execute("""
            SELECT substr(ts_utc,1,10) AS day, COUNT(*) c
            FROM visits
            GROUP BY day
            ORDER BY day DESC
            LIMIT 14
        """).fetchall()

        last = c.execute("""
            SELECT ts_utc, path
            FROM visits
            ORDER BY id DESC
            LIMIT 20
        """).fetchall()

    html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Owner Dashboard</title>
<style>
body{{background:#0b0b0b;color:#eee;font-family:system-ui;padding:20px}}
.card{{background:#151515;border-radius:16px;padding:16px;margin-bottom:16px}}
h1{{margin-top:0}}
.big{{font-size:36px;color:#ffe600;font-weight:900}}
table{{width:100%;border-collapse:collapse}}
td,th{{padding:6px;border-bottom:1px solid #333;font-size:13px}}
a.btn{{display:inline-block;margin-top:10px;
background:#ffe600;color:#111;
padding:10px 16px;border-radius:999px;
text-decoration:none;font-weight:800}}
</style>
</head>
<body>

<h1>Volleyball – Owner Dashboard</h1>

<div class="card">
  <div>Total Visitors</div>
  <div class="big">{total}</div>
  <a class="btn" href="/">Back to site</a>
</div>

<div class="card">
  <h3>Daily Visits (UTC)</h3>
  <table>
    {''.join(f"<tr><td>{r['day']}</td><td>{r['c']}</td></tr>" for r in daily)}
  </table>
</div>

<div class="card">
  <h3>Last Visits</h3>
  <table>
    {''.join(f"<tr><td>{r['ts_utc']}</td><td>{r['path']}</td></tr>" for r in last)}
  </table>
</div>

</body>
</html>
"""
    return Response(html, mimetype="text/html")


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:fname>")
def static_files(fname):
    return send_from_directory(BASE_DIR, fname)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=8000)
