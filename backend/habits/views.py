from collections import defaultdict
from datetime import date, timedelta

from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Habit, HabitCompletion
from .serializers import HabitCompleteSerializer, HabitSerializer

MAX_HISTORY_DAYS = 400


class HabitViewSet(viewsets.ModelViewSet):
    """
    GET    /api/habits/                 list habits (oldest first, paginated)
    POST   /api/habits/                 create a habit
    GET    /api/habits/<id>/            get one habit
    PUT    /api/habits/<id>/            replace a habit
    PATCH  /api/habits/<id>/            update some fields
    DELETE /api/habits/<id>/            delete a habit and its completions
    POST   /api/habits/<id>/complete/   mark done for today ({"completed": false} to undo)
    GET    /api/habits/history/         habits done per day (?start=YYYY-MM-DD&end=YYYY-MM-DD, default last 30 days)
    """

    serializer_class = HabitSerializer

    def get_queryset(self):
        # Only the logged-in user's habits. Another user's habit id returns 404.
        # The ticks are loaded in one extra query so streaks can be worked out without a query per habit.
        return (
            Habit.objects.filter(user=self.request.user)
            .with_progress()
            .prefetch_related(Prefetch(
                'completions',
                queryset=HabitCompletion.objects.filter(completed=True).only('id', 'habit_id', 'date'),
                to_attr='done_completions',
            ))
            .order_by('created_at', 'id')
        )

    def perform_create(self, serializer):
        habit = serializer.save(user=self.request.user)
        # A brand-new habit has no completions yet
        habit.completed_today = False
        habit.completions_this_week = 0
        habit.done_completions = []

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        habit = self.get_object()
        serializer = HabitCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # One record per habit per day: create it, or update it if it already exists
        HabitCompletion.objects.update_or_create(
            habit=habit,
            date=timezone.localdate(),
            defaults={'completed': serializer.validated_data['completed']},
        )

        habit = self.get_queryset().get(pk=habit.pk)  # reload with updated progress
        return Response(self.get_serializer(habit).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """For each day: how many habits existed ("total") and how many were ticked ("done")."""
        today = timezone.localdate()
        try:
            end = date.fromisoformat(request.query_params.get('end') or today.isoformat())
            start = date.fromisoformat(request.query_params.get('start') or (end - timedelta(days=29)).isoformat())
        except ValueError:
            return Response({'detail': 'Use dates in the format YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        if start > end or (end - start).days >= MAX_HISTORY_DAYS:
            return Response({'detail': f'Choose a start date before the end date, at most {MAX_HISTORY_DAYS} days apart.'},
                            status=status.HTTP_400_BAD_REQUEST)

        created_on = {habit_id: timezone.localdate(created_at) for habit_id, created_at in
                      Habit.objects.filter(user=request.user).values_list('id', 'created_at')}
        ticked = defaultdict(set)
        for day, habit_id in HabitCompletion.objects.filter(
                habit__user=request.user, completed=True, date__range=(start, end)).values_list('date', 'habit_id'):
            ticked[day].add(habit_id)

        days = []
        for offset in range((end - start).days + 1):
            day = start + timedelta(days=offset)
            existing = {habit_id for habit_id, created in created_on.items() if created <= day}
            days.append({'date': day.isoformat(), 'done': len(ticked[day] & existing), 'total': len(existing)})
        return Response(days)
