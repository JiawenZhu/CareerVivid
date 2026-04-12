#!/usr/bin/env python3
"""
browser_sidecar.py — browser-use agent sidecar for cv agent --jobs

This script is called by the TypeScript BrowserUseAgent tool.
It receives a task + context via stdin as JSON, executes the task
using browser-use + Gemini, and streams progress + result to stdout.

Usage (called by TypeScript, not directly):
  /opt/homebrew/bin/python3.11 browser_sidecar.py < input.json

Input JSON (stdin):
  {
    "task": "Fill out the job application at <url> using my resume: <resume>",
    "api_key": "AIza...",   # Gemini API key
    "model": "gemini-2.0-flash",
    "profile_dir": "/Users/.../.careervivid/browser-session"
  }

Output (stdout, JSON lines):
  {"type": "step", "message": "Navigating to application page..."}
  {"type": "done", "result": "Successfully filled 12 fields."}
  {"type": "error", "message": "Could not find submit button."}
"""

import asyncio
import json
import os
import sys
from pathlib import Path


async def run_agent(task: str, api_key: str, model: str, profile_dir: str) -> str:
    """Run browser-use agent with the given task and Gemini LLM."""
    # Lazy import so startup errors are reported cleanly
    from browser_use import Agent, Browser
    from browser_use.browser.profile import BrowserProfile
    from browser_use.llm.google.chat import ChatGoogle

    def emit(msg_type: str, message: str) -> None:
        """Write a JSON line to stdout for the TypeScript parent to read."""
        print(json.dumps({"type": msg_type, "message": message}), flush=True)

    emit("step", "Initializing browser-use agent...")

    # ── LLM setup ────────────────────────────────────────────────────────────
    llm = ChatGoogle(
        model=model,
        api_key=api_key,
        temperature=0.0,  # deterministic for form filling
    )

    # ── Browser profile ───────────────────────────────────────────────────────
    # Use a dedicated automation profile at ~/.careervivid/browser-session
    # This never conflicts with real Chrome (no profile lock)
    Path(profile_dir).mkdir(parents=True, exist_ok=True)

    # Try real Chrome binary for best site compatibility; fall back to Chromium
    chrome_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ]
    chrome_binary = next((p for p in chrome_paths if Path(p).exists()), None)

    profile = BrowserProfile(
        user_data_dir=profile_dir,
        executable_path=chrome_binary,
        headless=False,
        args=[
            "--no-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-infobars",
            "--start-maximized",
            "--no-first-run",
            "--no-default-browser-check",
        ],
        ignore_https_errors=True,
    )

    browser = Browser(browser_profile=profile)

    # ── Step callback ─────────────────────────────────────────────────────────
    def on_step(step_info):
        """Emit progress updates for each agent step."""
        try:
            action = getattr(step_info, "action", None) or ""
            thought = getattr(step_info, "model_output", None)
            if thought and hasattr(thought, "current_state"):
                state = thought.current_state
                next_goal = getattr(state, "next_goal", "") or ""
                if next_goal:
                    emit("step", f"🤖 {next_goal}")
        except Exception:
            pass  # Step callback errors are non-fatal

    # ── Run the agent ─────────────────────────────────────────────────────────
    emit("step", f"Starting agent with model: {model}")

    agent = Agent(
        task=task,
        llm=llm,
        browser=browser,
        max_actions_per_step=5,
    )

    try:
        result = await agent.run(max_steps=30, on_step_start=on_step)
        final = str(result.final_result() if hasattr(result, "final_result") else result)
        return final
    finally:
        await browser.close()


def main() -> None:
    """Entry point: read JSON from stdin, run agent, emit results."""
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            raise ValueError("No input received on stdin")
        payload = json.loads(raw)
    except Exception as e:
        print(json.dumps({"type": "error", "message": f"Failed to parse input: {e}"}), flush=True)
        sys.exit(1)

    task = payload.get("task", "")
    api_key = payload.get("api_key") or os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY", "")
    model = payload.get("model", "gemini-3.1-flash-lite-preview")
    profile_dir = payload.get("profile_dir") or os.path.expanduser("~/.careervivid/browser-session")

    if not task:
        print(json.dumps({"type": "error", "message": "No task provided"}), flush=True)
        sys.exit(1)

    if not api_key:
        print(json.dumps({
            "type": "error",
            "message": "No Gemini API key found. Set GEMINI_API_KEY or configure via: cv agent config"
        }), flush=True)
        sys.exit(1)

    try:
        result = asyncio.run(run_agent(task, api_key, model, profile_dir))
        print(json.dumps({"type": "done", "result": result}), flush=True)
    except KeyboardInterrupt:
        print(json.dumps({"type": "error", "message": "Agent interrupted by user"}), flush=True)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
