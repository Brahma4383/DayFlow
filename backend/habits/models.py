from datetime import timedelta

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Count, Exists, OuterRef, Q
from django.utils import timezone


class HabitQuerySet(models.QuerySet):
    def with_progress(self, day=None):
        """
        Add completed_today and completions_this_week to each habit.
        "Today" is `day` if given (used for reports), otherwise the real today. Weeks start on Monday.
        """
        day = day or timezone.localdate()
        week_start = day - timedelta(days=day.weekday())
        return self.annotate(
            completed_today=Exists(
                HabitCompletion.objects.filter(habit=OuterRef('pk'), date=day, completed=True)
            ),
            completions_this_week=Count(
                'completions',
                filter=Q(completions__completed=True, completions__date__range=(week_start, day)),
            ),
        )


class Habit(models.Model):
    class Frequency(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.DAILY)
    # How many days per week the habit should be done (daily habits are always 7)
    target_days = models.PositiveSmallIntegerField(
        default=7, validators=[MinValueValidator(1), MaxValueValidator(7)]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = HabitQuerySet.as_manager()

    def __str__(self):
        return self.name


class HabitCompletion(models.Model):
    """One row per habit per day. completed=False means the user undid it."""

    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    date = models.DateField()
    completed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['habit', 'date'], name='unique_habit_completion_per_day'),
        ]

    def __str__(self):
        return f'{self.habit.name} on {self.date}'
