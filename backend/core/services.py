"""
Serviços para geração automática de obrigações e notificações
"""
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from .models import Obligation, Notification, User, ObligationType, Company, State, Submission

class NotificationService:
    """Serviço para gerenciar notificações do sistema"""
    
    @staticmethod
    def create_notification(user, title, message, notification_type='system', priority='medium', obligation=None):
        """Cria uma nova notificação"""
        return Notification.objects.create(
            user=user,
            obligation=obligation,
            type=notification_type,
            priority=priority,
            title=title,
            message=message
        )
    
    @staticmethod
    def _create_deduplicated_notification(user, obligation, notification_type, title, message, priority='medium'):
        """
        Cria notificação com deduplicação diária.
        Evita criar múltiplas notificações do mesmo tipo para a mesma obrigação no mesmo dia.
        """
        from datetime import date
        
        # Verificar se já existe notificação deste tipo para esta obrigação hoje
        today = timezone.now().date()
        existing = Notification.objects.filter(
            user=user,
            obligation=obligation,
            type=notification_type,
            created_at__date=today
        ).exists()
        
        if not existing:
            return NotificationService.create_notification(
                user=user,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                obligation=obligation
            )
        return None
    
    @staticmethod
    def create_rejection_notification(submission, approver, comment=''):
        """
        Cria notificação quando uma submissão é recusada.
        Notifica o autor da submissão.
        """
        if not submission.delivered_by:
            return None
        
        title = "🔴 Entrega Recusada"
        message = (
            f"Sua entrega da obrigação {submission.obligation.obligation_type.name} "
            f"para {submission.obligation.company.name} ({submission.obligation.state.code}) "
            f"foi recusada por {approver.username}."
        )
        
        if comment:
            message += f"\n\nMotivo: {comment}"
        
        message += f"\n\nCompetência: {submission.obligation.competence}"
        
        return NotificationService.create_notification(
            user=submission.delivered_by,
            title=title,
            message=message,
            notification_type='approval',
            priority='high',
            obligation=submission.obligation
        )
    
    @staticmethod
    def create_revision_notification(submission, approver, comment=''):
        """
        Cria notificação quando é solicitada revisão em uma submissão.
        Notifica o autor da submissão.
        """
        if not submission.delivered_by:
            return None
        
        title = "⚠️ Revisão Solicitada"
        message = (
            f"A entrega da obrigação {submission.obligation.obligation_type.name} "
            f"para {submission.obligation.company.name} ({submission.obligation.state.code}) "
            f"necessita de revisão. Solicitada por: {approver.username}."
        )
        
        if comment:
            message += f"\n\nObservações: {comment}"
        
        message += f"\n\nCompetência: {submission.obligation.competence}"
        
        return NotificationService.create_notification(
            user=submission.delivered_by,
            title=title,
            message=message,
            notification_type='approval',
            priority='high',
            obligation=submission.obligation
        )
    
    @staticmethod
    def create_approval_notification(submission, approver, comment=''):
        """
        Cria notificação quando uma submissão é aprovada.
        Notifica o autor da submissão.
        """
        if not submission.delivered_by:
            return None
        
        title = "✅ Entrega Aprovada"
        message = (
            f"Sua entrega da obrigação {submission.obligation.obligation_type.name} "
            f"para {submission.obligation.company.name} ({submission.obligation.state.code}) "
            f"foi aprovada por {approver.username}."
        )
        
        if comment:
            message += f"\n\nComentário: {comment}"
        
        message += f"\n\nCompetência: {submission.obligation.competence}"
        
        return NotificationService.create_notification(
            user=submission.delivered_by,
            title=title,
            message=message,
            notification_type='approval',
            priority='medium',
            obligation=submission.obligation
        )
    
    @staticmethod
    def check_due_dates(days_ahead=7):
        """
        Verifica obrigações que vencem nos próximos dias e não possuem submission aprovada.
        Usa deduplicação para evitar spam de notificações.
        """
        today = timezone.now().date()
        due_date = today + timedelta(days=days_ahead)
        
        # Buscar todas as obrigações que vencem no período
        obligations = Obligation.objects.filter(
            due_date__lte=due_date,
            due_date__gte=today
        ).select_related('company', 'obligation_type', 'state', 'responsible_user').prefetch_related('submissions')
        
        notifications_created = 0
        
        for obligation in obligations:
            # Verificar se tem submission aprovada
            has_approved = obligation.submissions.filter(approval_status='approved').exists()
            if has_approved:
                continue  # Já foi entregue e aprovada, não precisa notificar
            
            days_until_due = (obligation.due_date - today).days
            
            # Determinar prioridade baseada na proximidade
            if days_until_due <= 1:
                priority = 'urgent'
            elif days_until_due <= 3:
                priority = 'high'
            elif days_until_due <= 5:
                priority = 'medium'
            else:
                priority = 'low'
            
            # Criar notificação para o usuário responsável (com deduplicação)
            if obligation.responsible_user:
                title = f"⚠️ Obrigação vence em {days_until_due} dia(s)"
                message = (
                    f"A obrigação {obligation.obligation_type.name} da empresa "
                    f"{obligation.company.name} vence em {days_until_due} dia(s) "
                    f"({obligation.due_date.strftime('%d/%m/%Y')})."
                )
                
                notification = NotificationService._create_deduplicated_notification(
                    user=obligation.responsible_user,
                    obligation=obligation,
                    notification_type='due_soon',
                    title=title,
                    message=message,
                    priority=priority
                )
                if notification:
                    notifications_created += 1
            
            # Notificar administradores sobre obrigações críticas (com deduplicação)
            if priority in ['urgent', 'high']:
                admins = User.objects.filter(is_superuser=True)
                for admin in admins:
                    title = f"🚨 Obrigação crítica: {days_until_due} dia(s) para vencimento"
                    message = (
                        f"A obrigação {obligation.obligation_type.name} da empresa "
                        f"{obligation.company.name} ({obligation.state.code}) vence em "
                        f"{days_until_due} dia(s). Responsável: {obligation.responsible_user.username if obligation.responsible_user else 'Não definido'}."
                    )
                    
                    notification = NotificationService._create_deduplicated_notification(
                        user=admin,
                        obligation=obligation,
                        notification_type='due_soon',
                        title=title,
                        message=message,
                        priority=priority
                    )
                    if notification:
                        notifications_created += 1
        
        return notifications_created
    
    @staticmethod
    def check_overdue_obligations():
        """
        Verifica obrigações em atraso (sem submission aprovada).
        Usa deduplicação para evitar spam de notificações.
        """
        today = timezone.now().date()
        
        # Buscar todas as obrigações vencidas
        obligations = Obligation.objects.filter(
            due_date__lt=today
        ).select_related('company', 'obligation_type', 'state', 'responsible_user').prefetch_related('submissions')
        
        notifications_created = 0
        
        for obligation in obligations:
            # Verificar se tem submission aprovada
            has_approved = obligation.submissions.filter(approval_status='approved').exists()
            if has_approved:
                continue  # Já foi entregue e aprovada, não precisa notificar
            
            days_overdue = (today - obligation.due_date).days
            
            # Criar notificação para o usuário responsável (com deduplicação)
            if obligation.responsible_user:
                title = f"🔴 Obrigação em atraso há {days_overdue} dia(s)"
                message = (
                    f"A obrigação {obligation.obligation_type.name} da empresa "
                    f"{obligation.company.name} está em atraso há {days_overdue} dia(s). "
                    f"Venceu em {obligation.due_date.strftime('%d/%m/%Y')}."
                )
                
                notification = NotificationService._create_deduplicated_notification(
                    user=obligation.responsible_user,
                    obligation=obligation,
                    notification_type='overdue',
                    title=title,
                    message=message,
                    priority='urgent'
                )
                if notification:
                    notifications_created += 1
            
            # Notificar administradores (com deduplicação)
            # Buscar superusers e usuários no grupo Admin
            from django.contrib.auth.models import Group
            admin_group = Group.objects.filter(name='Admin').first()
            if admin_group:
                admins = User.objects.filter(
                    Q(is_superuser=True) | Q(groups=admin_group)
                ).distinct()
            else:
                admins = User.objects.filter(is_superuser=True)
            
            for admin in admins:
                title = f"🚨 Obrigação em atraso há {days_overdue} dia(s)"
                message = (
                    f"A obrigação {obligation.obligation_type.name} da empresa "
                    f"{obligation.company.name} ({obligation.state.code}) está em atraso há "
                    f"{days_overdue} dia(s). Responsável: {obligation.responsible_user.username if obligation.responsible_user else 'Não definido'}."
                )
                
                notification = NotificationService._create_deduplicated_notification(
                    user=admin,
                    obligation=obligation,
                    notification_type='overdue',
                    title=title,
                    message=message,
                    priority='urgent'
                )
                if notification:
                    notifications_created += 1
        
        return notifications_created
    
    @staticmethod
    def check_late_deliveries():
        """
        Verifica entregas atrasadas (submissions após o vencimento da obrigação).
        Notifica admins sobre entregas que foram feitas após o vencimento.
        """
        from django.contrib.auth.models import Group
        from django.db.models import F
        
        today = timezone.now().date()
        notifications_created = 0
        
        # Buscar todas as submissions feitas após o vencimento
        submissions = Submission.objects.filter(
            delivery_date__gt=F('obligation__due_date')
        ).select_related(
            'obligation__company',
            'obligation__obligation_type',
            'obligation__state',
            'delivered_by'
        )
        
        for submission in submissions:
            days_late = (submission.delivery_date - submission.obligation.due_date).days
            
            # Notificar administradores sobre entrega atrasada
            admin_group = Group.objects.filter(name='Admin').first()
            if admin_group:
                admins = User.objects.filter(
                    Q(is_superuser=True) | Q(groups=admin_group)
                ).distinct()
            else:
                admins = User.objects.filter(is_superuser=True)
            
            for admin in admins:
                status_text = {
                    'approved': 'Aprovada',
                    'pending_review': 'Pendente de Revisão',
                    'needs_revision': 'Necessita Revisão',
                    'rejected': 'Recusada'
                }.get(submission.approval_status, submission.approval_status)
                
                title = f"⚠️ Entrega atrasada - {days_late} dia(s) após vencimento"
                message = (
                    f"Uma entrega foi feita {days_late} dia(s) após o vencimento da obrigação "
                    f"{submission.obligation.obligation_type.name} da empresa "
                    f"{submission.obligation.company.name} ({submission.obligation.state.code}). "
                    f"Vencimento: {submission.obligation.due_date.strftime('%d/%m/%Y')}. "
                    f"Entrega: {submission.delivery_date.strftime('%d/%m/%Y')}. "
                    f"Status: {status_text}. "
                    f"Entregue por: {submission.delivered_by.username if submission.delivered_by else 'N/A'}."
                )
                
                notification = NotificationService._create_deduplicated_notification(
                    user=admin,
                    obligation=submission.obligation,
                    notification_type='overdue',
                    title=title,
                    message=message,
                    priority='high'
                )
                if notification:
                    notifications_created += 1
        
        return notifications_created
    
    @staticmethod
    def send_email_notifications():
        """Envia notificações por email para usuários com notificações não lidas"""
        users_with_notifications = User.objects.filter(
            notifications__is_read=False
        ).distinct()
        
        emails_sent = 0
        
        for user in users_with_notifications:
            unread_count = user.notifications.filter(is_read=False).count()
            
            if unread_count > 0 and user.email:
                try:
                    send_mail(
                        subject=f'[Sistema] Você tem {unread_count} notificação(ões) pendente(s)',
                        message=f'Você tem {unread_count} notificação(ões) não lida(s) no sistema de Controle de Obrigações Acessórias.',
                        from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@sistema.com',
                        recipient_list=[user.email],
                        fail_silently=True
                    )
                    emails_sent += 1
                except Exception:
                    pass
        
        return emails_sent


