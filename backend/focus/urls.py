from rest_framework.routers import SimpleRouter

from .views import FocusSessionViewSet

# Creates /api/focus/start/, complete/, cancel/, history/ and active/
router = SimpleRouter()
router.register('', FocusSessionViewSet, basename='focus')

urlpatterns = router.urls
