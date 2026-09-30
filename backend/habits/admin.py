from django.contrib import admin

from .models import Habit, HabitCompletion


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'frequency', 'target_days', 'created_at')
    list_filter = ('frequency',)
    search_fields = ('name', 'description', 'user__email')


@admin.register(HabitCompletion)
class HabitCompletionAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'completed', 'created_at')
    list_filter = ('completed', 'date')
    search_fields = ('habit__name', 'habit__user__email')
