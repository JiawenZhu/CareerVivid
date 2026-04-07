import os
import pandas as pd
from collections import Counter

# Configuration for paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_history(csv_path: str = None) -> pd.DataFrame:
    """Load and normalize the history CSV, sorted newest first."""
    if csv_path is None:
        csv_path = os.getenv("HISTORY_CSV_PATH", os.path.join(BASE_DIR, "megamillions_history.csv"))
    df = pd.read_csv(csv_path)
    df['DrawDate'] = pd.to_datetime(df['DrawDate'], format='mixed', dayfirst=False)
    df = df.sort_values(by='DrawDate', ascending=False).reset_index(drop=True)
    return df


def calculate_frequency(df: pd.DataFrame) -> tuple[Counter, Counter]:
    """Return (wb_counts, mb_counts) across all draws."""
    white_balls = []
    mega_balls = []

    for _, row in df.iterrows():
        for col in ['WB1', 'WB2', 'WB3', 'WB4', 'WB5']:
            val = row[col]
            if pd.notna(val):
                white_balls.append(int(val))
        mb = row['MegaBall']
        if pd.notna(mb):
            mega_balls.append(int(mb))

    return Counter(white_balls), Counter(mega_balls)


def calculate_overdue(df: pd.DataFrame) -> tuple[dict, dict]:
    """
    Return (wb_last_seen, mb_last_seen) mapping each number to
    how many days ago it was last drawn. Numbers never seen default to 999.
    """
    wb_last_seen: dict[int, int] = {}
    mb_last_seen: dict[int, int] = {}

    # df is sorted newest-first, so first occurrence = most recent draw
    for _, row in df.iterrows():
        days_ago = (pd.Timestamp.now() - row['DrawDate']).days
        for col in ['WB1', 'WB2', 'WB3', 'WB4', 'WB5']:
            val = row[col]
            if pd.notna(val):
                n = int(val)
                if n not in wb_last_seen:
                    wb_last_seen[n] = days_ago
        mb = row['MegaBall']
        if pd.notna(mb):
            n = int(mb)
            if n not in mb_last_seen:
                mb_last_seen[n] = days_ago

    # Fill in numbers never seen in our data window
    for i in range(1, 71):
        wb_last_seen.setdefault(i, 999)
    for i in range(1, 26):
        mb_last_seen.setdefault(i, 999)

    return wb_last_seen, mb_last_seen
