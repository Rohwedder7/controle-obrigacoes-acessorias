from django.core.management.base import BaseCommand
from core.models import ObligationType

class Command(BaseCommand):
    help = 'Cria tipos de obrigação padrão'

    def handle(self, *args, **options):
        obligation_types = [
            {
                'name': 'Federal',
                'description': 'Obrigações acessórias federais (SPED, DCTF, DIRF, RAIS, CAGED, FGTS, INSS, ICMS, IPI)',
                'recurrence': 'mensal',
                'due_day': 15
            },
            {
                'name': 'Estadual',
                'description': 'Obrigações acessórias estaduais (ICMS, IPVA, ITR)',
                'recurrence': 'mensal',
                'due_day': 25
            },
            {
                'name': 'Municipal',
                'description': 'Obrigações acessórias municipais (ISS, IPTU, ITBI)',
                'recurrence': 'mensal',
                'due_day': 25
            },
            {
                'name': 'Regimes Especiais',
                'description': 'Obrigações acessórias para regimes especiais (Simples Nacional, MEI, etc.)',
                'recurrence': 'mensal',
                'due_day': 20
            }
        ]
        
        created_count = 0
        for ot in obligation_types:
            obj, created = ObligationType.objects.get_or_create(
                name=ot['name'], 
                defaults=ot 
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Obrigação criada: {ot["name"]}')
                )
            else:
                self.stdout.write(f'Obrigação já existe: {ot["name"]}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Total de {created_count} tipos de obrigação criados')
        )
