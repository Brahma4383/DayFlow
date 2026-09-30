"""
Productivity score for one day (0-100):

    task_completion   = % of tasks due that day that are completed
    habit_completion  = % of habits done that day (a weekly habit also counts once its weekly target is met)
    focus_score       = 1 point per minute of focus completed that day, up to 100

    productivity_score = 50% tasks + 30% habits + 20% focus
"""
from collections import Counter, defaultdict
from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone

from focus.models import FocusSession
from habits.models import Habit, HabitCompletion
from tasks.models import Task

# Share of each part in the final score (adds up to 100)
TASK_WEIGHT = 50
HABIT_WEIGHT = 30
FOCUS_WEIGHT = 20

# Focused minutes for a full focus score (about four 25-minute sessions)
FOCUS_MINUTES_GOAL = 100


def round_half_up(value):
    # Python's round() rounds 72.5 down to 72; this rounds it up to 73 like most calculators
    return int(value + 0.5)


def percent(part, whole):
    """Whole-number percentage. 0 when there is nothing to measure."""
    if whole == 0:
        return 0
    return round_half_up(100 * part / whole)


def count_tasks_due(user, day):
    """Returns (completed, total) for tasks due on `day`."""
    tasks = Task.objects.filter(user=user, due_date=day)
    return tasks.filter(status=Task.Status.COMPLETED).count(), tasks.count()


def count_habits_done(user, day):
    """Returns (done, total) for habits that existed on `day`."""
    habits = Habit.objects.filter(user=user, created_at__date__lte=day).with_progress(day)
    done = sum(
        1 for habit in habits
        if habit.completed_today
        or (habit.frequency == Habit.Frequency.WEEKLY and habit.completions_this_week >= habit.target_days)
    )
    return done, len(habits)


def get_focus_minutes(user, day):
    """Minutes of focus sessions completed on `day`."""
    return FocusSession.objects.filter(
        user=user, status=FocusSession.Status.COMPLETED, end_time__date=day
    ).aggregate(total=Sum('duration'))['total'] or 0


def score_parts(tasks_done, tasks_due, habits_done, habits_total, focus_minutes):
    """The three parts and the final score, from the day's raw numbers."""
    task_completion = percent(tasks_done, tasks_due)
    habit_completion = percent(habits_done, habits_total)
    focus_score = min(100, percent(focus_minutes, FOCUS_MINUTES_GOAL))
    productivity_score = round_half_up(
        (TASK_WEIGHT * task_completion + HABIT_WEIGHT * habit_completion + FOCUS_WEIGHT * focus_score) / 100
    )
    return {
        'task_completion': task_completion,
        'habit_completion': habit_completion,
        'focus_score': focus_score,
        'productivity_score': productivity_score,
    }


def calculate_productivity(user, day=None):
    day = day or timezone.localdate()
    tasks_done, tasks_due = count_tasks_due(user, day)
    habits_done, habits_total = count_habits_done(user, day)
    return score_parts(tasks_done, tasks_due, habits_done, habits_total, get_focus_minutes(user, day))


def productivity_history(user, start, end):
    """
    The same score for every day from start to end, using a few queries for the whole range
    instead of several per day. Also returns the raw numbers behind each day's score.
    """
    days = [start + timedelta(days=offset) for offset in range((end - start).days + 1)]

    tasks_due = defaultdict(lambda: [0, 0])  # day -> [completed, total]
    for due_date, task_status in Task.objects.filter(user=user, due_date__range=(start, end)).values_list(
            'due_date', 'status'):
        tasks_due[due_date][1] += 1
        if task_status == Task.Status.COMPLETED:
            tasks_due[due_date][0] += 1

    tasks_completed = Counter(
        timezone.localdate(moment) for moment in Task.objects.filter(
            user=user, status=Task.Status.COMPLETED, completed_at__date__range=(start, end)
        ).values_list('completed_at', flat=True)
    )

    habits = [
        {'id': habit_id, 'frequency': frequency, 'target': target, 'created': timezone.localdate(created_at)}
        for habit_id, frequency, target, created_at in Habit.objects.filter(user=user).values_list(
            'id', 'frequency', 'target_days', 'created_at')
    ]
    first_week_start = start - timedelta(days=start.weekday())
    ticks = defaultdict(set)  # habit id -> dates ticked
    for habit_id, day in HabitCompletion.objects.filter(
            habit__user=user, completed=True, date__range=(first_week_start, end)).values_list('habit_id', 'date'):
        ticks[habit_id].add(day)

    focus_minutes = Counter()
    for end_time, duration in FocusSession.objects.filter(
            user=user, status=FocusSession.Status.COMPLETED, end_time__date__range=(start, end)
    ).values_list('end_time', 'duration'):
        focus_minutes[timezone.localdate(end_time)] += duration

    history = []
    for day in days:
        week_start = day - timedelta(days=day.weekday())
        existing = [habit for habit in habits if habit['created'] <= day]
        habits_done = sum(
            1 for habit in existing
            if day in ticks[habit['id']]
            or (habit['frequency'] == Habit.Frequency.WEEKLY
                and sum(1 for tick in ticks[habit['id']] if week_start <= tick <= day) >= habit['target'])
        )
        done, due = tasks_due[day]
        history.append({
            'date': day.isoformat(),
            'day': day.strftime('%A'),
            **score_parts(done, due, habits_done, len(existing), focus_minutes[day]),
            'tasks_due': due,
            'tasks_done': done,
            'tasks_completed': tasks_completed[day],
            'habits_done': habits_done,
            'habits_total': len(existing),
            'focus_minutes': focus_minutes[day],
        })
    return history
