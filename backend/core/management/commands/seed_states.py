from django.core.management.base import BaseCommand
from core.models import State

class Command(BaseCommand):
    help = 'Cadastra todos os estados do Brasil'

    def handle(self, *args, **options):
        brazil_states = [
            ('AC', 'Acre'),
            ('AL', 'Alagoas'),
            ('AP', 'Amapá'),
            ('AM', 'Amazonas'),
            ('BA', 'Bahia'),
            ('CE', 'Ceará'),
            ('DF', 'Distrito Federal'),
            ('ES', 'Espírito Santo'),
            ('GO', 'Goiás'),
            ('MA', 'Maranhão'),
            ('MT', 'Mato Grosso'),
            ('MS', 'Mato Grosso do Sul'),
            ('MG', 'Minas Gerais'),
            ('PA', 'Pará'),
            ('PB', 'Paraíba'),
            ('PR', 'Paraná'),
            ('PE', 'Pernambuco'),
            ('PI', 'Piauí'),
            ('RJ', 'Rio de Janeiro'),
            ('RN', 'Rio Grande do Norte'),
            ('RS', 'Rio Grande do Sul'),
            ('RO', 'Rondônia'),
            ('RR', 'Roraima'),
            ('SC', 'Santa Catarina'),
            ('SP', 'São Paulo'),
            ('SE', 'Sergipe'),
            ('TO', 'Tocantins'),
        ]
        
        created_count = 0
        for code, name in brazil_states:
            state, created = State.objects.get_or_create(
                code=code,
                defaults={'name': name}
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Estado criado: {code} - {name}')
                )
            else:
                self.stdout.write(f'Estado já existe: {code} - {name}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Total de estados criados: {created_count}')
        )
        self.stdout.write(f'Total de estados no banco: {State.objects.count()}')
