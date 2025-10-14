"""
Views para o fluxo de aprovação de entregas
"""
import os
import mimetypes
from django.http import FileResponse, HttpResponse
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Submission, SubmissionAttachment, Notification, AuditLog
from .permissions import IsApprover
from .serializers import SubmissionSerializer
from .services import NotificationService


def audit_approval_action(user, submission, action, comment=None):
    """
    Registrar ação de aprovação no audit log
    """
    changes = {
        'approval_status': submission.approval_status,
        'action': action,
    }
    if comment:
        changes['comment'] = comment
    
    AuditLog.objects.create(
        user=user,
        action=action,
        model='Submission',
        object_id=str(submission.id),
        changes=changes
    )


@api_view(['GET'])
@permission_classes([IsApprover])
def pending_approvals(request):
    """
    GET /api/approvals/pending/
    Lista submissions pendentes de aprovação (somente Admin/Aprovador)
    
    Query params:
    - company: ID da empresa
    - obligation_type: ID do tipo de obrigação
    - search: busca por nome de empresa ou obrigação
    - start_date: data inicial
    - end_date: data final
    """
    from django.db.models import Q
    
    # Query base - apenas pendentes
    queryset = Submission.objects.filter(
        approval_status='pending_review'
    ).select_related(
        'obligation__company',
        'obligation__state',
        'obligation__obligation_type',
        'delivered_by',
        'approval_decision_by'
    ).prefetch_related('attachments').order_by('-delivered_at')
    
    # Filtros
    company_id = request.GET.get('company')
    obligation_type_id = request.GET.get('obligation_type')
    search = request.GET.get('search', '').strip()
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if company_id:
        queryset = queryset.filter(obligation__company_id=company_id)
    
    if obligation_type_id:
        queryset = queryset.filter(obligation__obligation_type_id=obligation_type_id)
    
    if search:
        queryset = queryset.filter(
            Q(obligation__company__name__icontains=search) |
            Q(obligation__obligation_name__icontains=search) |
            Q(obligation__obligation_type__name__icontains=search)
        )
    
    if start_date:
        queryset = queryset.filter(delivered_at__date__gte=start_date)
    
    if end_date:
        queryset = queryset.filter(delivered_at__date__lte=end_date)
    
    # Serializar dados
    results = []
    for submission in queryset:
        # Contar anexos
        attachments_count = submission.attachments.count()
        if submission.receipt_file:
            attachments_count += 1
        
        # Preparar lista de anexos com IDs
        attachments_list = []
        if submission.receipt_file:
            attachments_list.append({
                'id': f'receipt_{submission.id}',
                'type': 'receipt',
                'filename': os.path.basename(submission.receipt_file.name),
                'url': submission.receipt_file.url if submission.receipt_file else None
            })
        
        for att in submission.attachments.all():
            attachments_list.append({
                'id': att.id,
                'type': 'attachment',
                'filename': att.original_filename,
                'uploaded_at': att.created_at.isoformat()
            })
        
        results.append({
            'id': submission.id,
            'company': {
                'id': submission.obligation.company.id,
                'name': submission.obligation.company.name,
                'cnpj': submission.obligation.company.cnpj
            },
            'obligation': {
                'id': submission.obligation.id,
                'name': submission.obligation.obligation_name or submission.obligation.obligation_type.name,
                'type': submission.obligation.obligation_type.name,
                'state': submission.obligation.state.code,
                'competence': submission.obligation.competence,
                'due_date': submission.obligation.due_date.isoformat()
            },
            'delivery_date': submission.delivery_date.isoformat(),
            'delivered_at': submission.delivered_at.isoformat(),
            'delivered_by': {
                'id': submission.delivered_by.id if submission.delivered_by else None,
                'username': submission.delivered_by.username if submission.delivered_by else None,
                'full_name': f"{submission.delivered_by.first_name} {submission.delivered_by.last_name}".strip() if submission.delivered_by else None
            },
            'submission_type': submission.submission_type,
            'comments': submission.comments,
            'attachments_count': attachments_count,
            'attachments': attachments_list,
            'approval_status': submission.approval_status
        })
    
    return Response({
        'count': len(results),
        'results': results
    })


