from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User, Group
from django.db import models
from django.db.models import Q
from django.utils import timezone
from datetime import datetime
from .models import AuditLog
from .permissions import IsAdmin
from .serializers import UserSerializer

class UserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAdmin])
def list_users_admin(request):
    """
    Lista todos os usuários do sistema com informações de grupos
    GET /api/users/admin/
    """
    try:
        search = request.GET.get('search', '')
        users = User.objects.all().order_by('username')
        
        # Aplicar filtro de busca se fornecido
        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Garantir que todos os usuários tenham um grupo
        usuario_group, _ = Group.objects.get_or_create(name='Usuario')
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        
        # Atribuir superusers ao grupo Admin se não estiverem
        for user in users:
            if user.is_superuser and not user.groups.filter(name='Admin').exists():
                user.groups.add(admin_group)
            elif not user.is_superuser and not user.groups.exists():
                # Usuários comuns sem grupo vão para Usuario
                user.groups.add(usuario_group)
        
        # Serializar dados com informações de grupos
        user_data = []
        for user in users:
            groups = list(user.groups.values_list('name', flat=True))
            
            # Formatar última data de login
            last_login_formatted = None
            if user.last_login:
                last_login_formatted = user.last_login.strftime('%d/%m/%Y às %H:%M')
            else:
                last_login_formatted = 'Nunca'
            
            user_info = {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'groups': groups,
                'role': groups[0] if groups else 'Usuario',
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
                'date_joined': user.date_joined.strftime('%d/%m/%Y às %H:%M') if user.date_joined else None,
                'last_login': user.last_login,
                'last_login_formatted': last_login_formatted,
            }
            user_data.append(user_info)
        
        return Response({
            'results': user_data,
            'count': len(user_data)
        })
        
    except Exception as e:
        return Response({
            'error': f'Erro interno do servidor: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAdmin])
def set_user_role(request, user_id):
    """
    Altera o papel/role de um usuário
    PATCH /api/users/{id}/role/
    Body: { "role": "Admin" | "Usuario" }
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    role = request.data.get('role')
    if role not in ['Admin', 'Usuario']:
        return Response(
            {'error': 'Role deve ser "Admin" ou "Usuario"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar se não é o último Admin
    if user.groups.filter(name='Admin').exists() and role == 'Usuario':
        admin_count = User.objects.filter(groups__name='Admin').count()
        if admin_count <= 1:
            return Response(
                {'error': 'Não é possível rebaixar o último Admin do sistema'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Remover usuário de todos os grupos
    user.groups.clear()
    
    # Adicionar ao novo grupo
    group, created = Group.objects.get_or_create(name=role)
    user.groups.add(group)
    
    # Registrar no AuditLog
    AuditLog.objects.create(
        user=request.user,
        action='grant_role',
        model='User',
        object_id=str(user.id),
        changes={
            'old_groups': list(User.objects.get(id=user_id).groups.values_list('name', flat=True)),
            'new_role': role
        }
    )
    
    return Response({
        'message': f'Role do usuário {user.username} alterado para {role}',
        'user_id': user.id,
        'username': user.username,
        'new_role': role
    })

@api_view(['GET'])
@permission_classes([IsAdmin])
def get_user_history(request, user_id):
    """
    Retorna o histórico de ações (AuditLog) de um usuário específico
    GET /api/users/{id}/history/
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Buscar logs do usuário
    logs = AuditLog.objects.filter(user=user).order_by('-timestamp')
    
    # Paginação
    paginator = UserPagination()
    paginated_logs = paginator.paginate_queryset(logs, request)
    
    # Serializar logs
    log_data = []
    for log in paginated_logs:
        log_info = {
            'id': log.id,
            'action': log.action,
            'model': log.model,
            'object_id': log.object_id,
            'timestamp': log.timestamp,
            'changes': log.changes,
        }
        log_data.append(log_info)
    
    return paginator.get_paginated_response({
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        },
        'history': log_data
    })

@api_view(['GET'])
@permission_classes([IsAdmin])
def get_user_stats(request):
    """
    Retorna estatísticas dos usuários do sistema
    GET /api/users/stats/
    """
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    admin_users = User.objects.filter(groups__name='Admin').count()
    usuario_users = User.objects.filter(groups__name='Usuario').count()
    users_without_group = User.objects.filter(groups__isnull=True).count()
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'admin_users': admin_users,
        'usuario_users': usuario_users,
        'users_without_group': users_without_group
    })

