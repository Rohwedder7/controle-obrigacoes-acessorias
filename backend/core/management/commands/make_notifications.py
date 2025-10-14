"""
Management command para gerar notificações de obrigações.

Executa:
- Verificação de obrigações próximas do vencimento (3 dias)
- Verificação de obrigações em atraso

Uso:
    python manage.py make_notifications
    python manage.py make_notifications --days-ahead 7

Recomendado executar diariamente via cron/task scheduler.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from core.services import NotificationService


class Command(BaseCommand):
    help = 'Gera notificações de obrigações próximas do vencimento e em atraso'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=3,
            help='Número de dias à frente para verificar vencimentos (padrão: 3)'
        )

    def handle(self, *args, **options):
        days_ahead = options['days_ahead']
        
        self.stdout.write(self.style.NOTICE(f'\n🔔 Iniciando geração de notificações...'))
        self.stdout.write(self.style.NOTICE(f'Data/Hora: {timezone.now().strftime("%d/%m/%Y %H:%M:%S")}'))
        self.stdout.write(self.style.NOTICE(f'Verificando vencimentos nos próximos {days_ahead} dias\n'))
        
        try:
            # 1. Verificar obrigações próximas do vencimento
            self.stdout.write('📅 Verificando obrigações próximas do vencimento...')
            due_soon_count = NotificationService.check_due_dates(days_ahead=days_ahead)
            self.stdout.write(
                self.style.SUCCESS(f'✅ {due_soon_count} notificação(ões) de vencimento próximo criada(s)')
            )
            
            # 2. Verificar obrigações em atraso
            self.stdout.write('\n⏰ Verificando obrigações em atraso...')
            overdue_count = NotificationService.check_overdue_obligations()
            self.stdout.write(
                self.style.SUCCESS(f'✅ {overdue_count} notificação(ões) de atraso criada(s)')
            )
            
            # Resumo final
            total = due_soon_count + overdue_count
            self.stdout.write('\n' + '='*60)
            self.stdout.write(
                self.style.SUCCESS(f'✨ RESUMO: {total} notificação(ões) criada(s) no total')
            )
            self.stdout.write('='*60 + '\n')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n❌ Erro ao gerar notificações: {str(e)}')
            )
            raise e

