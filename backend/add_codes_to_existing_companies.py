#!/usr/bin/env python
"""
Script para adicionar códigos às empresas existentes que não possuem código.
Execute este script após aplicar a migration 0010_add_company_code.
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'obrigacoes.settings')
django.setup()

from core.models import Company

def add_codes_to_companies():
    """
    Adiciona códigos automáticos às empresas existentes que não possuem código.
    """
    print("=" * 60)
    print("SCRIPT DE ATUALIZAÇÃO DE CÓDIGOS DAS EMPRESAS")
    print("=" * 60)
    print()
    
    # Buscar empresas sem código ou com código vazio
    companies = Company.objects.filter(code__isnull=True) | Company.objects.filter(code='')
    companies = companies.order_by('id')
    
    total = companies.count()
    
    if total == 0:
        print("✅ Todas as empresas já possuem código!")
        return
    
    print(f"📊 Total de empresas sem código: {total}")
    print()
    print("Gerando códigos automáticos...")
    print()
    
    # Contador para códigos
    counter = 1
    
    for company in companies:
        # Gerar código baseado no contador: EMP001, EMP002, etc.
        code = f"EMP{counter:03d}"
        
        # Verificar se o código já existe
        while Company.objects.filter(code=code).exists():
            counter += 1
            code = f"EMP{counter:03d}"
        
        # Atualizar empresa
        company.code = code
        company.save()
        
        print(f"✅ {company.name} → Código: {code}")
        counter += 1
    
    print()
    print("=" * 60)
    print(f"✅ {total} empresas atualizadas com sucesso!")
    print("=" * 60)
    print()
    
    # Listar todas as empresas com seus códigos
    print("📋 Lista de todas as empresas:")
    print("-" * 60)
    for company in Company.objects.all().order_by('code'):
        print(f"{company.code} - {company.name}")
    print("-" * 60)

if __name__ == '__main__':
    try:
        add_codes_to_companies()
    except Exception as e:
        print()
        print("❌ Erro ao executar o script:")
        print(str(e))
        import traceback
        traceback.print_exc()

