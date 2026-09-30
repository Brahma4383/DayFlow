from rest_framework import serializers

from tasks.models import Task

from .models import FocusSession


class FocusSessionSerializer(serializers.ModelSerializer):
    task_title = serializers.SerializerMethodField()
    planned_end_time = serializers.DateTimeField(read_only=True)
    remaining_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = FocusSession
        fields = [
            'id', 'task', 'task_title', 'duration', 'status',
            'start_time', 'planned_end_time', 'end_time', 'remaining_seconds',
        ]
        read_only_fields = ['id', 'status', 'start_time', 'end_time']
        # The user picks a task before starting
        extra_kwargs = {'task': {'required': True, 'allow_null': False}}

    def get_fields(self):
        fields = super().get_fields()
        # Only allow one of the user's own tasks
        request = self.context.get('request')
        if request:
            fields['task'].queryset = Task.objects.filter(user=request.user)
        return fields

    def get_task_title(self, session):
        return session.task.title if session.task else None
