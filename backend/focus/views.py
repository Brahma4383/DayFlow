import math

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import FocusSession
from .serializers import FocusSessionSerializer


class FocusSessionViewSet(viewsets.GenericViewSet):
    """
    POST /api/focus/start/      start a session {"task": <id>, "duration": 25}
    POST /api/focus/complete/   finish the running session once its time is up
    POST /api/focus/cancel/     stop the running session early
    GET  /api/focus/history/    all sessions, newest first (paginated)
    GET  /api/focus/active/     the running session (204 if none), used to resume after a page refresh

    A user can only have one running session, so complete and cancel need no id.
    Pausing is handled by the frontend timer only.
    """

    serializer_class = FocusSessionSerializer

    def get_queryset(self):
        # Only the logged-in user's sessions
        return (
            FocusSession.objects.filter(user=self.request.user)
            .select_related('task')
            .order_by('-start_time', '-id')
        )

    def get_running_session(self):
        return self.get_queryset().filter(status=FocusSession.Status.RUNNING).first()

    @action(detail=False, methods=['post'])
    def start(self, request):
        if self.get_running_session():
            return error('You already have a focus session running. Complete or cancel it first.')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def complete(self, request):
        session = self.get_running_session()
        if session is None:
            return error('You have no focus session running.')
        if not session.is_time_up():
            minutes_left = math.ceil(session.remaining_seconds / 60)
            return error(f'This session has {minutes_left} minute(s) left. Cancel it to stop early.')
        return self.finish(session, FocusSession.Status.COMPLETED)

    @action(detail=False, methods=['post'])
    def cancel(self, request):
        session = self.get_running_session()
        if session is None:
            return error('You have no focus session running.')
        return self.finish(session, FocusSession.Status.CANCELLED)

    @action(detail=False, methods=['get'])
    def history(self, request):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        session = self.get_running_session()
        if session is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(self.get_serializer(session).data)

    def finish(self, session, new_status):
        session.status = new_status
        session.end_time = timezone.now()
        session.save()
        return Response(self.get_serializer(session).data)


def error(message):
    return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)
