from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status', 'due_date',
            'created_at', 'updated_at', 'completed_at',
        ]
        # The owner comes from the login token, and timestamps are set automatically
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']
