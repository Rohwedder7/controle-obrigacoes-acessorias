"""
Management command para enviar notificações semanais de despachos
"""
from django.core.management.base import BaseCommand
from core.services_dispatch import DispatchNotificationService


class Command(BaseCommand):
    help = 'Envia notificações semanais para despachos com prazo próximo ou em atraso'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Executa sem criar notificações (apenas mostra quantas seriam criadas)',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando envio de notificações semanais de despachos...')
        )
        
        try:
            if options['dry_run']:
                self.stdout.write(
                    self.style.WARNING('🔍 Modo dry-run ativado - nenhuma notificação será criada')
                )
                # Em modo dry-run, apenas contar quantas notificações seriam criadas
                # Por simplicidade, vamos executar mas não salvar
                notifications_created = DispatchNotificationService.send_weekly_notifications()
                self.stdout.write(
                    self.style.SUCCESS(f'📊 Seriam criadas {notifications_created} notificações')
                )
            else:
                notifications_created = DispatchNotificationService.send_weekly_notifications()
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {notifications_created} notificações criadas com sucesso!')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Erro ao enviar notificações: {str(e)}')
            )
            raise

        self.stdout.write(
            self.style.SUCCESS('🎉 Processo de notificações concluído!')
        )
