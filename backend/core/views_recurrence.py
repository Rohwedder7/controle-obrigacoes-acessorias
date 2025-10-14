"""
Views para geração de recorrências de obrigações
"""
from datetime import datetime, date, timedelta
from calendar import monthrange
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response
from django.db.models import Q

from .models import Obligation, ObligationType, Company, State
from .serializers import ObligationSerializer
from .views import audit


def get_latest_obligation(company_id, state_code_or_id, obligation_type_id):
    """
    Busca a última obrigação existente para a chave (company, state, obligation_type)
    Ordena por competence (mm/aaaa) e depois por due_date
    """
    try:
        # Buscar state por code ou id
        if isinstance(state_code_or_id, str):
            state = State.objects.get(code=state_code_or_id)
        else:
            state = State.objects.get(id=state_code_or_id)
        
        # Buscar obrigação mais distante conforme especificação formal:
        # 1º: due_date (vencimento) descendente (mais distante primeiro)
        # 2º: competence (mm/aaaa) descendente (tie-breaker)
        # 3º: created_at descendente (tie-breaker)
        latest = Obligation.objects.filter(
            company_id=company_id,
            state=state,
            obligation_type_id=obligation_type_id
        ).select_related('company', 'state', 'obligation_type').order_by(
            '-due_date',  # 1º critério: data mais distante
            '-competence',  # 2º critério: competência mais distante (tie-breaker)
            '-created_at'   # 3º critério: mais recente (tie-breaker)
        ).first()
        
        return latest
    except (State.DoesNotExist, Company.DoesNotExist, ObligationType.DoesNotExist):
        return None


def parse_competence(competence_str):
    """
    Parse competence string (mm/aaaa) para (month, year)
    """
    try:
        month, year = competence_str.split('/')
        return int(month), int(year)
    except (ValueError, IndexError):
        raise ValueError(f"Formato de competência inválido: {competence_str}")


def format_competence(month, year):
    """
    Formata (month, year) para string competence (mm/aaaa)
    """
    return f"{month:02d}/{year}"


def add_months_with_clamp(base_date, months_to_add):
    """
    Adiciona meses a uma data com clamp para o último dia do mês se necessário
    """
    year = base_date.year
    month = base_date.month
    day = base_date.day
    
    # Calcular novo mês e ano
    new_month = month + months_to_add
    new_year = year
    
    while new_month > 12:
        new_month -= 12
        new_year += 1
    
    while new_month < 1:
        new_month += 12
        new_year -= 1
    
    # Verificar se o dia existe no novo mês
    last_day_of_month = monthrange(new_year, new_month)[1]
    
    # Preservar o dia original se possível, senão usar o último dia do mês
    if day <= last_day_of_month:
        clamped_day = day
    else:
        clamped_day = last_day_of_month
    
    return date(new_year, new_month, clamped_day)


def calculate_next_obligation(base_obligation, start_competence=None, start_due_date=None, start_delivery_deadline=None):
    """
    Calcula a próxima obrigação baseada na última existente ou parâmetros iniciais
    """
    if base_obligation:
        # Usar base existente
        base_competence = base_obligation.competence
        base_due_date = base_obligation.due_date
        base_delivery_deadline = base_obligation.delivery_deadline
    else:
        # Usar parâmetros iniciais
        if not start_competence or not start_due_date:
            raise ValueError("Parâmetros iniciais obrigatórios quando não há base existente")
        
        base_competence = start_competence
        # Converter string para date se necessário
        if isinstance(start_due_date, str):
            base_due_date = datetime.strptime(start_due_date, '%Y-%m-%d').date()
        else:
            base_due_date = start_due_date
        
        if start_delivery_deadline:
            if isinstance(start_delivery_deadline, str):
                base_delivery_deadline = datetime.strptime(start_delivery_deadline, '%Y-%m-%d').date()
            else:
                base_delivery_deadline = start_delivery_deadline
        else:
            base_delivery_deadline = None
    
    # Parsear competência base
    month, year = parse_competence(base_competence)
    
    # Calcular próxima competência (+1 mês)
    next_month = month + 1
    next_year = year
    if next_month > 12:
        next_month = 1
        next_year += 1
    
    next_competence = format_competence(next_month, next_year)
    
    # Calcular próximas datas (+1 mês com clamp)
    next_due_date = add_months_with_clamp(base_due_date, 1)
    
    next_delivery_deadline = None
    if base_delivery_deadline:
        next_delivery_deadline = add_months_with_clamp(base_delivery_deadline, 1)
    
    return {
        'competence': next_competence,
        'due_date': next_due_date,
        'delivery_deadline': next_delivery_deadline
    }


