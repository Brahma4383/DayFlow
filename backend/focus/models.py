import math
from datetime import timedelta

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class FocusSession(models.Model):
    class Status(models.TextChoices):
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='focus_sessions')
    # Required when starting. Becomes empty if the task is deleted later, so the history is kept.
    task = models.ForeignKey(
        'tasks.Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='focus_sessions'
    )
    duration = models.PositiveSmallIntegerField(
        default=25, validators=[MinValueValidator(1), MaxValueValidator(180)], help_text='Planned length in minutes'
    )
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RUNNING)

    @property
    def planned_end_time(self):
        return self.start_time + timedelta(minutes=self.duration)

    @property
    def remaining_seconds(self):
        if self.status != self.Status.RUNNING:
            return 0
        return max(0, math.ceil((self.planned_end_time - timezone.now()).total_seconds()))

    def is_time_up(self):
        # 5-second allowance for network delay between the browser timer and the server
        return timezone.now() >= self.planned_end_time - timedelta(seconds=5)

    def __str__(self):
        return f'{self.duration} min focus ({self.status})'
