from django.contrib import admin

from .models import FocusSession


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'duration', 'status', 'start_time', 'end_time')
    list_filter = ('status', 'start_time')
    search_fields = ('user__email', 'task__title')
