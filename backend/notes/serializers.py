from rest_framework import serializers

from .models import Note

MAX_CONTENT_LENGTH = 10000


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'color', 'pinned', 'created_at', 'updated_at']
        # The owner comes from the login token, and timestamps are set automatically
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {'content': {'max_length': MAX_CONTENT_LENGTH}}

    def validate(self, data):
        # When editing, a field that is not sent keeps its current value
        title = data.get('title', getattr(self.instance, 'title', ''))
        content = data.get('content', getattr(self.instance, 'content', ''))
        if not title.strip() and not content.strip():
            raise serializers.ValidationError({'title': ['A note needs a title or some text.']})
        return data
