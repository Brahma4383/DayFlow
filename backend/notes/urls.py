from rest_framework.routers import SimpleRouter

from .views import NoteViewSet

# Creates /api/notes/ and /api/notes/<id>/ for all six operations
router = SimpleRouter()
router.register('', NoteViewSet, basename='note')

urlpatterns = router.urls
