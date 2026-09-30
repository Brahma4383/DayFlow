from django.contrib import admin

from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'user', 'color', 'pinned', 'updated_at')
    list_filter = ('color', 'pinned')
    search_fields = ('title', 'content', 'user__email')
    ordering = ('-updated_at',)