def check_conflict(company_id, state_code_or_id, obligation_type_id, competence):
    """
    Verifica se já existe obrigação para a competência
    """
    try:
        if isinstance(state_code_or_id, str):
            state = State.objects.get(code=state_code_or_id)
        else:
            state = State.objects.get(id=state_code_or_id)
        
        exists = Obligation.objects.filter(
            company_id=company_id,
            state=state,
            obligation_type_id=obligation_type_id,
            competence=competence
        ).exists()
        
        return exists
    except State.DoesNotExist:
        return False


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def preview_recurrence(request):
    """
    Preview das próximas obrigações que seriam criadas
    """
    try:
        data = request.data
        
        # Parâmetros obrigatórios
        company_id = data.get('company_id')
        state_code = data.get('state_code')  # ou state_id
        obligation_type_id = data.get('obligation_type_id')
        count = data.get('count', 3)
        
        if not all([company_id, state_code, obligation_type_id]):
            return Response({
                'error': 'Parâmetros obrigatórios: company_id, state_code, obligation_type_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar última obrigação existente
        latest_obligation = get_latest_obligation(company_id, state_code, obligation_type_id)
        
        # Determinar base
        if latest_obligation:
            base_info = {
                'id': latest_obligation.id,
                'competence': latest_obligation.competence,
                'due_date': latest_obligation.due_date,
                'type': 'existing'
            }
            start_competence = None
            start_due_date = None
            start_delivery_deadline = None
        else:
            # Usar parâmetros iniciais
            start_competence = data.get('start_competence')
            start_due_date = data.get('start_due_date')
            start_delivery_deadline = data.get('start_delivery_deadline')
            
            if not start_competence or not start_due_date:
                return Response({
                    'error': 'Quando não há base existente, são obrigatórios: start_competence, start_due_date'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            base_info = {
                'competence': start_competence,
                'due_date': start_due_date,
                'type': 'manual'
            }
        
        # Calcular próximas obrigações
        proposed = []
        current_base = latest_obligation
        
        for i in range(count):
            try:
                next_obligation = calculate_next_obligation(
                    current_base,
                    start_competence if i == 0 and not current_base else None,
                    start_due_date if i == 0 and not current_base else None,
                    start_delivery_deadline if i == 0 and not current_base else None
                )
                
                # Verificar conflito
                would_conflict = check_conflict(company_id, state_code, obligation_type_id, next_obligation['competence'])
                
                proposed_item = {
                    'competence': next_obligation['competence'],
                    'due_date': next_obligation['due_date'],
                    'delivery_deadline': next_obligation['delivery_deadline'],
                    'would_conflict': would_conflict,
                    'conflict_reason': 'Já existe obrigação para esta competência' if would_conflict else None
                }
                
                proposed.append(proposed_item)
                
                # Para próxima iteração, simular a obrigação criada
                if not current_base:
                    # Criar objeto simulado para próxima iteração
                    class SimulatedObligation:
                        def __init__(self, competence, due_date, delivery_deadline):
                            self.competence = competence
                            self.due_date = due_date
                            self.delivery_deadline = delivery_deadline
                    
                    current_base = SimulatedObligation(
                        next_obligation['competence'],
                        next_obligation['due_date'],
                        next_obligation['delivery_deadline']
                    )
                else:
                    # Atualizar base para próxima iteração
                    current_base.competence = next_obligation['competence']
                    current_base.due_date = next_obligation['due_date']
                    current_base.delivery_deadline = next_obligation['delivery_deadline']
                
            except ValueError as e:
                proposed.append({
                    'competence': f'Erro: {str(e)}',
                    'due_date': None,
                    'delivery_deadline': None,
                    'would_conflict': True,
                    'conflict_reason': str(e)
                })
                break
        
        return Response({
            'base_used': base_info,
            'proposed': proposed,
            'count_requested': count
        })
        
    except Exception as e:
        return Response({
            'error': f'Erro no preview: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_recurrence(request):
    """
    Gera obrigações recorrentes baseadas na última existente
    """
    try:
        data = request.data
        
        # Parâmetros obrigatórios
        company_id = data.get('company_id')
        state_code = data.get('state_code')
        obligation_type_id = data.get('obligation_type_id')
        count = data.get('count', 3)
        
        if not all([company_id, state_code, obligation_type_id]):
            return Response({
                'error': 'Parâmetros obrigatórios: company_id, state_code, obligation_type_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar objetos relacionados
        try:
            company = Company.objects.get(id=company_id)
            if isinstance(state_code, str):
                state = State.objects.get(code=state_code)
            else:
                state = State.objects.get(id=state_code)
            obligation_type = ObligationType.objects.get(id=obligation_type_id)
        except (Company.DoesNotExist, State.DoesNotExist, ObligationType.DoesNotExist) as e:
            return Response({
                'error': f'Objeto não encontrado: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created = []
        skipped = []
        base_used = None
        last_created = None
        
        with transaction.atomic():
            # Buscar última obrigação existente (dentro da transação)
            latest_obligation = get_latest_obligation(company_id, state_code, obligation_type_id)
            
            # Determinar base
            if latest_obligation:
                base_used = {
                    'id': latest_obligation.id,
                    'competence': latest_obligation.competence,
                    'due_date': latest_obligation.due_date,
                    'type': 'existing'
                }
                start_competence = None
                start_due_date = None
                start_delivery_deadline = None
            else:
                # Usar parâmetros iniciais
                start_competence = data.get('start_competence')
                start_due_date = data.get('start_due_date')
                start_delivery_deadline = data.get('start_delivery_deadline')
                
                if not start_competence or not start_due_date:
                    return Response({
                        'error': 'Quando não há base existente, são obrigatórios: start_competence, start_due_date'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                base_used = {
                    'competence': start_competence,
                    'due_date': start_due_date,
                    'type': 'manual'
                }
            
            # Gerar obrigações
            current_base = latest_obligation
            
            for i in range(count):
                try:
                    # Calcular próxima obrigação
                    next_obligation = calculate_next_obligation(
                        current_base,
                        start_competence if i == 0 and not current_base else None,
                        start_due_date if i == 0 and not current_base else None,
                        start_delivery_deadline if i == 0 and not current_base else None
                    )
                    
                    # Verificar se já existe
                    if check_conflict(company_id, state_code, obligation_type_id, next_obligation['competence']):
                        skipped.append({
                            'competence': next_obligation['competence'],
                            'reason': 'Já existe obrigação para esta competência'
                        })
                        continue
                    
                    # Criar nova obrigação
                    new_obligation = Obligation.objects.create(
                        company=company,
                        state=state,
                        obligation_type=obligation_type,
                        obligation_name=obligation_type.name,  # Usar nome do tipo como padrão
                        competence=next_obligation['competence'],
                        due_date=next_obligation['due_date'],
                        delivery_deadline=next_obligation['delivery_deadline'],
                        responsible_user=request.user,
                        validity_start_date=timezone.now().date(),
                        validity_end_date=None,
                        notes=f'Obrigação gerada automaticamente por recorrência - {timezone.now().strftime("%d/%m/%Y %H:%M")}'
                    )
                    
                    created.append(new_obligation.id)
                    last_created = {
                        'id': new_obligation.id,
                        'competence': new_obligation.competence,
                        'due_date': new_obligation.due_date
                    }
                    
                    # Atualizar base para próxima iteração
                    # Criar objeto simulado para próxima iteração
                    class SimulatedObligation:
                        def __init__(self, competence, due_date, delivery_deadline):
                            self.competence = competence
                            self.due_date = due_date
                            self.delivery_deadline = delivery_deadline
                    
                    current_base = SimulatedObligation(
                        next_obligation['competence'],
                        next_obligation['due_date'],
                        next_obligation['delivery_deadline']
                    )
                    
                except ValueError as e:
                    skipped.append({
                        'competence': f'Erro na iteração {i+1}',
                        'reason': str(e)
                    })
                    continue
                except Exception as e:
                    skipped.append({
                        'competence': f'Erro na iteração {i+1}',
                        'reason': f'Erro inesperado: {str(e)}'
                    })
                    continue
        
        # Registrar no AuditLog
        try:
            audit(request.user, 'generate_recurrences', None, {
                'payload': data,
                'result': {
                    'created_count': len(created),
                    'skipped_count': len(skipped),
                    'base_used': base_used
                }
            })
        except Exception:
            pass  # Não falhar se audit falhar
        
        return Response({
            'created': created,
            'skipped': skipped,
            'base_used': base_used,
            'last_created': last_created,
            'summary': {
                'created_count': len(created),
                'skipped_count': len(skipped),
                'total_requested': count
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'Erro na geração: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