class ObligationPlanningService:
    """Serviço para planejamento automático de obrigações"""
    
    @staticmethod
    def generate_obligations_for_period(months_ahead=3, company_id=None, obligation_type_id=None, 
                                      obligation_name=None, state_id=None):
        """Gera obrigações automaticamente para um período baseado em obrigações existentes como modelo"""
        today = timezone.now().date()
        end_date = today + relativedelta(months=months_ahead)
        
        generated_count = 0
        skipped_count = 0
        
        # Buscar obrigações existentes com filtros aplicados
        existing_obligations = Obligation.objects.all()
        
        if company_id:
            existing_obligations = existing_obligations.filter(company_id=company_id)
        if obligation_type_id:
            existing_obligations = existing_obligations.filter(obligation_type_id=obligation_type_id)
        if obligation_name:
            existing_obligations = existing_obligations.filter(obligation_name__icontains=obligation_name)
        if state_id:
            existing_obligations = existing_obligations.filter(state_id=state_id)
        
        # Agrupar por combinação única (empresa, estado, tipo, nome)
        processed_combinations = set()
        
        for obligation in existing_obligations:
            combination_key = (
                obligation.company.id, 
                obligation.state.id, 
                obligation.obligation_type.id, 
                obligation.obligation_name
            )
            
            if combination_key in processed_combinations:
                continue
                
            processed_combinations.add(combination_key)
            
            count, skipped = ObligationPlanningService._generate_obligations_from_existing(
                obligation,
                today,
                end_date
            )
            generated_count += count
            skipped_count += skipped
        
        return generated_count, skipped_count
    
    @staticmethod
    def _generate_obligations_from_existing(obligation, start_date, end_date):
        """Gera obrigações baseado em uma obrigação existente como modelo"""
        generated = 0
        skipped = 0
        
        # Buscar a obrigação com a data mais distante para esta combinação
        # Ordenar por due_date DESC para pegar a mais distante no futuro
        latest_obligation = Obligation.objects.filter(
            company=obligation.company,
            state=obligation.state,
            obligation_type=obligation.obligation_type,
            obligation_name=obligation.obligation_name
        ).order_by('-due_date').first()
        
        if not latest_obligation:
            return generated, skipped
        
        # Extrair informações da obrigação mais recente
        model_competence = latest_obligation.competence  # Ex: "10/2025"
        model_due_date = latest_obligation.due_date      # Ex: 2025-11-20
        model_delivery_deadline = latest_obligation.delivery_deadline  # Ex: 2025-11-15
        
        # Parsear a competência para obter mês e ano
        try:
            # Suportar diferentes formatos de competência
            if '/' in model_competence:
                month, year = model_competence.split('/')
                month = int(month)
                year = int(year)
            elif '-' in model_competence:
                # Formato YYYY-MM-DD ou YYYY-MM
                parts = model_competence.split('-')
                if len(parts) >= 2:
                    year = int(parts[0])
                    month = int(parts[1])
                else:
                    return generated, skipped
            else:
                # Tentar parsear como data completa
                try:
                    from datetime import datetime
                    if len(model_competence) >= 7:  # YYYY-MM
                        year = int(model_competence[:4])
                        month = int(model_competence[5:7])
                    else:
                        return generated, skipped
                except:
                    return generated, skipped
        except (ValueError, IndexError):
            return generated, skipped
        
        # Calcular quantos meses gerar baseado na recorrência
        recurrence_months = {
            'mensal': 1,
            'bimestral': 2,
            'trimestral': 3,
            'semestral': 6,
            'anual': 12
        }
        
        months_increment = recurrence_months.get(obligation.obligation_type.recurrence, 1)
        
        # SEMPRE começar do próximo período baseado na competência mais distante
        # Se a competência mais distante é 10/2025, o próximo período é 11/2025
        current_month = month + 1
        current_year = year
        if current_month > 12:
            current_month = 1
            current_year += 1
        
        # Ajustar para diferentes tipos de recorrência
        if obligation.obligation_type.recurrence == 'bimestral':
            # Para bimestral, pular um mês
            current_month += 1
            if current_month > 12:
                current_month = 1
                current_year += 1
        elif obligation.obligation_type.recurrence == 'trimestral':
            # Para trimestral, pular dois meses
            current_month += 2
            if current_month > 12:
                current_month = current_month - 12
                current_year += 1
        elif obligation.obligation_type.recurrence == 'semestral':
            # Para semestral, pular cinco meses
            current_month += 5
            if current_month > 12:
                current_month = current_month - 12
                current_year += 1
        elif obligation.obligation_type.recurrence == 'anual':
            # Para anual, pular onze meses
            current_month += 11
            if current_month > 12:
                current_month = current_month - 12
                current_year += 1
        
        # Gerar obrigações para o período solicitado
        from datetime import date
        today = date.today()
        periods_generated = 0
        max_periods = 12  # Limite de segurança
        
        # Gerar obrigações até atingir o limite ou o período solicitado
        while periods_generated < max_periods:
            # Para obrigações mensais, o vencimento é sempre no mês seguinte à competência
            # Ex: competência 10/2025 → vencimento em 11/2025
            # Ex: competência 11/2025 → vencimento em 12/2025
            # Ex: competência 12/2025 → vencimento em 01/2026
            due_month = current_month + 1
            due_year = current_year
            if due_month > 12:
                due_month = 1
                due_year += 1
            
            # Calcular a data de vencimento baseada no mês de vencimento calculado
            # Manter o mesmo dia do mês da obrigação original
            try:
                new_due_date = model_due_date.replace(year=due_year, month=due_month)
            except ValueError:
                # Se o dia não existe no mês (ex: 31/02), usar o último dia do mês
                from calendar import monthrange
                last_day = monthrange(due_year, due_month)[1]
                new_due_date = model_due_date.replace(year=due_year, month=due_month, day=last_day)
            
            
            
            # Verificar se a data está dentro do período solicitado
            if new_due_date > end_date:
                break
            
            # Calcular competência (mês de referência) - sempre no formato MM/YYYY
            competence = f"{current_month:02d}/{current_year}"
            
            # Verificar se já existe uma obrigação para esta competência
            existing_obligation = Obligation.objects.filter(
                company=obligation.company,
                state=obligation.state,
                obligation_type=obligation.obligation_type,
                obligation_name=obligation.obligation_name,
                competence=competence
            ).first()
            
            if existing_obligation:
                skipped += 1
            else:
                # Calcular a data de entrega baseada na diferença original
                if model_delivery_deadline:
                    # Calcular a diferença em dias entre vencimento e entrega original
                    days_diff = (model_delivery_deadline - model_due_date).days
                    new_delivery_deadline = new_due_date + timedelta(days=days_diff)
                else:
                    # Fallback baseado na recorrência e tipo de obrigação
                    if obligation.obligation_type.recurrence == 'mensal':
                        # Para obrigações mensais, geralmente 5-15 dias antes do vencimento
                        new_delivery_deadline = new_due_date + timedelta(days=-5)
                    elif obligation.obligation_type.recurrence == 'bimestral':
                        new_delivery_deadline = new_due_date + timedelta(days=-10)
                    elif obligation.obligation_type.recurrence == 'trimestral':
                        new_delivery_deadline = new_due_date + timedelta(days=-15)
                    elif obligation.obligation_type.recurrence == 'semestral':
                        new_delivery_deadline = new_due_date + timedelta(days=-20)
                    elif obligation.obligation_type.recurrence == 'anual':
                        new_delivery_deadline = new_due_date + timedelta(days=-30)
                    else:
                        new_delivery_deadline = new_due_date + timedelta(days=-5)
                
                # Criar nova obrigação
                new_obligation = Obligation.objects.create(
                    company=obligation.company,
                    state=obligation.state,
                    obligation_type=obligation.obligation_type,
                    obligation_name=obligation.obligation_name,
                    competence=competence,
                    due_date=new_due_date,
                    delivery_deadline=new_delivery_deadline,
                    responsible_user=obligation.responsible_user,
                    validity_start_date=obligation.validity_start_date,
                    validity_end_date=obligation.validity_end_date,
                    notes=f'Obrigação gerada automaticamente baseada em {latest_obligation.competence} - {obligation.obligation_type.recurrence}'
                )
                generated += 1
            
            # Avançar para o próximo período
            current_month += months_increment
            if current_month > 12:
                current_month = 1
                current_year += 1
            
            periods_generated += 1
        
        return generated, skipped
    
    @staticmethod
    def _generate_obligations_for_company_state_type(company, state, obligation_type, start_date, end_date):
        """Gera obrigações para uma combinação específica baseada no nome da obrigação definido pelo usuário"""
        generated = 0
        skipped = 0
        
        # Buscar obrigações existentes para esta combinação que tenham período de validade
        # Agrupar por nome da obrigação para manter a consistência
        existing_obligations = Obligation.objects.filter(
            company=company,
            state=state,
            obligation_type=obligation_type,
            validity_start_date__isnull=False,
            validity_end_date__isnull=False,
            obligation_name__isnull=False  # Só considerar obrigações com nome definido
        ).values('obligation_name').distinct()
        
        for obligation_data in existing_obligations:
            obligation_name = obligation_data['obligation_name']
            
            # Buscar uma obrigação de referência com este nome
            reference_obligation = Obligation.objects.filter(
                company=company,
                state=state,
                obligation_type=obligation_type,
                obligation_name=obligation_name,
                validity_start_date__isnull=False,
                validity_end_date__isnull=False
            ).first()
            
            if not reference_obligation:
                continue
            
            # Calcular datas baseado na recorrência dentro do período de validade
            dates = ObligationPlanningService._calculate_recurrence_dates_in_period(
                obligation_type.recurrence,
                obligation_type.due_day,
                reference_obligation.validity_start_date,
                reference_obligation.validity_end_date,
                start_date,  # Período solicitado
                end_date     # Período solicitado
            )
            
            for due_date in dates:
                # Calcular competência (MM/AAAA)
                competence = due_date.strftime('%m/%Y')
                
                # Verificar se já existe uma obrigação para esta competência com o mesmo nome
                if Obligation.objects.filter(
                    company=company,
                    state=state,
                    obligation_type=obligation_type,
                    obligation_name=obligation_name,
                    competence=competence
                ).exists():
                    skipped += 1
                    continue
                
                # Calcular data de entrega baseada na diferença original
                original_delivery_deadline = reference_obligation.delivery_deadline
                original_due_date = reference_obligation.due_date
                
                if original_delivery_deadline and original_due_date:
                    # Calcular a diferença em dias entre vencimento e entrega original
                    days_diff = (original_delivery_deadline - original_due_date).days
                    delivery_deadline = due_date + timedelta(days=days_diff)
                else:
                    # Fallback baseado na recorrência: 
                    # Mensal: 15 dias, Bimestral: 20 dias, Trimestral: 30 dias, etc.
                    if obligation_type.recurrence == 'mensal':
                        delivery_deadline = due_date + timedelta(days=15)
                    elif obligation_type.recurrence == 'bimestral':
                        delivery_deadline = due_date + timedelta(days=20)
                    elif obligation_type.recurrence == 'trimestral':
                        delivery_deadline = due_date + timedelta(days=30)
                    elif obligation_type.recurrence == 'semestral':
                        delivery_deadline = due_date + timedelta(days=45)
                    elif obligation_type.recurrence == 'anual':
                        delivery_deadline = due_date + timedelta(days=60)
                    else:
                        delivery_deadline = due_date + timedelta(days=30)
                
                # Criar obrigação mantendo o nome original definido pelo usuário
                Obligation.objects.create(
                    company=company,
                    state=state,
                    obligation_type=obligation_type,
                    obligation_name=obligation_name,  # Manter o nome original
                    competence=competence,
                    due_date=due_date,
                    delivery_deadline=delivery_deadline,
                    validity_start_date=reference_obligation.validity_start_date,
                    validity_end_date=reference_obligation.validity_end_date,
                    responsible_user=reference_obligation.responsible_user,
                    notes=f'Obrigação gerada automaticamente - {obligation_type.recurrence} - Competência {competence}'
                )
                generated += 1
        
        return generated, skipped
    
    @staticmethod
    def _calculate_recurrence_dates(recurrence, due_day, start_date, end_date):
        """Calcula as datas de vencimento baseado na recorrência"""
        from calendar import monthrange
        dates = []
        
        # Validar e ajustar due_day para não exceder os dias do mês
        def get_valid_day(year, month, day):
            max_day = monthrange(year, month)[1]
            return min(day, max_day)
        
        # Começar do primeiro dia do mês atual
        current_date = start_date.replace(day=1)
        
        # Gerar datas até o final do período
        while current_date <= end_date:
            # Calcular a data de vencimento para este mês
            valid_day = get_valid_day(current_date.year, current_date.month, due_day)
            due_date = current_date.replace(day=valid_day)
            
            # Só incluir se estiver no período desejado e não no passado
            if due_date >= start_date and due_date <= end_date:
                dates.append(due_date)
            
            # Avançar para o próximo período
            if recurrence == 'mensal':
                current_date = current_date + relativedelta(months=1)
            elif recurrence == 'bimestral':
                current_date = current_date + relativedelta(months=2)
            elif recurrence == 'trimestral':
                current_date = current_date + relativedelta(months=3)
            elif recurrence == 'semestral':
                current_date = current_date + relativedelta(months=6)
            elif recurrence == 'anual':
                current_date = current_date + relativedelta(years=1)
            else:
                break
        
        return dates
    
    @staticmethod
    def _generate_obligations_from_type(company, state, obligation_type, start_date, end_date):
        """Gera obrigações baseado apenas no tipo de obrigação cadastrado"""
        generated = 0
        skipped = 0
        
        # Calcular datas baseado na recorrência
        dates = ObligationPlanningService._calculate_recurrence_dates(
            obligation_type.recurrence,
            obligation_type.due_day,
            start_date,
            end_date
        )
        
        for due_date in dates:
            # Calcular competência (MM/AAAA)
            competence = due_date.strftime('%m/%Y')
            
            # Verificar se já existe uma obrigação para esta competência
            if Obligation.objects.filter(
                company=company,
                state=state,
                obligation_type=obligation_type,
                competence=competence
            ).exists():
                skipped += 1
                continue
            
            # Calcular data de entrega baseado na recorrência
            if obligation_type.recurrence == 'mensal':
                delivery_deadline = due_date + timedelta(days=15)
            elif obligation_type.recurrence == 'bimestral':
                delivery_deadline = due_date + timedelta(days=20)
            elif obligation_type.recurrence == 'trimestral':
                delivery_deadline = due_date + timedelta(days=30)
            elif obligation_type.recurrence == 'semestral':
                delivery_deadline = due_date + timedelta(days=45)
            elif obligation_type.recurrence == 'anual':
                delivery_deadline = due_date + timedelta(days=60)
            else:
                delivery_deadline = due_date + timedelta(days=30)
            
            # Criar obrigação com nome padrão baseado no tipo
            obligation_name = f"{obligation_type.name} - {state.code}"
            
            Obligation.objects.create(
                company=company,
                state=state,
                obligation_type=obligation_type,
                obligation_name=obligation_name,
                competence=competence,
                due_date=due_date,
                delivery_deadline=delivery_deadline,
                validity_start_date=start_date,
                validity_end_date=end_date,
                notes=f'Obrigação gerada automaticamente - {obligation_type.recurrence} - Competência {competence}'
            )
            generated += 1
        
        return generated, skipped
    
    @staticmethod
    def _calculate_recurrence_dates_in_period(recurrence, due_day, validity_start, validity_end, requested_start, requested_end):
        """Calcula as datas de vencimento baseado na recorrência dentro de um período específico"""
        from calendar import monthrange
        from datetime import date
        dates = []
        
        # Validar e ajustar due_day para não exceder os dias do mês
        def get_valid_day(year, month, day):
            max_day = monthrange(year, month)[1]
            return min(day, max_day)
        
        # Usar o período solicitado como base, mas limitado pelo período de validade
        actual_start = max(validity_start, requested_start)
        actual_end = min(validity_end, requested_end)
        
        # Começar do primeiro dia do mês de início
        current_date = actual_start.replace(day=1)
        
        # Gerar datas até o final do período
        while current_date <= actual_end:
            # Calcular a data de vencimento para este mês
            valid_day = get_valid_day(current_date.year, current_date.month, due_day)
            due_date = current_date.replace(day=valid_day)
            
            # Só incluir se estiver no período desejado e não no passado
            if due_date >= actual_start and due_date <= actual_end and due_date >= date.today():
                dates.append(due_date)
            
            # Avançar para o próximo período baseado na recorrência
            if recurrence == 'mensal':
                current_date = current_date + relativedelta(months=1)
            elif recurrence == 'bimestral':
                current_date = current_date + relativedelta(months=2)
            elif recurrence == 'trimestral':
                current_date = current_date + relativedelta(months=3)
            elif recurrence == 'semestral':
                current_date = current_date + relativedelta(months=6)
            elif recurrence == 'anual':
                current_date = current_date + relativedelta(years=1)
            else:
                break
        
        return dates
    
    @staticmethod
    def _generate_obligations_from_type(company, state, obligation_type, start_date, end_date):
        """Gera obrigações baseado apenas no tipo de obrigação cadastrado"""
        generated = 0
        skipped = 0
        
        # Calcular datas baseado na recorrência
        dates = ObligationPlanningService._calculate_recurrence_dates(
            obligation_type.recurrence,
            obligation_type.due_day,
            start_date,
            end_date
        )
        
        for due_date in dates:
            # Calcular competência (MM/AAAA)
            competence = due_date.strftime('%m/%Y')
            
            # Verificar se já existe uma obrigação para esta competência
            if Obligation.objects.filter(
                company=company,
                state=state,
                obligation_type=obligation_type,
                competence=competence
            ).exists():
                skipped += 1
                continue
            
            # Calcular data de entrega baseado na recorrência
            if obligation_type.recurrence == 'mensal':
                delivery_deadline = due_date + timedelta(days=15)
            elif obligation_type.recurrence == 'bimestral':
                delivery_deadline = due_date + timedelta(days=20)
            elif obligation_type.recurrence == 'trimestral':
                delivery_deadline = due_date + timedelta(days=30)
            elif obligation_type.recurrence == 'semestral':
                delivery_deadline = due_date + timedelta(days=45)
            elif obligation_type.recurrence == 'anual':
                delivery_deadline = due_date + timedelta(days=60)
            else:
                delivery_deadline = due_date + timedelta(days=30)
            
            # Criar obrigação com nome padrão baseado no tipo
            obligation_name = f"{obligation_type.name} - {state.code}"
            
            Obligation.objects.create(
                company=company,
                state=state,
                obligation_type=obligation_type,
                obligation_name=obligation_name,
                competence=competence,
                due_date=due_date,
                delivery_deadline=delivery_deadline,
                validity_start_date=start_date,
                validity_end_date=end_date,
                notes=f'Obrigação gerada automaticamente - {obligation_type.recurrence} - Competência {competence}'
            )
            generated += 1
        
        return generated, skipped
    
