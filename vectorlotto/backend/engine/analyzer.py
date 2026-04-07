import pandas as pd
import sys
from utils import load_history, calculate_frequency, calculate_overdue


def main():
    try:
        df = load_history()
    except FileNotFoundError:
        print("Error: megamillions_history.csv not found. Please run scraper.py first.", file=sys.stderr)
        return

    if df.empty:
        print("Data is empty.")
        return

    wb_counts, mb_counts = calculate_frequency(df)
    wb_last_seen, mb_last_seen = calculate_overdue(df)

    # --- Frequency Analysis ---
    hot_wbs = wb_counts.most_common(5)
    cold_wbs = sorted(wb_counts.items(), key=lambda x: x[1])[:5]

    hot_mbs = mb_counts.most_common(3)
    cold_mbs = sorted(mb_counts.items(), key=lambda x: x[1])[:3]

    # --- Overdue Analysis ---
    overdue_wbs = sorted(wb_last_seen.items(), key=lambda x: x[1], reverse=True)[:5]
    overdue_mbs = sorted(mb_last_seen.items(), key=lambda x: x[1], reverse=True)[:3]

    # --- Report ---
    print("=" * 40)
    print("MEGA MILLIONS STATISTICAL ANALYSIS")
    print(f"Total draws analyzed: {len(df)}")
    print(f"Latest draw: {df['DrawDate'].iloc[0].strftime('%Y-%m-%d')}")
    print("=" * 40)

    print("\n--- FREQUENCY (HOT/COLD) ---")
    print("Hot White Balls:")
    for num, count in hot_wbs:
        print(f"  {num} (drawn {count} times)")

    print("\nCold White Balls:")
    for num, count in cold_wbs:
        print(f"  {num} (drawn {count} times)")

    print("\nHot Mega Balls:")
    for num, count in hot_mbs:
        print(f"  {num} (drawn {count} times)")

    print("\nCold Mega Balls:")
    for num, count in cold_mbs:
        print(f"  {num} (drawn {count} times)")

    print("\n--- OVERDUE ANALYSIS ---")
    print("Most Overdue White Balls:")
    for num, days in overdue_wbs:
        if days < 999:
            print(f"  {num} (last seen {days} days ago)")
        else:
            print(f"  {num} (never seen in history window)")

    print("\nMost Overdue Mega Balls:")
    for num, days in overdue_mbs:
        if days < 999:
            print(f"  {num} (last seen {days} days ago)")
        else:
            print(f"  {num} (never seen in history window)")

    print("\nDisclaimer: Lottery is random. Past performance does not predict future results.")


if __name__ == "__main__":
    main()
