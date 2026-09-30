from django.utils import timezone
from rest_framework import serializers

from .models import Habit
from .streaks import daily_streaks, weekly_streaks


class HabitSerializer(serializers.ModelSerializer):
    # Calculated by Habit.objects.with_progress(), not stored in the database
    completed_today = serializers.BooleanField(read_only=True)
    completions_this_week = serializers.IntegerField(read_only=True)
    # Calculated from the habit's ticks: days in a row (daily habits) or weeks in a row (weekly habits)
    current_streak = serializers.SerializerMethodField()
    longest_streak = serializers.SerializerMethodField()
    streak_unit = serializers.SerializerMethodField()
    total_completions = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'frequency', 'target_days', 'created_at',
            'completed_today', 'completions_this_week',
            'current_streak', 'longest_streak', 'streak_unit', 'total_completions',
        ]
        read_only_fields = ['id', 'created_at']

    def _streaks(self, habit):
        if not hasattr(habit, '_streak_info'):
            # The view prefetches the ticks as done_completions; fall back to a query otherwise
            completions = getattr(habit, 'done_completions', None)
            if completions is None:
                completions = habit.completions.filter(completed=True)
            dates = {completion.date for completion in completions}
            today = timezone.localdate()
            if habit.frequency == Habit.Frequency.WEEKLY:
                current, longest = weekly_streaks(dates, habit.target_days, today)
            else:
                current, longest = daily_streaks(dates, today)
            habit._streak_info = {'current': current, 'longest': longest, 'total': len(dates)}
        return habit._streak_info

    def get_current_streak(self, habit):
        return self._streaks(habit)['current']

    def get_longest_streak(self, habit):
        return self._streaks(habit)['longest']

    def get_streak_unit(self, habit):
        return 'weeks' if habit.frequency == Habit.Frequency.WEEKLY else 'days'

    def get_total_completions(self, habit):
        return self._streaks(habit)['total']

    def validate(self, attrs):
        # When editing, fall back to the habit's current values for fields not sent
        frequency = attrs.get('frequency', getattr(self.instance, 'frequency', Habit.Frequency.DAILY))

        if frequency == Habit.Frequency.DAILY:
            attrs['target_days'] = 7
        else:
            target_days = attrs.get('target_days', getattr(self.instance, 'target_days', None))
            if target_days is None or not 1 <= target_days <= 6:
                raise serializers.ValidationError({
                    'target_days': ['For weekly habits, choose 1 to 6 days per week. Use "daily" for every day.'],
                })
            attrs['target_days'] = target_days
        return attrs


class HabitCompleteSerializer(serializers.Serializer):
    """Body for POST /api/habits/<id>/complete/. Send {"completed": false} to undo."""

    completed = serializers.BooleanField(default=True)
