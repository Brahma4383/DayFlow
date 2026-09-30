from rest_framework import viewsets

from .filters import filter_and_sort_notes
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    """
    GET    /api/notes/        list notes, pinned first (search, filter by colour or pinned, sort, paginate)
    POST   /api/notes/        create a note
    GET    /api/notes/<id>/   get one note
    PUT    /api/notes/<id>/   replace a note
    PATCH  /api/notes/<id>/   update some fields, e.g. {"pinned": true}
    DELETE /api/notes/<id>/   delete a note
    """

    serializer_class = NoteSerializer

    def get_queryset(self):
        # Only the logged-in user's notes. Another user's note id returns 404.
        notes = Note.objects.filter(user=self.request.user)
        if self.action == 'list':
            notes = filter_and_sort_notes(notes, self.request.query_params)
        return notes

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
