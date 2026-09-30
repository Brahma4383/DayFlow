from django.urls import path

from .views import DashboardView, HistoryView, OverviewView, ProductivityView, WeeklyReportView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('productivity/', ProductivityView.as_view(), name='productivity'),
    path('weekly-report/', WeeklyReportView.as_view(), name='weekly-report'),
    path('overview/', OverviewView.as_view(), name='overview'),
    path('history/', HistoryView.as_view(), name='history'),
]
