from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from core.models import ObligationType, Company, State, Obligation, User

class Command(BaseCommand):
    help = 'Gera obrigações automaticamente baseado na recorrência'

    def add_arguments(self, parser):
        parser.add_argument(
            '--months',
            type=int,
            default=3,
            help='Número de meses para gerar obrigações (padrão: 3)'
        )
        parser.add_argument(
            '--company-id',
            type=int,
            help='ID específico da empresa (opcional)'
        )

    def handle(self, *args, **options):
        months_ahead = options['months']
        company_id = options.get('company_id')
        
        self.stdout.write(f'🔄 Iniciando geração automática de obrigações para os próximos {months_ahead} meses...')
        
        # Filtrar empresas
        companies = Company.objects.filter(active=True)
        if company_id:
            companies = companies.filter(id=company_id)
        
        generated_count = 0
        skipped_count = 0
        
        for company in companies:
            for state in State.objects.all():
                for obligation_type in ObligationType.objects.all():
                    count, skipped = self.generate_obligations_for_company_state_type(
                        company, state, obligation_type, months_ahead
                    )
                    generated_count += count
                    skipped_count += skipped
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Geração concluída! {generated_count} obrigações criadas, {skipped_count} já existiam.'
            )
        )

    def generate_obligations_for_company_state_type(self, company, state, obligation_type, months_ahead):
        """Gera obrigações para uma combinação específica de empresa/estado/tipo"""
        today = timezone.now().date()
        end_date = today + relativedelta(months=months_ahead)
        
        generated = 0
        skipped = 0
        
        # Calcular datas baseado na recorrência
        dates = self.calculate_recurrence_dates(
            obligation_type.recurrence,
            obligation_type.due_day,
            today,
            end_date
        )
        
        for due_date in dates:
            # Calcular competência (MM/AAAA)
            competence = due_date.strftime('%m/%Y')
            
            # Verificar se já existe
            if Obligation.objects.filter(
                company=company,
                state=state,
                obligation_type=obligation_type,
                competence=competence
            ).exists():
                skipped += 1
                continue
            
            # Calcular data de entrega (30 dias após vencimento por padrão)
            delivery_deadline = due_date + timedelta(days=30)
            
            # Criar obrigação
            Obligation.objects.create(
                company=company,
                state=state,
                obligation_type=obligation_type,
                competence=competence,
                due_date=due_date,
                delivery_deadline=delivery_deadline,
                validity_start_date=today,
                validity_end_date=end_date,
                notes=f'Obrigação gerada automaticamente - {obligation_type.recurrence}'
            )
            generated += 1
        
        return generated, skipped

    def calculate_recurrence_dates(self, recurrence, due_day, start_date, end_date):
        """Calcula as datas de vencimento baseado na recorrência"""
        dates = []
        current_date = start_date
        
        # Ajustar para o próximo período baseado na recorrência
        if recurrence == 'mensal':
            # Próximo mês
            current_date = start_date.replace(day=due_day) if start_date.day <= due_day else (start_date + relativedelta(months=1)).replace(day=due_day)
        elif recurrence == 'bimestral':
            # Próximo bimestre
            months_to_add = (2 - (start_date.month % 2)) % 2
            if months_to_add == 0 and start_date.day <= due_day:
                months_to_add = 2
            elif months_to_add == 0:
                months_to_add = 2
            current_date = (start_date + relativedelta(months=months_to_add)).replace(day=due_day)
        elif recurrence == 'trimestral':
            # Próximo trimestre
            months_to_add = (3 - (start_date.month % 3)) % 3
            if months_to_add == 0 and start_date.day <= due_day:
                months_to_add = 3
            elif months_to_add == 0:
                months_to_add = 3
            current_date = (start_date + relativedelta(months=months_to_add)).replace(day=due_day)
        elif recurrence == 'semestral':
            # Próximo semestre
            months_to_add = (6 - (start_date.month % 6)) % 6
            if months_to_add == 0 and start_date.day <= due_day:
                months_to_add = 6
            elif months_to_add == 0:
                months_to_add = 6
            current_date = (start_date + relativedelta(months=months_to_add)).replace(day=due_day)
        elif recurrence == 'anual':
            # Próximo ano
            current_date = start_date.replace(day=due_day, month=start_date.month)
            if current_date <= start_date:
                current_date = current_date.replace(year=current_date.year + 1)
        
        # Gerar datas até o final do período
        while current_date <= end_date:
            dates.append(current_date)
            
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
                break  # Para recorrências específicas
        
        return dates
