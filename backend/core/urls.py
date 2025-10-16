from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    register, list_users, get_current_user, StateViewSet, CompanyViewSet, ObligationTypeViewSet,
    ObligationViewSet, SubmissionViewSet, report_summary, report_detailed, report_csv, report_xlsx, 
    dashboard_metrics, bulk_import_obligations, bulk_import_companies, 
    download_template, send_reminders, get_notifications, mark_notification_read,
    mark_all_notifications_read, get_notification_stats, generate_obligations,
    check_due_dates, check_overdue_obligations, send_email_notifications,
    advanced_reports_summary, user_performance_report
)
from .views_recurrence import preview_recurrence, generate_recurrence
from .views_deliveries import get_company_obligations, download_delivery_template, bulk_deliveries, bulk_attachments, list_deliveries
from .views_users import list_users_admin, set_user_role, get_user_history, get_user_stats, delete_user, change_user_password, create_user
from .views_approvals import (
    pending_approvals, approve_submission, reject_submission, request_revision,
    resubmit_submission, submission_timeline, download_attachment, my_deliveries
)
from .views_dispatches import DispatchViewSet, DispatchSubtaskViewSet, run_dispatch_notifications, recalculate_dispatch_progress

router = DefaultRouter()
router.register(r'states', StateViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'obligation-types', ObligationTypeViewSet)
router.register(r'obligations', ObligationViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'dispatches', DispatchViewSet, basename='dispatches')
router.register(r'dispatches/(?P<dispatch_pk>[^/.]+)/subtasks', DispatchSubtaskViewSet, basename='dispatch-subtasks')

urlpatterns = [
    path('auth/register/', register, name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', get_current_user, name='current_user'),
    path('users/', list_users, name='list_users'),
    # Novos endpoints de gestão de usuários (Admin apenas)
    path('users/admin/', list_users_admin, name='list_users_admin'),
    path('users/create/', create_user, name='create_user'),
    path('users/stats/', get_user_stats, name='user_stats'),
    path('users/<int:user_id>/role/', set_user_role, name='set_user_role'),
    path('users/<int:user_id>/history/', get_user_history, name='get_user_history'),
    path('users/<int:user_id>/password/', change_user_password, name='change_user_password'),
    path('users/<int:user_id>/', delete_user, name='delete_user'),
    path('', include(router.urls)),
    path('reports/summary/', report_summary),
    path('reports/detailed/', report_detailed, name='report_detailed'),
    path('reports/export.csv', report_csv),
    path('reports/export.xlsx', report_xlsx),
    path('dashboard/metrics/', dashboard_metrics),
    path('imports/obligations/', bulk_import_obligations),
    path('imports/companies/', bulk_import_companies),
    path('templates/<str:template_type>/', download_template),
    path('alerts/send-reminders/', send_reminders),
    # Notificações
    path('notifications/', get_notifications, name='notifications'),
    path('notifications/stats/', get_notification_stats, name='notification_stats'),
    path('notifications/<int:notification_id>/read/', mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', mark_all_notifications_read, name='mark_all_notifications_read'),
    # Planejamento Automático
    path('planning/generate/', generate_obligations, name='generate_obligations'),
    path('planning/check-due-dates/', check_due_dates, name='check_due_dates'),
    path('planning/check-overdue/', check_overdue_obligations, name='check_overdue_obligations'),
    path('planning/send-emails/', send_email_notifications, name='send_email_notifications'),
    # Relatórios Avançados
    path('reports/advanced/', advanced_reports_summary, name='advanced_reports'),
    path('reports/user/<int:user_id>/', user_performance_report, name='user_performance_report'),
    # Recorrências de Obrigações
    path('obligations/recurrence/preview/', preview_recurrence, name='preview_recurrence'),
    path('obligations/recurrence/generate/', generate_recurrence, name='generate_recurrence'),
    # Entregas PRO
    path('companies/<int:company_id>/obligations/', get_company_obligations, name='company_obligations'),
    path('deliveries/template.xlsx', download_delivery_template, name='delivery_template'),
    path('deliveries/bulk/', bulk_deliveries, name='bulk_deliveries'),
    path('deliveries/bulk-attachments/', bulk_attachments, name='bulk_attachments'),
    path('deliveries/', list_deliveries, name='list_deliveries'),
    # Sistema de Aprovação
    path('approvals/pending/', pending_approvals, name='pending_approvals'),
    path('approvals/my-deliveries/', my_deliveries, name='my_deliveries'),
    path('approvals/<int:submission_id>/approve/', approve_submission, name='approve_submission'),
    path('approvals/<int:submission_id>/reject/', reject_submission, name='reject_submission'),
    path('approvals/<int:submission_id>/request-revision/', request_revision, name='request_revision'),
    path('approvals/<int:submission_id>/resubmit/', resubmit_submission, name='resubmit_submission'),
    path('approvals/<int:submission_id>/timeline/', submission_timeline, name='submission_timeline'),
    path('approvals/<int:submission_id>/attachments/<str:attachment_id>/download/', download_attachment, name='download_attachment'),
        # Sistema de Despachos
        path('dispatches/notifications/run/', run_dispatch_notifications, name='run_dispatch_notifications'),
        path('dispatches/progress/recalculate/', recalculate_dispatch_progress, name='recalculate_dispatch_progress'),
]
