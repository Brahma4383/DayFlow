from rest_framework import viewsets

from .filters import filter_and_sort_tasks
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """
    GET    /api/tasks/        list tasks (search, filter, sort, paginate)
    POST   /api/tasks/        create a task
    GET    /api/tasks/<id>/   get one task
    PUT    /api/tasks/<id>/   replace a task
    PATCH  /api/tasks/<id>/   update some fields, e.g. {"status": "completed"}
    DELETE /api/tasks/<id>/   delete a task
    """

    serializer_class = TaskSerializer

    def get_queryset(self):
        # Only the logged-in user's tasks. Another user's task id returns 404.
        tasks = Task.objects.filter(user=self.request.user)
        if self.action == 'list':
            tasks = filter_and_sort_tasks(tasks, self.request.query_params)
        return tasks

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
