"""
Views para o sistema de Despachos
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Count, F, Q
from django.utils import timezone
from django.db import transaction

from .models import Dispatch, DispatchSubtask, Company, Notification
from .serializers import DispatchSerializer, DispatchSubtaskSerializer
from .permissions import ReadOnlyOrCreateForUsuario, IsAdmin, IsAdminOrReadOnly
from .views import audit


class IsAdminOrResponsible(permissions.BasePermission):
    """
    Custom permission to only allow admins or the responsible user/creator of an object to edit it.
    Admins can do anything.
    """
    def has_permission(self, request, view):
        # Permitir listagem e criação para usuários autenticados
        if request.user.is_authenticated:
            return True
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.groups.filter(name='Admin').exists():
            return True
        
        # Read permissions are allowed to any authenticated user if they have access to the company
        if request.method in permissions.SAFE_METHODS:
            # Implement company scope check here if necessary, assuming user has company access
            # For now, any authenticated user can view if they are responsible or creator
            return obj.responsible == request.user or obj.created_by == request.user
        
        # Write permissions only to responsible or creator
        return obj.responsible == request.user or obj.created_by == request.user


class DispatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar despachos
    """
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        return DispatchSerializer
    
    def get_queryset(self):
        """Filtrar despachos por empresa do usuário"""
        user = self.request.user
        qs = Dispatch.objects.select_related('company', 'responsible', 'created_by').prefetch_related('subtasks')
        
        # Admin vê todos os despachos
        if user.is_superuser or user.groups.filter(name='Admin').exists():
            qs = qs.all()
        else:
            # Para teste, permitir que usuários vejam todos os despachos
            # TODO: Implementar filtro por empresa do usuário
            qs = qs.all()
        
        # Aplicar filtros
        company = self.request.query_params.get('company')
        category = self.request.query_params.get('category')
        responsible = self.request.query_params.get('responsible')
        status_filter = self.request.query_params.get('status')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if company:
            qs = qs.filter(company__id=company)
        if category:
            qs = qs.filter(category=category)
        if responsible:
            qs = qs.filter(responsible__id=responsible)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if start_date:
            qs = qs.filter(start_date__gte=start_date)
        if end_date:
            qs = qs.filter(end_date__lte=end_date)
        
        return qs
    
    def perform_create(self, serializer):
        obj = serializer.save()
        audit(self.request.user, 'created', obj)
    
    def perform_update(self, serializer):
        obj = serializer.save()
        audit(self.request.user, 'updated', obj)
    
    def perform_destroy(self, instance):
        audit(self.request.user, 'deleted', instance)
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Retorna informações de progresso do despacho"""
        dispatch = self.get_object()
        
        subtasks = dispatch.subtasks.all()
        total = subtasks.count()
        completed = subtasks.filter(status='CONCLUIDO').count()
        in_progress = subtasks.filter(status='EM_ANDAMENTO').count()
        not_started = subtasks.filter(status='NAO_INICIADO').count()
        
        return Response({
            'progress_pct': float(dispatch.progress_pct),
            'status': dispatch.status,
            'totals': {
                'total': total,
                'completed': completed,
                'in_progress': in_progress,
                'not_started': not_started
            }
        })
    
    @action(detail=True, methods=['post'])
    def subtasks(self, request, pk=None):
        """Criar subatividade para o despacho"""
        dispatch = self.get_object()
        
        serializer = DispatchSubtaskSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(dispatch=dispatch)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DispatchSubtaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar subatividades de despachos
    """
    
    def get_permissions(self):
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        dispatch_id = self.kwargs.get('dispatch_pk')
        user = self.request.user
        
        # Para teste, permitir acesso a todas as subatividades para usuários autenticados
        # TODO: Implementar validação de permissão mais específica
        return DispatchSubtask.objects.filter(dispatch_id=dispatch_id).order_by('order')
    
    def get_serializer_class(self):
        return DispatchSubtaskSerializer
    
    def list(self, request, *args, **kwargs):
        """Listar subatividades com debug"""
        dispatch_id = self.kwargs.get('dispatch_pk')
        print(f"DEBUG: Listando subatividades para dispatch_id: {dispatch_id}")
        
        queryset = self.get_queryset()
        print(f"DEBUG: Queryset retornado: {queryset}")
        print(f"DEBUG: Número de subatividades: {queryset.count()}")
        
        serializer = self.get_serializer(queryset, many=True)
        print(f"DEBUG: Dados serializados: {serializer.data}")
        
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        dispatch_id = self.kwargs.get('dispatch_pk')
        print(f"DEBUG: Criando subatividade para dispatch_id: {dispatch_id}")
        
        dispatch = Dispatch.objects.get(id=dispatch_id)
        print(f"DEBUG: Dispatch encontrado: {dispatch}")
        
        obj = serializer.save(dispatch=dispatch)
        print(f"DEBUG: Subatividade criada: {obj}")
        
        audit(self.request.user, 'created', obj)
    
    def perform_update(self, serializer):
        obj = serializer.save()
        audit(self.request.user, 'updated', obj)
    
    def perform_destroy(self, instance):
        audit(self.request.user, 'deleted', instance)
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def run_dispatch_notifications(request):
    """
    Executa notificações semanais para despachos
    """
    from .services_dispatch import DispatchNotificationService
    
    try:
        notifications_created = DispatchNotificationService.send_weekly_notifications()
        return Response({
            'notifications_created': notifications_created,
            'message': f'{notifications_created} notificações criadas para despachos'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsAdmin])
def recalculate_dispatch_progress(request):
    """
    Recalcula o progresso de todos os despachos
    """
    try:
        updated_count = 0
        
        # Buscar todos os despachos com suas subatividades
        dispatches = Dispatch.objects.select_related('company').prefetch_related('subtasks').all()
        
        for dispatch in dispatches:
            # Recalcular progresso
            dispatch.update_progress()
            dispatch.save()
            updated_count += 1
        
        return Response({
            'updated_count': updated_count,
            'message': f'Progresso recalculado para {updated_count} despachos.'
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
