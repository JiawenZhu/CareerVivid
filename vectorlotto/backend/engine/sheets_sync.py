"""
sheets_sync.py — Sync Mega Millions predictions to Google Sheets.

Usage (standalone):
    python3.13 sheets_sync.py                   # sync all runs in predictions.json
    python3.13 sheets_sync.py --run-id <id>     # sync a single run

Called automatically by predictor.py after saving predictions.json.

Authentication:
    Uses `gws` CLI (Google Workspace CLI) — no Python OAuth needed.
    One-time setup:
        gws auth login -s drive,gmail,sheets

Sheet layout (one sheet tab = "Predictions"):
    RunID | CreatedAt | TargetDraw | Strategy | Ticket# | N1-N5 | MB
          | Budget | Spent($) | Won($) | NetROI($) | θA | θB | θC | θD
"""

import json
import subprocess
import sys
import argparse
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
PREDICTIONS_FILE = Path(__file__).parent / "predictions.json"

SPREADSHEET_NAME = "Mega Millions Predictions"
SHEET_NAME       = "Predictions"

HEADER = [
    "RunID", "CreatedAt", "TargetDraw",
    "Strategy", "Ticket#",
    "N1", "N2", "N3", "N4", "N5", "MegaBall",
    "Budget($)", "Spent($)", "Won($)", "NetROI($)",
    "θ_A-hot", "θ_B-cold", "θ_C-random", "θ_D-hybrid",
]


# ── gws helpers ───────────────────────────────────────────────────────────────

def _gws(args: list[str], body: dict | None = None) -> dict | None:
    """Run a gws command, return parsed JSON or None on error."""
    cmd = ["gws"] + args
    if body:
        cmd += ["--json", json.dumps(body)]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        out = result.stdout.strip()
        if not out:
            return {}
        data = json.loads(out)
        if "error" in data and "spreadsheetId" not in data:
            # gws wraps real errors in {"error": {...}}
            err = data["error"]
            print(f"   [gws error {err.get('code','')}] {err.get('message','unknown')}")
            return None
        return data
    except subprocess.TimeoutExpired:
        print("   [sheets_sync] gws timed out")
        return None
    except json.JSONDecodeError:
        return {}
    except FileNotFoundError:
        print("   [sheets_sync] 'gws' not found — run: brew install gws")
        return None


