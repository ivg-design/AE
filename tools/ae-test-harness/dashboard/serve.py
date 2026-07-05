#!/usr/bin/env python3
"""
serve.py — zero-dependency static server for the AE Test Harness dashboard.

Same spirit as ~/.claude/tools/wf-dashboard.py: Python 3 stdlib only
(http.server), no build step, self-hosted. It serves the dashboard front-end
plus the harness data/asset/source files the page needs to fetch and import.

Usage:
    python3 dashboard/serve.py                 # port 8790
    python3 dashboard/serve.py --port 9000

Then open http://localhost:<port>/ .

----------------------------------------------------------------------------
ROUTE MAP (all read-only GET; resolved relative to the harness root)
----------------------------------------------------------------------------
  /                              -> dashboard/index.html
  /index.html /app.js /style.css-> dashboard/<file>
  /data/index.json              -> dashboard/data/index.json        (manifest)
  /data/*                       -> dashboard/data/*
  /assets/ui/<name>.png         -> dashboard/assets/ui/<name>.png   (screenshots)
  /assets/*                     -> dashboard/assets/*
  /capability/<name>.model.json -> capability/<name>.model.json
  /capability/<name>.render.json-> capability/<name>.render.json
  /src/expr-eval/index.mjs      -> src/expr-eval/index.mjs          (ESM import)
  /src/expr-eval/*              -> src/expr-eval/*                  (sub-modules)

Everything is confined to the four whitelisted base directories below; any
path that escapes them (via .. or symlink) is rejected with 403.
----------------------------------------------------------------------------
"""
import argparse
import mimetypes
import os
import posixpath
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, unquote

# --- path anchors -----------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))            # .../dashboard
HARNESS_ROOT = os.path.dirname(HERE)                         # .../ae-test-harness
DASHBOARD_DIR = HERE

# Whitelisted base dirs the server is allowed to read from. Each request URL
# prefix maps to exactly one of these; nothing else is reachable.
DATA_DIR = os.path.join(DASHBOARD_DIR, "data")
ASSETS_DIR = os.path.join(DASHBOARD_DIR, "assets")
CAPABILITY_DIR = os.path.join(HARNESS_ROOT, "capability")
EXPR_EVAL_DIR = os.path.join(HARNESS_ROOT, "src", "expr-eval")

# Dashboard's own static files (served from the dashboard dir root).
STATIC_FILES = {"index.html", "app.js", "style.css"}

mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("application/json", ".json")


def _safe_join(base, rel):
    """Join base + a URL-relative path, refusing anything that escapes base."""
    rel = rel.lstrip("/")
    # Normalize using posix semantics, collapse any .. segments.
    norm = posixpath.normpath("/" + rel).lstrip("/")
    full = os.path.realpath(os.path.join(base, norm))
    base_real = os.path.realpath(base)
    if full != base_real and not full.startswith(base_real + os.sep):
        return None
    return full


def resolve(url_path):
    """Map a URL path to (abs_file_path | None, status).

    Returns (path, 200) when a whitelisted file resolves, (None, 403) on an
    escape attempt, (None, 404) when nothing matches.
    """
    p = url_path

    if p == "/" or p == "":
        return os.path.join(DASHBOARD_DIR, "index.html"), 200

    # Dashboard static files, e.g. /app.js
    name = p.lstrip("/")
    if name in STATIC_FILES:
        return os.path.join(DASHBOARD_DIR, name), 200

    table = (
        ("/data/", DATA_DIR),
        ("/assets/", ASSETS_DIR),
        ("/capability/", CAPABILITY_DIR),
        ("/src/expr-eval/", EXPR_EVAL_DIR),
    )
    for prefix, base in table:
        if p.startswith(prefix):
            full = _safe_join(base, p[len(prefix):])
            if full is None:
                return None, 403
            return full, 200

    return None, 404


class Handler(BaseHTTPRequestHandler):
    server_version = "ae-harness-dashboard/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s - %s\n" % (self.address_string(), fmt % args))

    def _err(self, code, msg):
        body = (msg + "\n").encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urlparse(self.path)
        path = unquote(url.path)
        target, status = resolve(path)

        if status == 403:
            return self._err(403, "403 forbidden")
        if status == 404 or target is None:
            return self._err(404, "404 not found: %s" % path)
        if not os.path.isfile(target):
            # Missing data/render/screenshot files are normal early in the
            # pipeline; 404 lets the front-end degrade gracefully.
            return self._err(404, "404 not found: %s" % path)

        try:
            with open(target, "rb") as fh:
                body = fh.read()
        except OSError as e:
            return self._err(500, "500 read error: %s" % e)

        ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/json", "text/javascript"):
            ctype += "; charset=utf-8"

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        # No-cache so the dashboard always reflects the latest pipeline output.
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


def main():
    ap = argparse.ArgumentParser(description="AE Test Harness dashboard server")
    ap.add_argument("--port", type=int,
                    default=int(os.environ.get("AE_DASH_PORT", "8790")))
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print("ae-harness dashboard -> http://%s:%d/" % (args.host, args.port))
    print("  dashboard : %s" % DASHBOARD_DIR)
    print("  data      : %s" % DATA_DIR)
    print("  capability: %s" % CAPABILITY_DIR)
    print("  expr-eval : %s" % EXPR_EVAL_DIR)
    print("  assets    : %s" % ASSETS_DIR)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