@api_view(['POST'])
@permission_classes([IsApprover])
def approve_submission(request, submission_id):
    """
    POST /api/approvals/{submission_id}/approve/
    Aprovar uma submission (somente Admin/Aprovador)
    """
    try:
        submission = Submission.objects.select_related(
            'obligation__company',
            'delivered_by'
        ).get(id=submission_id)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar se está pendente
    if submission.approval_status != 'pending_review':
        return Response(
            {'error': f'Submission não está pendente de revisão (status atual: {submission.approval_status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        # Atualizar submission
        submission.approval_status = 'approved'
        submission.approval_decision_at = timezone.now()
        submission.approval_decision_by = request.user
        submission.approval_comment = request.data.get('comment', '')
        submission.save()
        
        # Registrar no audit log
        audit_approval_action(request.user, submission, 'approved', submission.approval_comment)
        
        # Notificar o autor usando NotificationService
        NotificationService.create_approval_notification(
            submission=submission,
            approver=request.user,
            comment=submission.approval_comment
        )
    
    return Response({
        'message': 'Submission aprovada com sucesso',
        'submission': {
            'id': submission.id,
            'approval_status': submission.approval_status,
            'approval_decision_at': submission.approval_decision_at.isoformat(),
            'approval_decision_by': request.user.username
        }
    })


@api_view(['POST'])
@permission_classes([IsApprover])
def reject_submission(request, submission_id):
    """
    POST /api/approvals/{submission_id}/reject/
    Recusar uma submission (somente Admin/Aprovador)
    
    Body: { "comment": "motivo da recusa..." }
    """
    try:
        submission = Submission.objects.select_related(
            'obligation__company',
            'delivered_by'
        ).get(id=submission_id)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validar comentário obrigatório
    comment = request.data.get('comment', '').strip()
    if not comment:
        return Response(
            {'error': 'O comentário é obrigatório para recusar uma entrega'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se está pendente
    if submission.approval_status != 'pending_review':
        return Response(
            {'error': f'Submission não está pendente de revisão (status atual: {submission.approval_status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        # Atualizar submission
        submission.approval_status = 'rejected'
        submission.approval_decision_at = timezone.now()
        submission.approval_decision_by = request.user
        submission.approval_comment = comment
        submission.save()
        
        # Registrar no audit log
        audit_approval_action(request.user, submission, 'rejected', comment)
        
        # Notificar o autor usando NotificationService
        NotificationService.create_rejection_notification(
            submission=submission,
            approver=request.user,
            comment=comment
        )
    
    return Response({
        'message': 'Submission recusada',
        'submission': {
            'id': submission.id,
            'approval_status': submission.approval_status,
            'approval_decision_at': submission.approval_decision_at.isoformat(),
            'approval_decision_by': request.user.username,
            'approval_comment': comment
        }
    })


@api_view(['POST'])
@permission_classes([IsApprover])
def request_revision(request, submission_id):
    """
    POST /api/approvals/{submission_id}/request-revision/
    Solicitar revisão de uma submission (somente Admin/Aprovador)
    
    Body: { "comment": "o que precisa ser corrigido..." }
    """
    try:
        submission = Submission.objects.select_related(
            'obligation__company',
            'delivered_by'
        ).get(id=submission_id)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validar comentário obrigatório
    comment = request.data.get('comment', '').strip()
    if not comment:
        return Response(
            {'error': 'O comentário é obrigatório para solicitar revisão'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se está pendente
    if submission.approval_status != 'pending_review':
        return Response(
            {'error': f'Submission não está pendente de revisão (status atual: {submission.approval_status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        # Atualizar submission
        submission.approval_status = 'needs_revision'
        submission.approval_decision_at = timezone.now()
        submission.approval_decision_by = request.user
        submission.approval_comment = comment
        submission.save()
        
        # Registrar no audit log
        audit_approval_action(request.user, submission, 'revision_requested', comment)
        
        # Notificar o autor usando NotificationService
        NotificationService.create_revision_notification(
            submission=submission,
            approver=request.user,
            comment=comment
        )
    
    return Response({
        'message': 'Revisão solicitada',
        'submission': {
            'id': submission.id,
            'approval_status': submission.approval_status,
            'approval_decision_at': submission.approval_decision_at.isoformat(),
            'approval_decision_by': request.user.username,
            'approval_comment': comment
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resubmit_submission(request, submission_id):
    """
    POST /api/approvals/{submission_id}/resubmit/
    Reenviar uma submission (somente autor)
    
    Body/FormData:
    - delivery_date: nova data de entrega
    - submission_type: tipo (original/retificadora)
    - comments: comentários (opcional)
    - receipt_file: novo arquivo (opcional)
    """
    try:
        submission = Submission.objects.select_related(
            'obligation__company',
            'delivered_by'
        ).get(id=submission_id)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar ownership (somente o autor pode reenviar)
    if submission.delivered_by != request.user:
        return Response(
            {'error': 'Você não tem permissão para reenviar esta entrega'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Verificar se precisa de revisão
    if submission.approval_status != 'needs_revision':
        return Response(
            {'error': f'Esta entrega não está aguardando revisão (status atual: {submission.approval_status})'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar campos obrigatórios
    delivery_date = request.data.get('delivery_date')
    submission_type = request.data.get('submission_type', 'retificadora')
    
    if not delivery_date:
        return Response(
            {'error': 'Data de entrega é obrigatória'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar tipo
    if submission_type not in ['original', 'retificadora']:
        return Response(
            {'error': 'Tipo de entrega inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        # Atualizar submission
        submission.delivery_date = delivery_date
        submission.submission_type = submission_type
        submission.comments = request.data.get('comments', '')
        submission.approval_status = 'pending_review'
        submission.approval_decision_at = None
        submission.approval_decision_by = None
        # Manter histórico do comentário anterior, mas adicionar nota de reenvio
        old_comment = submission.approval_comment or ''
        submission.approval_comment = f"[Reenviado em {timezone.now().strftime('%d/%m/%Y %H:%M')}]\n{old_comment}"
        
        # Atualizar arquivo se fornecido
        if 'receipt_file' in request.FILES:
            submission.receipt_file = request.FILES['receipt_file']
        
        submission.save()
        
        # Registrar no audit log
        audit_approval_action(request.user, submission, 'resubmitted', 'Entrega reenviada após revisão')
    
    return Response({
        'message': 'Entrega reenviada com sucesso',
        'submission': {
            'id': submission.id,
            'approval_status': submission.approval_status,
            'delivery_date': submission.delivery_date.isoformat(),
            'submission_type': submission.submission_type
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def submission_timeline(request, submission_id):
    """
    GET /api/approvals/{submission_id}/timeline/
    Obter timeline completa de uma submission
    
    Retorna todos os eventos de aprovação + dados da submission
    """
    try:
        submission = Submission.objects.select_related(
            'obligation__company',
            'obligation__state',
            'obligation__obligation_type',
            'delivered_by',
            'approval_decision_by'
        ).prefetch_related('attachments').get(id=submission_id)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar permissão: Admin/Aprovador ou autor
    is_approver = (
        request.user.is_superuser or
        request.user.groups.filter(name__in=['Admin', 'Aprovador']).exists()
    )
    is_author = submission.delivered_by == request.user
    
    if not (is_approver or is_author):
        return Response(
            {'error': 'Você não tem permissão para visualizar esta entrega'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Buscar eventos do audit log
    events = AuditLog.objects.filter(
        model='Submission',
        object_id=str(submission.id),
        action__in=['created', 'approved', 'rejected', 'revision_requested', 'resubmitted']
    ).select_related('user').order_by('timestamp')
    
    # Montar timeline
    timeline = []
    
    # Evento de criação (sempre existe)
    timeline.append({
        'event': 'submitted',
        'label': 'Entrega Enviada',
        'timestamp': submission.delivered_at.isoformat(),
        'by': {
            'username': submission.delivered_by.username if submission.delivered_by else None,
            'full_name': f"{submission.delivered_by.first_name} {submission.delivered_by.last_name}".strip() if submission.delivered_by else None
        },
        'comment': submission.comments or None,
        'icon': '📤',
        'color': 'blue'
    })
    
    # Eventos do audit log
    for event in events:
        event_data = {
            'event': event.action,
            'timestamp': event.timestamp.isoformat(),
            'by': {
                'username': event.user.username if event.user else None,
                'full_name': f"{event.user.first_name} {event.user.last_name}".strip() if event.user else None
            },
            'comment': event.changes.get('comment') if event.changes else None
        }
        
        # Personalizar por tipo de evento
        if event.action == 'approved':
            event_data.update({'label': 'Aprovada', 'icon': '✅', 'color': 'green'})
        elif event.action == 'rejected':
            event_data.update({'label': 'Recusada', 'icon': '❌', 'color': 'red'})
        elif event.action == 'revision_requested':
            event_data.update({'label': 'Revisão Solicitada', 'icon': '⚠️', 'color': 'yellow'})
        elif event.action == 'resubmitted':
            event_data.update({'label': 'Reenviada', 'icon': '🔄', 'color': 'purple'})
        
        timeline.append(event_data)
    
    # Status atual
    status_info = {
        'pending_review': {'label': 'Pendente de Revisão', 'icon': '⏳', 'color': 'gray'},
        'approved': {'label': 'Aprovada', 'icon': '✅', 'color': 'green'},
        'rejected': {'label': 'Recusada', 'icon': '❌', 'color': 'red'},
        'needs_revision': {'label': 'Necessita Revisão', 'icon': '⚠️', 'color': 'yellow'}
    }
    
    return Response({
        'submission': {
            'id': submission.id,
            'company': submission.obligation.company.name,
            'obligation': submission.obligation.obligation_name or submission.obligation.obligation_type.name,
            'competence': submission.obligation.competence,
            'state': submission.obligation.state.code,
            'delivery_date': submission.delivery_date.isoformat(),
            'submission_type': submission.submission_type,
            'approval_status': submission.approval_status,
            'approval_comment': submission.approval_comment,
            'status_info': status_info.get(submission.approval_status, {})
        },
        'timeline': timeline
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_attachment(request, submission_id, attachment_id):
    """
    GET /api/approvals/{submission_id}/attachments/{attachment_id}/download
    Download seguro de anexo
    
    Autorização: Admin/Aprovador ou autor da submission
    """
    try:
        submission = Submission.objects.select_related('delivered_by').get(id=submission_id)
    except Submission.DoesNotExist:
        return Response(
            {'error': 'Submission não encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar permissão: Admin/Aprovador ou autor
    is_approver = (
        request.user.is_superuser or
        request.user.groups.filter(name__in=['Admin', 'Aprovador']).exists()
    )
    is_author = submission.delivered_by == request.user
    
    if not (is_approver or is_author):
        return Response(
            {'error': 'Você não tem permissão para baixar este anexo'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Verificar se é receipt_file ou attachment
    if attachment_id.startswith('receipt_'):
        # Download do receipt_file
        if not submission.receipt_file:
            return Response(
                {'error': 'Arquivo de recibo não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        file_path = submission.receipt_file.path
        filename = os.path.basename(submission.receipt_file.name)
        file_obj = submission.receipt_file
    else:
        # Download de attachment
        try:
            attachment = SubmissionAttachment.objects.get(id=attachment_id, submission=submission)
        except SubmissionAttachment.DoesNotExist:
            return Response(
                {'error': 'Anexo não encontrado ou não pertence a esta submission'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        file_path = attachment.file.path
        filename = attachment.original_filename
        file_obj = attachment.file
    
    # Registrar no audit log
    AuditLog.objects.create(
        user=request.user,
        action='download_attachment',
        model='Submission',
        object_id=str(submission.id),
        changes={'attachment_id': str(attachment_id), 'filename': filename}
    )
    
    # Retornar arquivo
    try:
        content_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type or 'application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    except Exception as e:
        return Response(
            {'error': f'Erro ao baixar arquivo: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_deliveries(request):
    """
    GET /api/approvals/my-deliveries/
    Listar entregas do usuário logado com status e timeline
    """
    # Query: apenas entregas do usuário logado
    queryset = Submission.objects.filter(
        delivered_by=request.user
    ).select_related(
        'obligation__company',
        'obligation__state',
        'obligation__obligation_type',
        'approval_decision_by'
    ).prefetch_related('attachments').order_by('-delivered_at')
    
    # Filtros opcionais
    status_filter = request.GET.get('status')
    if status_filter:
        queryset = queryset.filter(approval_status=status_filter)
    
    # Serializar dados
    results = []
    for submission in queryset:
        # Contar anexos
        attachments_count = submission.attachments.count()
        if submission.receipt_file:
            attachments_count += 1
        
        # Status info
        status_info = {
            'pending_review': {'label': 'Pendente de Revisão', 'icon': '⏳', 'color': 'gray'},
            'approved': {'label': 'Aprovada', 'icon': '✅', 'color': 'green'},
            'rejected': {'label': 'Recusada', 'icon': '❌', 'color': 'red'},
            'needs_revision': {'label': 'Necessita Revisão', 'icon': '⚠️', 'color': 'yellow'}
        }
        
        results.append({
            'id': submission.id,
            'company': submission.obligation.company.name,
            'company_cnpj': submission.obligation.company.cnpj,
            'obligation': submission.obligation.obligation_name or submission.obligation.obligation_type.name,
            'obligation_type': submission.obligation.obligation_type.name,
            'state': submission.obligation.state.code,
            'competence': submission.obligation.competence,
            'delivery_date': submission.delivery_date.isoformat(),
            'delivered_at': submission.delivered_at.isoformat(),
            'submission_type': submission.submission_type,
            'approval_status': submission.approval_status,
            'approval_comment': submission.approval_comment,
            'approval_decision_at': submission.approval_decision_at.isoformat() if submission.approval_decision_at else None,
            'approval_decision_by': submission.approval_decision_by.username if submission.approval_decision_by else None,
            'attachments_count': attachments_count,
            'can_resubmit': submission.approval_status == 'needs_revision',
            'status_info': status_info.get(submission.approval_status, {})
        })
    
    return Response({
        'count': len(results),
        'results': results
    })