def _check_gws() -> bool:
    """Verify gws is installed and authenticated."""
    try:
        result = subprocess.run(
            ["gws", "auth", "status"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            print("\n⚠️  gws auth check failed. Run: gws auth login -s drive,gmail,sheets")
            return False
        status = json.loads(result.stdout)
        if not status.get("token_valid"):
            print("\n⚠️  gws token is invalid. Run: gws auth login -s drive,gmail,sheets")
            return False
        return True
    except (FileNotFoundError, json.JSONDecodeError):
        print("\n⚠️  gws not found. Run: gws auth login -s drive,gmail,sheets")
        return False


# ── Spreadsheet management ────────────────────────────────────────────────────

def _find_spreadsheet() -> str | None:
    """Search Drive for the spreadsheet by name, return its ID or None."""
    data = _gws([
        "drive", "files", "list",
        "--params", json.dumps({
            "q": f'name="{SPREADSHEET_NAME}" and mimeType="application/vnd.google-apps.spreadsheet" and trashed=false',
            "fields": "files(id,name)",
            "pageSize": 5,
        })
    ])
    if data and data.get("files"):
        return data["files"][0]["id"]
    return None


def _create_spreadsheet() -> str | None:
    """Create a new spreadsheet and return its ID."""
    data = _gws(["sheets", "spreadsheets", "create"], body={
        "properties": {"title": SPREADSHEET_NAME},
        "sheets": [{"properties": {"title": SHEET_NAME}}],
    })
    if data and "spreadsheetId" in data:
        sid = data["spreadsheetId"]
        print(f"   📊 Created new spreadsheet: {SPREADSHEET_NAME}")
        # Write header row
        _append_rows(sid, [HEADER])
        # Bold the header via batchUpdate
        _bold_header(sid, data["sheets"][0]["properties"]["sheetId"])
        return sid
    return None


def _bold_header(spreadsheet_id: str, sheet_id: int) -> None:
    _gws(["sheets", "spreadsheets", "batchUpdate",
          "--params", json.dumps({"spreadsheetId": spreadsheet_id})],
         body={"requests": [{
             "repeatCell": {
                 "range": {
                     "sheetId": sheet_id,
                     "startRowIndex": 0, "endRowIndex": 1,
                 },
                 "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
                 "fields": "userEnteredFormat.textFormat.bold",
             }
         }]})


def _ensure_sheet_tab(spreadsheet_id: str) -> None:
    """Add the Predictions tab if it doesn't already exist."""
    data = _gws(["sheets", "spreadsheets", "get",
                 "--params", json.dumps({"spreadsheetId": spreadsheet_id,
                                         "includeGridData": False})])
    if not data:
        return
    existing = [s["properties"]["title"] for s in data.get("sheets", [])]
    if SHEET_NAME not in existing:
        _gws(["sheets", "spreadsheets", "batchUpdate",
              "--params", json.dumps({"spreadsheetId": spreadsheet_id})],
             body={"requests": [{"addSheet": {"properties": {"title": SHEET_NAME}}}]})
        _append_rows(spreadsheet_id, [HEADER])


# ── Sheet read/write ──────────────────────────────────────────────────────────

def _get_existing_run_ids(spreadsheet_id: str) -> set[str]:
    """Read column A (RunID) to detect already-synced runs."""
    data = _gws(["sheets", "spreadsheets", "values", "get",
                 "--params", json.dumps({
                     "spreadsheetId": spreadsheet_id,
                     "range": f"{SHEET_NAME}!A2:A",
                 })])
    if not data:
        return set()
    rows = data.get("values", [])
    return {row[0] for row in rows if row}


def _append_rows(spreadsheet_id: str, rows: list[list]) -> bool:
    """Batch-append rows to the Predictions sheet."""
    data = _gws(["sheets", "spreadsheets", "values", "append",
                 "--params", json.dumps({
                     "spreadsheetId": spreadsheet_id,
                     "range": f"{SHEET_NAME}!A1",
                     "valueInputOption": "USER_ENTERED",
                     "insertDataOption": "INSERT_ROWS",
                 })],
                body={"values": rows})
    return data is not None


# ── Data conversion ───────────────────────────────────────────────────────────

def _run_to_rows(run: dict) -> list[list]:
    """Convert a single prediction-run dict into one sheet row per ticket."""
    run_id     = run.get("run_id", "?")
    created_at = run.get("created_at", "")[:19]
    target     = run.get("target_draw_date", "")
    budget     = run.get("budget", 0)

    summary = run.get("evaluation_summary") or {}
    spent   = summary.get("total_spent", budget * 2)
    won     = summary.get("total_won", 0)
    roi     = won - spent

    weights = run.get("ensemble_weights", {})
    theta   = {k: round(v.get("theta", 0), 4) for k, v in weights.items()}

    rows = []
    for idx, ticket in enumerate(run.get("predictions", []), start=1):
        wb       = ticket.get("wb", [])
        strategy = ticket.get("strategy", "?")
        mb       = ticket.get("mb", "?")
        n1, n2, n3, n4, n5 = (list(wb) + ["", "", "", "", ""])[:5]

        rows.append([
            run_id, created_at, target,
            strategy, idx,
            n1, n2, n3, n4, n5, mb,
            budget, spent, won, roi,
            theta.get("A-hot",    ""),
            theta.get("B-cold",   ""),
            theta.get("C-random", ""),
            theta.get("D-hybrid", ""),
        ])
    return rows


# ── Core sync ─────────────────────────────────────────────────────────────────

def sync_predictions(run_id: str | None = None, verbose: bool = True) -> bool:
    """
    Sync predictions.json → Google Sheets via gws CLI.

    Args:
        run_id:  If given, only sync that specific run.
        verbose: Print progress to stdout.
    Returns:
        True if sync succeeded, False on any error (non-fatal).
    """
    if verbose:
        print("\n📊 Syncing to Google Sheets …")

    # ── Check gws auth ────────────────────────────────────────────────────────
    if not _check_gws():
        return False

    # ── Load predictions ──────────────────────────────────────────────────────
    if not PREDICTIONS_FILE.exists():
        if verbose:
            print("   ⚠️  predictions.json not found — skipping sync")
        return False

    with open(PREDICTIONS_FILE) as f:
        data = json.load(f)

    runs = data if isinstance(data, list) else list(data.values())

    if run_id:
        runs = [r for r in runs if r.get("run_id") == run_id]
        if not runs:
            if verbose:
                print(f"   ⚠️  Run {run_id} not found in predictions.json")
            return False

    # ── Find or create spreadsheet ────────────────────────────────────────────
    sid = _find_spreadsheet()
    if sid:
        _ensure_sheet_tab(sid)
    else:
        sid = _create_spreadsheet()
        if not sid:
            if verbose:
                print("   ❌  Could not create spreadsheet")
            return False

    # ── Deduplicate ───────────────────────────────────────────────────────────
    existing   = _get_existing_run_ids(sid)
    new_runs   = [r for r in runs if r.get("run_id") not in existing]

    if not new_runs:
        if verbose:
            print("   ✅  Sheet already up to date — nothing to add")
        return True

    # ── Append ────────────────────────────────────────────────────────────────
    all_rows = []
    for run in new_runs:
        all_rows.extend(_run_to_rows(run))

    ok = _append_rows(sid, all_rows)
    url = f"https://docs.google.com/spreadsheets/d/{sid}"

    if verbose:
        if ok:
            print(f"   ✅  Added {len(all_rows)} ticket rows ({len(new_runs)} run(s))")
            print(f"   🔗  {url}")
        else:
            print("   ❌  Failed to append rows to sheet")

    return ok


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Sync Mega Millions predictions → Google Sheets (via gws)"
    )
    parser.add_argument("--run-id", help="Sync only this specific run ID")
    args = parser.parse_args()

    ok = sync_predictions(run_id=args.run_id)
    sys.exit(0 if ok else 1)
