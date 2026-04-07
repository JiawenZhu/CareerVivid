import asyncio
import csv
import os
from datetime import datetime
from playwright.async_api import async_playwright

CSV_FILE = "megamillions_history.csv"
BASE_URL = "https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/Winning_Numbers/index.html"


def load_existing_dates() -> set:
    """Return a set of date strings already in the CSV."""
    if not os.path.exists(CSV_FILE):
        return set()
    existing = set()
    with open(CSV_FILE, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('DrawDate'):
                existing.add(row['DrawDate'].strip())
    return existing


def parse_row(columns_text: list[str]) -> list[str] | None:
    """Parse a list of column text values into [date, wb1..5, mb, mult]."""
    if len(columns_text) < 3:
        return None
    date_text = columns_text[0].strip()
    winning_numbers_text = columns_text[1].strip()
    mega_ball_text = columns_text[2].strip()
    multiplier = columns_text[3].strip() if len(columns_text) >= 4 else ""

    white_balls = [b.strip() for b in winning_numbers_text.split("-")]
    if len(white_balls) != 5:
        return None

    return [date_text] + white_balls + [mega_ball_text, multiplier]


async def scrape_page(page, url: str) -> list[list[str]]:
    """Scrape a single results page and return raw row data."""
    await page.goto(url, wait_until="domcontentloaded")
    rows = page.locator('table.large-only tbody tr')
    count = await rows.count()

    data = []
    for i in range(count):
        row = rows.nth(i)
        columns = row.locator("td")
        num_cols = await columns.count()
        if num_cols < 3:
            continue
        cols_text = [await columns.nth(j).inner_text() for j in range(num_cols)]
        parsed = parse_row(cols_text)
        if parsed:
            data.append(parsed)
    return data


async def scrape_megamillions():
    existing_dates = load_existing_dates()
    print(f"Existing records in CSV: {len(existing_dates)}")

    all_new_rows = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Texas Lottery paginates via ?pagenum=N starting at 1
        # We scrape until we hit only dates we've already seen, or run out of pages
        for page_num in range(1, 20):  # cap at 20 pages (~500 draws)
            if page_num == 1:
                url = BASE_URL
            else:
                url = BASE_URL + f"?pagenum={page_num}"

            print(f"Fetching page {page_num}: {url}")
            rows = await scrape_page(page, url)

            if not rows:
                print(f"  No data found on page {page_num}, stopping.")
                break

            new_on_this_page = 0
            for row in rows:
                date_str = row[0]
                if date_str not in existing_dates:
                    all_new_rows.append(row)
                    existing_dates.add(date_str)
                    new_on_this_page += 1

            print(f"  Found {len(rows)} rows, {new_on_this_page} new.")

            if new_on_this_page == 0:
                print("  All rows on this page already in CSV, stopping.")
                break

        await browser.close()

    if not all_new_rows:
        print("No new draws found. CSV is up to date.")
        return

    # Append new rows (or create file fresh)
    file_exists = os.path.exists(CSV_FILE)
    write_mode = 'a' if file_exists else 'w'
    with open(CSV_FILE, mode=write_mode, newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["DrawDate", "WB1", "WB2", "WB3", "WB4", "WB5", "MegaBall", "Megaplier"])
        writer.writerows(all_new_rows)

    print(f"\nAdded {len(all_new_rows)} new draws to {CSV_FILE}.")


if __name__ == "__main__":
    asyncio.run(scrape_megamillions())
