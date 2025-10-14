#!/usr/bin/env python3
"""
Script para verificar se o projeto está configurado corretamente
"""
import os
import sys
import subprocess
import json

def check_file_exists(file_path, description):
    """Verifica se um arquivo existe"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - NÃO ENCONTRADO")
        return False

def check_command(command, description):
    """Verifica se um comando está disponível"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description}: Disponível")
            return True
        else:
            print(f"❌ {description}: Não disponível ou com erro")
            return False
    except Exception as e:
        print(f"❌ {description}: Erro ao verificar - {e}")
        return False

def main():
    print("🔍 VERIFICAÇÃO DO PROJETO - SISTEMA DE CONTROLE DE OBRIGAÇÕES")
    print("=" * 60)
    
    all_ok = True
    
    # Verificar estrutura de arquivos
    print("\n📁 ESTRUTURA DE ARQUIVOS:")
    files_to_check = [
        ("backend/manage.py", "Django manage.py"),
        ("backend/requirements.txt", "Dependências Python"),
        ("backend/obrigacoes/settings.py", "Configurações Django"),
        ("backend/core/models.py", "Modelos Django"),
        ("backend/core/views.py", "Views Django"),
        ("backend/core/serializers.py", "Serializers Django"),
        ("backend/Dockerfile", "Dockerfile Backend"),
        ("frontend/package.json", "Configuração Node.js"),
        ("frontend/src/main.jsx", "Arquivo principal React"),
        ("frontend/vite.config.js", "Configuração Vite"),
        ("frontend/Dockerfile", "Dockerfile Frontend"),
        ("docker-compose.yml", "Docker Compose"),
        ("setup-ambiente.md", "Guia de setup"),
        ("start-local.bat", "Script Windows"),
        ("start-local.sh", "Script Linux/Mac"),
    ]
    
    for file_path, description in files_to_check:
        if not check_file_exists(file_path, description):
            all_ok = False
    
    # Verificar comandos disponíveis
    print("\n🔧 FERRAMENTAS NECESSÁRIAS:")
    commands_to_check = [
        ("python --version", "Python"),
        ("node --version", "Node.js"),
        ("npm --version", "NPM"),
        ("docker --version", "Docker"),
    ]
    
    for command, description in commands_to_check:
        check_command(command, description)
    
    # Verificar configurações específicas
    print("\n⚙️  CONFIGURAÇÕES:")
    
    # Verificar se existe .env no backend
    backend_env = "backend/.env"
    if os.path.exists(backend_env):
        print(f"✅ Arquivo .env do backend existe")
    else:
        print(f"⚠️  Arquivo .env do backend não existe - será criado automaticamente")
    
    # Verificar package.json do frontend
    frontend_package = "frontend/package.json"
    if os.path.exists(frontend_package):
        try:
            with open(frontend_package, 'r', encoding='utf-8') as f:
                package_data = json.load(f)
                deps = package_data.get('dependencies', {})
                required_deps = ['react', 'react-dom', 'react-router-dom']
                missing_deps = [dep for dep in required_deps if dep not in deps]
                
                if not missing_deps:
                    print(f"✅ Dependências React estão configuradas")
                else:
                    print(f"❌ Dependências React faltando: {missing_deps}")
                    all_ok = False
        except Exception as e:
            print(f"❌ Erro ao ler package.json: {e}")
            all_ok = False
    
    # Verificar requirements.txt do backend
    backend_reqs = "backend/requirements.txt"
    if os.path.exists(backend_reqs):
        try:
            with open(backend_reqs, 'r', encoding='utf-8') as f:
                requirements = f.read()
                required_packages = ['Django', 'djangorestframework', 'django-cors-headers']
                missing_packages = [pkg for pkg in required_packages if pkg not in requirements]
                
                if not missing_packages:
                    print(f"✅ Dependências Django estão configuradas")
                else:
                    print(f"❌ Dependências Django faltando: {missing_packages}")
                    all_ok = False
        except Exception as e:
            print(f"❌ Erro ao ler requirements.txt: {e}")
            all_ok = False
    
    print("\n" + "=" * 60)
    
    if all_ok:
        print("🎉 PROJETO ESTÁ PRONTO PARA USO!")
        print("\n📋 PRÓXIMOS PASSOS:")
        print("1. Execute 'start-local.bat' (Windows) ou './start-local.sh' (Linux/Mac)")
        print("2. Ou use Docker: 'docker-compose up --build'")
        print("3. Acesse http://localhost:5173 para o frontend")
        print("4. Acesse http://localhost:8000/admin para o admin Django")
    else:
        print("⚠️  ALGUNS PROBLEMAS FORAM ENCONTRADOS")
        print("Consulte o arquivo 'setup-ambiente.md' para instruções detalhadas")
    
    print("\n🔗 LINKS ÚTEIS:")
    print("- Frontend: http://localhost:5173")
    print("- Backend API: http://localhost:8000/api/")
    print("- Admin Django: http://localhost:8000/admin/")
    print("- Documentação: setup-ambiente.md")

if __name__ == "__main__":
    main()
