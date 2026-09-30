from rest_framework.routers import SimpleRouter

from .views import TaskViewSet

# Creates /api/tasks/ and /api/tasks/<id>/ for all six operations
router = SimpleRouter()
router.register('', TaskViewSet, basename='task')

urlpatterns = router.urls
