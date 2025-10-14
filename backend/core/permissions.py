from rest_framework import permissions
from django.contrib.auth.models import Group

class IsAdmin(permissions.BasePermission):
    """Permissão para usuários Admin ou superuser"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Se for superuser, automaticamente é Admin
        if request.user.is_superuser:
            # Garantir que está no grupo Admin
            admin_group, created = Group.objects.get_or_create(name='Admin')
            if not request.user.groups.filter(name='Admin').exists():
                request.user.groups.add(admin_group)
            return True
        
        return request.user.groups.filter(name='Admin').exists()

class IsUsuario(permissions.BasePermission):
    """Permissão para usuários do grupo Usuario"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='Usuario').exists()

class ReadOnlyOrCreateForUsuario(permissions.BasePermission):
    """
    Permite GET/HEAD/OPTIONS para todos autenticados e POST/PATCH/PUT para Admin/Usuario.
    DELETE apenas para Admin.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Métodos de leitura sempre permitidos para autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # POST/PATCH/PUT permitido para Admin e Usuario
        if request.method in ['POST', 'PATCH', 'PUT']:
            return (
                request.user.is_superuser or 
                request.user.groups.filter(name__in=['Admin', 'Usuario']).exists()
            )
        
        # DELETE apenas para Admin (incluindo superuser)
        if request.method == 'DELETE':
            return (
                request.user.is_superuser or 
                request.user.groups.filter(name='Admin').exists()
            )
        
        return False

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite leitura para todos autenticados e escrita apenas para Admin
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Métodos de leitura sempre permitidos para autenticados
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Escrita apenas para Admin (incluindo superuser)
        return (
            request.user.is_superuser or 
            request.user.groups.filter(name='Admin').exists()
        )

class IsApprover(permissions.BasePermission):
    """
    Permissão para aprovadores (Admin ou grupo Aprovador)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superuser sempre tem permissão
        if request.user.is_superuser:
            return True
        
        # Verificar se está no grupo Admin ou Aprovador
        return request.user.groups.filter(name__in=['Admin', 'Aprovador']).exists()