@api_view(['DELETE'])
@permission_classes([IsAdmin])
def delete_user(request, user_id):
    """
    Exclui um usuário do sistema
    DELETE /api/users/{id}/
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    # Verificar se não é o último Admin
    if user.is_superuser or user.groups.filter(name='Admin').exists():
        admin_count = User.objects.filter(
            models.Q(is_superuser=True) | models.Q(groups__name='Admin')
        ).distinct().count()
        if admin_count <= 1:
            return Response(
                {'error': 'Não é possível excluir o último Admin do sistema'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Não permitir que o usuário se exclua a si mesmo
    if user.id == request.user.id:
        return Response(
            {'error': 'Você não pode excluir sua própria conta'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Registrar no AuditLog antes de excluir
    AuditLog.objects.create(
        user=request.user,
        action='deleted',
        model='User',
        object_id=str(user.id),
        changes={
            'username': user.username,
            'email': user.email,
            'groups': list(user.groups.values_list('name', flat=True))
        }
    )
    
    username = user.username
    user.delete()
    
    return Response({
        'message': f'Usuário {username} excluído com sucesso',
        'deleted_user_id': user_id
    })

@api_view(['POST'])
@permission_classes([IsAdmin])
def change_user_password(request, user_id):
    """
    Altera a senha de um usuário
    POST /api/users/{id}/password/
    Body: { "new_password": "nova_senha" }
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Usuário não encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    new_password = request.data.get('new_password')
    if not new_password:
        return Response({'error': 'Nova senha é obrigatória'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 6:
        return Response({'error': 'A senha deve ter pelo menos 6 caracteres'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Registrar no AuditLog antes de alterar
    AuditLog.objects.create(
        user=request.user,
        action='password_changed',
        model='User',
        object_id=str(user.id),
        changes={
            'username': user.username,
            'email': user.email,
            'action': 'Senha alterada por admin'
        }
    )
    
    # Alterar a senha
    user.set_password(new_password)
    user.save()
    
    # Forçar refresh do usuário para garantir que a senha foi salva
    user.refresh_from_db()
    
    # Verificar se a senha foi realmente alterada
    if user.check_password(new_password):
        return Response({
            'message': f'Senha do usuário {user.username} alterada com sucesso',
            'user_id': user_id,
            'success': True
        })
    else:
        return Response({
            'error': 'Erro ao alterar senha - senha não foi salva corretamente'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdmin])
def create_user(request):
    """
    Cria um novo usuário no sistema (Admin apenas)
    POST /api/users/create/
    Body: {
        "username": "usuario123",
        "email": "usuario@exemplo.com",
        "first_name": "Nome",
        "last_name": "Sobrenome",
        "password": "senha_segura",
        "role": "Admin" | "Usuario"
    }
    """
    from django.db import transaction
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    import re
    
    # Extrair e validar dados
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    password = request.data.get('password', '').strip()
    role = request.data.get('role', 'Usuario').strip()
    
    # Validações
    errors = {}
    
    if not username:
        errors['username'] = 'Username é obrigatório'
    elif len(username) > 150:
        errors['username'] = 'Username deve ter no máximo 150 caracteres'
    elif not re.match(r'^[a-zA-Z0-9_]+$', username):
        errors['username'] = 'Username deve conter apenas letras, números e underscore'
    elif User.objects.filter(username=username).exists():
        errors['username'] = 'Este username já está em uso'
    
    if not email:
        errors['email'] = 'E-mail é obrigatório'
    else:
        try:
            validate_email(email)
            if User.objects.filter(email=email).exists():
                errors['email'] = 'Este e-mail já está em uso'
        except ValidationError:
            errors['email'] = 'E-mail inválido'
    
    if not password:
        errors['password'] = 'Senha é obrigatória'
    elif len(password) < 8:
        errors['password'] = 'Senha deve ter pelo menos 8 caracteres'
    
    if role not in ['Admin', 'Usuario']:
        errors['role'] = 'Role deve ser "Admin" ou "Usuario"'
    
    if not first_name:
        errors['first_name'] = 'Nome é obrigatório'
    
    if not last_name:
        errors['last_name'] = 'Sobrenome é obrigatório'
    
    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    
    # Criar usuário dentro de uma transação
    try:
        with transaction.atomic():
            # Criar usuário
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                is_active=True
            )
            
            # Atribuir ao grupo
            group, created = Group.objects.get_or_create(name=role)
            user.groups.add(group)
            
            # Registrar no AuditLog
            AuditLog.objects.create(
                user=request.user,
                action='create_user',
                model='User',
                object_id=str(user.id),
                changes={
                    'username': username,
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': role,
                    'created_by': request.user.username
                }
            )
            
            # Retornar dados sem expor hash de senha
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role,
                'is_active': user.is_active,
                'created_at': user.date_joined.isoformat(),
                'message': f'Usuário {username} criado com sucesso'
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'error': f'Erro ao criar usuário: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)