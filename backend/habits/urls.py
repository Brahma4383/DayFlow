from rest_framework.routers import SimpleRouter

from .views import HabitViewSet

# Creates /api/habits/, /api/habits/<id>/ and /api/habits/<id>/complete/
router = SimpleRouter()
router.register('', HabitViewSet, basename='habit')

urlpatterns = router.urls
