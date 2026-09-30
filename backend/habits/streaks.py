"""Streaks: how many days (daily habits) or weeks (weekly habits) in a row a habit was kept."""
from collections import Counter
from datetime import timedelta

ONE_DAY = timedelta(days=1)
ONE_WEEK = timedelta(days=7)


def _runs(sorted_steps, step):
    """Longest run of consecutive values in sorted_steps (each `step` apart)."""
    longest = run = 0
    previous = None
    for value in sorted_steps:
        run = run + 1 if previous is not None and value - previous == step else 1
        longest = max(longest, run)
        previous = value
    return longest


def _current(done, latest, step):
    """Run ending at `latest`. If `latest` is not done yet, the run ending one step earlier still counts."""
    point = latest if latest in done else latest - step
    count = 0
    while point in done:
        count += 1
        point -= step
    return count


def daily_streaks(done_dates, today):
    """(current, longest) streak in days."""
    return _current(done_dates, today, ONE_DAY), _runs(sorted(done_dates), ONE_DAY)


def weekly_streaks(done_dates, target_days, today):
    """(current, longest) streak in weeks (Monday to Sunday) that reached target_days."""
    per_week = Counter(day - timedelta(days=day.weekday()) for day in done_dates)
    met_weeks = {week for week, count in per_week.items() if count >= target_days}
    this_week = today - timedelta(days=today.weekday())
    return _current(met_weeks, this_week, ONE_WEEK), _runs(sorted(met_weeks), ONE_WEEK)
