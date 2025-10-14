#!/usr/bin/env python
"""
Script para sincronizar banco de dados entre computadores via Git

Uso:
    python sync_database.py export    # Exportar dados para JSON
    python sync_database.py import    # Importar dados do JSON

Os arquivos JSON são commitados no Git e sincronizados automaticamente!
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'obrigacoes.settings')
django.setup()

from django.core.management import call_command
from datetime import datetime


def export_data():
    """Exporta todos os dados para JSON"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'database_sync.json'
    
    print(f"📤 Exportando dados para {filename}...")
    
    # Exportar todos os dados exceto contenttypes e sessions
    call_command(
        'dumpdata',
        '--natural-foreign',
        '--natural-primary',
        '--exclude', 'contenttypes',
        '--exclude', 'auth.permission',
        '--exclude', 'sessions',
        '--indent', 2,
        '--output', filename
    )
    
    print(f"✅ Dados exportados com sucesso!")
    print(f"\n📋 Próximos passos:")
    print(f"   1. git add {filename}")
    print(f"   2. git commit -m '💾 Backup de dados {timestamp}'")
    print(f"   3. git push origin main")


def import_data():
    """Importa dados do JSON"""
    filename = 'database_sync.json'
    
    if not os.path.exists(filename):
        print(f"❌ Arquivo {filename} não encontrado!")
        print(f"📥 Faça 'git pull origin main' primeiro para baixar os dados.")
        return
    
    print(f"📥 Importando dados de {filename}...")
    
    # Limpar banco atual (CUIDADO!)
    response = input("⚠️  Isso vai SUBSTITUIR os dados atuais. Continuar? (s/N): ")
    if response.lower() != 's':
        print("❌ Importação cancelada.")
        return
    
    # Importar dados
    call_command('loaddata', filename)
    
    print(f"✅ Dados importados com sucesso!")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python sync_database.py [export|import]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'export':
        export_data()
    elif command == 'import':
        import_data()
    else:
        print(f"❌ Comando inválido: {command}")
        print("Use: export ou import")
        sys.exit(1)

