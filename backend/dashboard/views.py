from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from focus.models import FocusSession
from habits.models import HabitCompletion
from tasks.models import Task
from tasks.serializers import TaskSerializer

from .productivity import calculate_productivity, count_habits_done, get_focus_minutes, productivity_history

MAX_HISTORY_DAYS = 365
RECENT_ACTIVITY_COUNT = 8


class DashboardView(APIView):
    """GET /api/dashboard/ - numbers for the dashboard cards (tasks: all time; the rest: today)."""

    def get(self, request):
        today = timezone.localdate()
        tasks = Task.objects.filter(user=request.user)
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status=Task.Status.COMPLETED).count()
        completed_habits, total_habits = count_habits_done(request.user, today)

        return Response({
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': total_tasks - completed_tasks,
            'total_habits': total_habits,
            'completed_habits': completed_habits,
            'productivity_score': calculate_productivity(request.user, today)['productivity_score'],
            'focus_minutes': get_focus_minutes(request.user, today),
        })


class ProductivityView(APIView):
    """GET /api/dashboard/productivity/ - today's productivity score and its three parts."""

    def get(self, request):
        return Response(calculate_productivity(request.user))


class OverviewView(APIView):
    """
    GET /api/dashboard/overview/ - trends and lists for the dashboard:
    this week vs last week, task status and priority counts, upcoming tasks and recent activity.
    """

    def get(self, request):
        user = request.user
        today = timezone.localdate()
        this_week = (today - timedelta(days=6), today)                          # the last 7 days
        last_week = (today - timedelta(days=13), today - timedelta(days=7))     # the 7 days before
        tasks = Task.objects.filter(user=user)
        open_tasks = tasks.exclude(status=Task.Status.COMPLETED)

        by_status = dict(tasks.values_list('status').annotate(count=Count('id')))
        by_priority = dict(open_tasks.values_list('priority').annotate(count=Count('id')))
        upcoming = open_tasks.filter(due_date__gte=today).order_by('due_date', '-id')[:5]

        return Response({
            'completed_this_week': tasks.filter(completed_at__date__range=this_week).count(),
            'completed_last_week': tasks.filter(completed_at__date__range=last_week).count(),
            'created_this_week': tasks.filter(created_at__date__range=this_week).count(),
            'created_last_week': tasks.filter(created_at__date__range=last_week).count(),
            'due_soon': open_tasks.filter(due_date__range=(today, today + timedelta(days=3))).count(),
            'overdue': open_tasks.filter(due_date__lt=today).count(),
            'status': {value: by_status.get(value, 0) for value in Task.Status.values},
            'open_by_priority': {value: by_priority.get(value, 0) for value in Task.Priority.values},
            'upcoming': TaskSerializer(upcoming, many=True).data,
            'recent_activity': recent_activity(user),
        })


def recent_activity(user):
    """The newest completed tasks, focus sessions and habit ticks, newest first."""
    events = []
    for task in Task.objects.filter(user=user, status=Task.Status.COMPLETED).order_by('-completed_at')[
                :RECENT_ACTIVITY_COUNT]:
        events.append({'type': 'task', 'text': f'Completed "{task.title}"', 'time': task.completed_at})
    for session in FocusSession.objects.filter(user=user).exclude(status=FocusSession.Status.RUNNING).select_related(
            'task').order_by('-end_time')[:RECENT_ACTIVITY_COUNT]:
        what = 'Focused' if session.status == FocusSession.Status.COMPLETED else 'Stopped a focus session'
        on = f' on "{session.task.title}"' if session.task else ''
        minutes = f' for {session.duration} min' if session.status == FocusSession.Status.COMPLETED else ''
        events.append({'type': 'focus', 'text': f'{what}{on}{minutes}', 'time': session.end_time})
    for tick in HabitCompletion.objects.filter(habit__user=user, completed=True).select_related('habit').order_by(
            '-created_at')[:RECENT_ACTIVITY_COUNT]:
        events.append({'type': 'habit', 'text': f'Ticked "{tick.habit.name}"', 'time': tick.created_at})
    events.sort(key=lambda event: event['time'], reverse=True)
    return events[:RECENT_ACTIVITY_COUNT]


class HistoryView(APIView):
    """GET /api/dashboard/history/?days=30 - the productivity score and its numbers for each of the last N days."""

    def get(self, request):
        try:
            days = int(request.query_params.get('days', 30))
        except ValueError:
            days = 0
        if not 1 <= days <= MAX_HISTORY_DAYS:
            return Response({'days': [f'Choose a whole number of days from 1 to {MAX_HISTORY_DAYS}.']},
                            status=status.HTTP_400_BAD_REQUEST)
        today = timezone.localdate()
        return Response(productivity_history(request.user, today - timedelta(days=days - 1), today))


class WeeklyReportView(APIView):
    """GET /api/dashboard/weekly-report/ - productivity score for each day from Monday to today."""

    def get(self, request):
        today = timezone.localdate()
        monday = today - timedelta(days=today.weekday())

        report = []
        for offset in range(today.weekday() + 1):
            day = monday + timedelta(days=offset)
            report.append({
                'date': day.strftime('%A'),
                'score': calculate_productivity(request.user, day)['productivity_score'],
            })
        return Response(report)
