from django.core.management.base import BaseCommand
from core.services import NotificationService


class Command(BaseCommand):
    help = 'Verifica entregas atrasadas e notifica administradores'

    def handle(self, *args, **options):
        self.stdout.write('Verificando entregas atrasadas...')
        
        count = NotificationService.check_late_deliveries()
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'{count} notificacao(oes) de entrega atrasada criada(s) para administradores.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    'Nenhuma entrega atrasada encontrada ou notificacoes ja foram enviadas.'
                )
            )

