from django.conf import settings
from django.db import models


class Note(models.Model):
    class Color(models.TextChoices):
        DEFAULT = 'default', 'Default'
        YELLOW = 'yellow', 'Yellow'
        GREEN = 'green', 'Green'
        BLUE = 'blue', 'Blue'
        PURPLE = 'purple', 'Purple'
        PINK = 'pink', 'Pink'
        ORANGE = 'orange', 'Orange'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    # A note needs a title or some text (checked in the serializer), so both may be blank on their own
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    color = models.CharField(max_length=10, choices=Color.choices, default=Color.DEFAULT)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Pinned notes first, then the most recently edited
        ordering = ['-pinned', '-updated_at', '-id']

    def __str__(self):
        return self.title or self.content[:50]
