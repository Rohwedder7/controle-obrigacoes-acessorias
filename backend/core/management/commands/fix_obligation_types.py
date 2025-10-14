#!/usr/bin/env python3
"""
Comando para corrigir e padronizar os tipos de obrigação
"""
from django.core.management.base import BaseCommand
from core.models import ObligationType, Obligation

class Command(BaseCommand):
    help = 'Corrige e padroniza os tipos de obrigação'

    def handle(self, *args, **options):
        self.stdout.write('🔧 CORRIGINDO TIPOS DE OBRIGAÇÃO')
        self.stdout.write('=' * 40)
        
        # Tipos corretos
        correct_types = {
            'Federal': {
                'name': 'Federal',
                'description': 'Obrigações federais (SPED, DIRF, etc.)',
                'recurrence': 'mensal',
                'due_day': 15
            },
            'Estadual': {
                'name': 'Estadual', 
                'description': 'Obrigações estaduais (SPED EFD, etc.)',
                'recurrence': 'mensal',
                'due_day': 15
            },
            'Municipal': {
                'name': 'Municipal',
                'description': 'Obrigações municipais (ISS, etc.)',
                'recurrence': 'mensal', 
                'due_day': 15
            },
            'Regimes Especiais': {
                'name': 'Regimes Especiais',
                'description': 'Obrigações de regimes especiais',
                'recurrence': 'mensal',
                'due_day': 15
            }
        }
        
        # 1. Criar tipos corretos se não existirem
        self.stdout.write('\n1. Criando tipos corretos...')
        for type_name, type_data in correct_types.items():
            obligation_type, created = ObligationType.objects.get_or_create(
                name=type_name,
                defaults=type_data
            )
            if created:
                self.stdout.write(f'   ✅ Criado: {type_name}')
            else:
                self.stdout.write(f'   📝 Já existe: {type_name}')
        
        # 2. Mapear tipos incorretos para corretos
        type_mapping = {
            'SPED - Escrituração Fiscal Digital': 'Federal',
            'SPED Fiscal': 'Federal',
            'SPED EFD': 'Estadual',
            'DIRF': 'Federal',
            'RAIS': 'Federal',
            'CAGED': 'Federal',
            'GFIP': 'Federal',
            'FGTS': 'Federal',
            'INSS': 'Federal',
            'IRRF': 'Federal',
            'ISS': 'Municipal',
            'Regime Especial': 'Regimes Especiais'
        }
        
        self.stdout.write('\n2. Mapeando tipos incorretos...')
        for old_name, new_name in type_mapping.items():
            try:
                old_type = ObligationType.objects.get(name=old_name)
                new_type = ObligationType.objects.get(name=new_name)
                
                # Atualizar obrigações uma por uma para evitar conflitos
                obligations_to_update = Obligation.objects.filter(obligation_type=old_type)
                count = obligations_to_update.count()
                updated_count = 0
                
                if count > 0:
                    for obligation in obligations_to_update:
                        # Verificar se já existe uma obrigação com a mesma combinação
                        existing = Obligation.objects.filter(
                            company=obligation.company,
                            state=obligation.state,
                            obligation_type=new_type,
                            competence=obligation.competence
                        ).first()
                        
                        if existing:
                            # Se já existe, deletar a duplicata
                            obligation.delete()
                            self.stdout.write(f'   🗑️ Duplicata removida: {obligation.obligation_name}')
                        else:
                            # Se não existe, atualizar
                            obligation.obligation_type = new_type
                            obligation.save()
                            updated_count += 1
                    
                    self.stdout.write(f'   🔄 {old_name} → {new_name} ({updated_count} atualizadas, {count - updated_count} duplicatas removidas)')
                
                # Remover tipo antigo
                old_type.delete()
                self.stdout.write(f'   🗑️ Removido: {old_name}')
                
            except ObligationType.DoesNotExist:
                self.stdout.write(f'   ⏭️ Não encontrado: {old_name}')
        
        # 3. Remover tipos não mapeados
        self.stdout.write('\n3. Removendo tipos não mapeados...')
        all_types = ObligationType.objects.all()
        for obligation_type in all_types:
            if obligation_type.name not in correct_types:
                count = Obligation.objects.filter(obligation_type=obligation_type).count()
                if count > 0:
                    # Mapear para Federal por padrão
                    federal_type = ObligationType.objects.get(name='Federal')
                    Obligation.objects.filter(obligation_type=obligation_type).update(obligation_type=federal_type)
                    self.stdout.write(f'   🔄 {obligation_type.name} → Federal ({count} obrigações)')
                
                obligation_type.delete()
                self.stdout.write(f'   🗑️ Removido: {obligation_type.name}')
        
        # 4. Verificar resultado final
        self.stdout.write('\n4. Verificando resultado final...')
        final_types = ObligationType.objects.all()
        for obligation_type in final_types:
            count = Obligation.objects.filter(obligation_type=obligation_type).count()
            self.stdout.write(f'   ✅ {obligation_type.name}: {count} obrigações')
        
        self.stdout.write('\n' + '=' * 40)
        self.stdout.write('✅ CORREÇÃO CONCLUÍDA!')
        self.stdout.write(f'📊 {final_types.count()} tipos de obrigação corretos')
