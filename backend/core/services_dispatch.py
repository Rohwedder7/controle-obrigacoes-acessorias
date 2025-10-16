"""
Serviços para o sistema de Despachos
"""
from django.utils import timezone
from datetime import timedelta
from .models import Dispatch, Notification


class DispatchNotificationService:
    """Serviço para gerenciar notificações de despachos"""
    
    @staticmethod
    def create_dispatch_notification(user, dispatch, notification_type, title, message, priority='medium'):
        """Cria uma nova notificação de despacho"""
        return Notification.objects.create(
            user=user,
            type=notification_type,
            priority=priority,
            title=title,
            message=message
        )
    
    @staticmethod
    def _create_deduplicated_dispatch_notification(user, dispatch, notification_type, title, message, priority='medium'):
        """
        Cria notificação de despacho com deduplicação diária.
        Evita criar múltiplas notificações do mesmo tipo para o mesmo despacho no mesmo dia.
        """
        from datetime import date
        
        # Verificar se já existe notificação deste tipo para este despacho hoje
        today = timezone.now().date()
        existing = Notification.objects.filter(
            user=user,
            type=notification_type,
            created_at__date=today,
            message__icontains=f"Despacho {dispatch.get_category_display()}"
        ).exists()
        
        if not existing:
            return DispatchNotificationService.create_dispatch_notification(
                user=user,
                dispatch=dispatch,
                notification_type=notification_type,
                title=title,
                message=message,
                priority=priority
            )
        return None
    
    @staticmethod
    def send_weekly_notifications():
        """
        Verifica despachos com prazo na semana e status != CONCLUIDO
        Cria notificações para responsáveis e criadores
        """
        today = timezone.now().date()
        week_later = today + timedelta(days=7)
        
        # Buscar despachos que vencem na próxima semana e não estão concluídos
        dispatches = Dispatch.objects.filter(
            end_date__lte=week_later,
            end_date__gte=today,
            status__in=['NAO_INICIADO', 'EM_ANDAMENTO']
        ).select_related('company', 'responsible', 'created_by')
        
        notifications_created = 0
        
        for dispatch in dispatches:
            days_until_due = (dispatch.end_date - today).days
            
            # Determinar prioridade baseada na proximidade
            if days_until_due <= 1:
                priority = 'urgent'
            elif days_until_due <= 3:
                priority = 'high'
            else:
                priority = 'medium'
            
            # Notificar responsável
            if dispatch.responsible:
                title = f"⚠️ Despacho vence em {days_until_due} dia(s)"
                message = (
                    f"O despacho {dispatch.get_category_display()} da empresa "
                    f"{dispatch.company.name} vence em {days_until_due} dia(s) "
                    f"({dispatch.end_date.strftime('%d/%m/%Y')}). "
                    f"Progresso atual: {dispatch.progress_pct}%."
                )
                
                notification = DispatchNotificationService._create_deduplicated_dispatch_notification(
                    user=dispatch.responsible,
                    dispatch=dispatch,
                    notification_type='due_soon',
                    title=title,
                    message=message,
                    priority=priority
                )
                if notification:
                    notifications_created += 1
            
            # Notificar criador (se diferente do responsável)
            if dispatch.created_by and dispatch.created_by != dispatch.responsible:
                title = f"📋 Despacho criado por você vence em {days_until_due} dia(s)"
                message = (
                    f"O despacho {dispatch.get_category_display()} que você criou para "
                    f"{dispatch.company.name} vence em {days_until_due} dia(s). "
                    f"Responsável: {dispatch.responsible.username if dispatch.responsible else 'Não definido'}. "
                    f"Progresso: {dispatch.progress_pct}%."
                )
                
                notification = DispatchNotificationService._create_deduplicated_dispatch_notification(
                    user=dispatch.created_by,
                    dispatch=dispatch,
                    notification_type='due_soon',
                    title=title,
                    message=message,
                    priority=priority
                )
                if notification:
                    notifications_created += 1
        
        # Verificar despachos em atraso
        overdue_dispatches = Dispatch.objects.filter(
            end_date__lt=today,
            status__in=['NAO_INICIADO', 'EM_ANDAMENTO']
        ).select_related('company', 'responsible', 'created_by')
        
        for dispatch in overdue_dispatches:
            days_overdue = (today - dispatch.end_date).days
            
            # Notificar responsável
            if dispatch.responsible:
                title = f"🔴 Despacho em atraso há {days_overdue} dia(s)"
                message = (
                    f"O despacho {dispatch.get_category_display()} da empresa "
                    f"{dispatch.company.name} está em atraso há {days_overdue} dia(s). "
                    f"Venceu em {dispatch.end_date.strftime('%d/%m/%Y')}. "
                    f"Progresso atual: {dispatch.progress_pct}%."
                )
                
                notification = DispatchNotificationService._create_deduplicated_dispatch_notification(
                    user=dispatch.responsible,
                    dispatch=dispatch,
                    notification_type='overdue',
                    title=title,
                    message=message,
                    priority='urgent'
                )
                if notification:
                    notifications_created += 1
            
            # Notificar criador
            if dispatch.created_by:
                title = f"🚨 Despacho criado por você em atraso há {days_overdue} dia(s)"
                message = (
                    f"O despacho {dispatch.get_category_display()} que você criou para "
                    f"{dispatch.company.name} está em atraso há {days_overdue} dia(s). "
                    f"Responsável: {dispatch.responsible.username if dispatch.responsible else 'Não definido'}. "
                    f"Progresso: {dispatch.progress_pct}%."
                )
                
                notification = DispatchNotificationService._create_deduplicated_dispatch_notification(
                    user=dispatch.created_by,
                    dispatch=dispatch,
                    notification_type='overdue',
                    title=title,
                    message=message,
                    priority='urgent'
                )
                if notification:
                    notifications_created += 1
        
        return notifications_created
