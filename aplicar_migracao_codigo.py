#!/usr/bin/env python
"""
Script para aplicar a migração do campo código nas empresas
"""
import os
import sys
import django

# Adicionar o diretório backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'obrigacoes.settings')
django.setup()

from django.core.management import call_command
from core.models import Company

def main():
    print("=" * 70)
    print("APLICANDO MIGRAÇÃO - CAMPO CÓDIGO NAS EMPRESAS")
    print("=" * 70)
    print()
    
    # Passo 1: Aplicar migrations
    print("📦 Passo 1: Aplicando migrations...")
    try:
        call_command('migrate', 'core', verbosity=2)
        print("✅ Migrations aplicadas com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao aplicar migrations: {e}")
        return False
    
    print()
    
    # Passo 2: Verificar empresas sem código
    print("📊 Passo 2: Verificando empresas sem código...")
    companies_without_code = Company.objects.filter(code__isnull=True) | Company.objects.filter(code='')
    total = companies_without_code.count()
    
    if total == 0:
        print("✅ Todas as empresas já possuem código!")
        print()
        print("📋 Lista de empresas:")
        print("-" * 70)
        for company in Company.objects.all().order_by('code'):
            print(f"  {company.code} - {company.name}")
        print("-" * 70)
        return True
    
    print(f"⚠️  {total} empresas sem código encontradas")
    print()
    
    # Passo 3: Adicionar códigos
    print("🔧 Passo 3: Adicionando códigos às empresas...")
    counter = 1
    
    for company in companies_without_code.order_by('id'):
        # Gerar código baseado no contador: EMP001, EMP002, etc.
        code = f"EMP{counter:03d}"
        
        # Verificar se o código já existe
        while Company.objects.filter(code=code).exists():
            counter += 1
            code = f"EMP{counter:03d}"
        
        # Atualizar empresa
        company.code = code
        company.save()
        
        print(f"  ✅ {company.name} → Código: {code}")
        counter += 1
    
    print()
    print("=" * 70)
    print(f"✅ {total} empresas atualizadas com sucesso!")
    print("=" * 70)
    print()
    
    # Passo 4: Listar todas as empresas
    print("📋 Lista de todas as empresas:")
    print("-" * 70)
    for company in Company.objects.all().order_by('code'):
        print(f"  {company.code} - {company.name}")
    print("-" * 70)
    print()
    
    print("🎉 Migração concluída com sucesso!")
    print()
    print("📝 Próximos passos:")
    print("  1. Reinicie o servidor Django: python backend/manage.py runserver")
    print("  2. Acesse o sistema e verifique se os códigos aparecem")
    print("  3. Teste o cadastro de novas empresas")
    print()
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print()
        print("❌ Erro ao executar o script:")
        print(str(e))
        import traceback
        traceback.print_exc()
        sys.exit(1)

