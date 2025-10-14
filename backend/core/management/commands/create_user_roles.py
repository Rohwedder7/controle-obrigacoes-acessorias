from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User

class Command(BaseCommand):
    help = 'Cria os grupos de usuários Admin e Usuario se não existirem e atribui superusers ao grupo Admin'

    def handle(self, *args, **options):
        # Criar grupo Admin se não existir
        admin_group, created = Group.objects.get_or_create(name='Admin')
        if created:
            self.stdout.write(
                self.style.SUCCESS('Grupo "Admin" criado com sucesso')
            )
        else:
            self.stdout.write('Grupo "Admin" já existe')

        # Criar grupo Usuario se não existir
        user_group, created = Group.objects.get_or_create(name='Usuario')
        if created:
            self.stdout.write(
                self.style.SUCCESS('Grupo "Usuario" criado com sucesso')
            )
        else:
            self.stdout.write('Grupo "Usuario" já existe')

        # Atribuir todos os superusers ao grupo Admin
        superusers = User.objects.filter(is_superuser=True)
        for user in superusers:
            if not user.groups.filter(name='Admin').exists():
                user.groups.add(admin_group)
                self.stdout.write(f'Superuser "{user.username}" adicionado ao grupo Admin')

        self.stdout.write(
            self.style.SUCCESS('Comando executado com sucesso!')
        )
