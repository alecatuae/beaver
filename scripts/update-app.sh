#!/bin/bash

# Script para atualizar a aplicação Beaver
# Este script facilita a atualização dos contêineres de frontend e backend

# Definição de cores para saída
VERDE='\033[0;32m'
VERMELHO='\033[0;31m'
AMARELO='\033[1;33m'
NC='\033[0m' # Sem cor

# Função para exibir mensagem de ajuda
mostrar_ajuda() {
    echo -e "Uso: $0 [opções]"
    echo -e "Opções:"
    echo -e "  -h, --help           \tExibe esta mensagem de ajuda"
    echo -e "  -f, --frontend       \tAtualiza apenas o frontend"
    echo -e "  -b, --backend        \tAtualiza apenas o backend"
    echo -e "  -a, --all            \tAtualiza frontend e backend (padrão)"
    echo -e "  --build              \tForça reconstrução dos contêineres"
    echo -e "  --restart            \tApenas reinicia os contêineres"
    echo -e "  --pull               \tPuxa as imagens mais recentes antes de atualizar"
}

# Variáveis de configuração
atualizar_frontend=false
atualizar_backend=false
forcar_build=false
apenas_restart=false
fazer_pull=false

# Verificar se não foram passados argumentos
if [ $# -eq 0 ]; then
    atualizar_frontend=true
    atualizar_backend=true
fi

# Processamento de argumentos
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            mostrar_ajuda
            exit 0
            ;;
        -f|--frontend)
            atualizar_frontend=true
            ;;
        -b|--backend)
            atualizar_backend=true
            ;;
        -a|--all)
            atualizar_frontend=true
            atualizar_backend=true
            ;;
        --build)
            forcar_build=true
            ;;
        --restart)
            apenas_restart=true
            ;;
        --pull)
            fazer_pull=true
            ;;
        *)
            echo -e "${VERMELHO}Opção desconhecida: $1${NC}"
            mostrar_ajuda
            exit 1
            ;;
    esac
    shift
done

# Verificar a existência do docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${VERMELHO}docker-compose não encontrado. Por favor, instale o Docker Compose.${NC}"
    exit 1
fi

# Função para atualizar o frontend
atualizar_frontend() {
    echo -e "${AMARELO}Atualizando frontend...${NC}"
    
    if [ "$apenas_restart" = true ]; then
        echo -e "${AMARELO}Reiniciando contêiner do frontend...${NC}"
        docker-compose restart frontend
        echo -e "${VERDE}Frontend reiniciado com sucesso!${NC}"
        return
    fi
    
    # Limpar cache do Next.js
    echo -e "${AMARELO}Limpando cache do Next.js...${NC}"
    rm -rf .next

    # Atualizar dependências
    echo -e "${AMARELO}Instalando/atualizando dependências do frontend...${NC}"
    npm install --legacy-peer-deps
    
    # Reconstruir o contêiner se solicitado
    if [ "$forcar_build" = true ]; then
        echo -e "${AMARELO}Reconstruindo contêiner do frontend...${NC}"
        docker-compose up -d --build frontend
    else
        echo -e "${AMARELO}Reiniciando contêiner do frontend...${NC}"
        docker-compose restart frontend
    fi
    
    echo -e "${VERDE}Frontend atualizado com sucesso!${NC}"
}

# Função para atualizar o backend
atualizar_backend() {
    echo -e "${AMARELO}Atualizando backend...${NC}"
    
    if [ "$apenas_restart" = true ]; then
        echo -e "${AMARELO}Reiniciando contêiner do backend...${NC}"
        docker-compose restart api
        echo -e "${VERDE}Backend reiniciado com sucesso!${NC}"
        return
    fi
    
    # Atualizar dependências da API
    echo -e "${AMARELO}Instalando/atualizando dependências do backend...${NC}"
    (cd api && npm install)
    
    # Reconstruir o contêiner se solicitado
    if [ "$forcar_build" = true ]; then
        echo -e "${AMARELO}Reconstruindo contêiner do backend...${NC}"
        docker-compose up -d --build api
    else
        echo -e "${AMARELO}Reiniciando contêiner do backend...${NC}"
        docker-compose restart api
    fi
    
    echo -e "${VERDE}Backend atualizado com sucesso!${NC}"
}

# Executar pull se solicitado
if [ "$fazer_pull" = true ]; then
    echo -e "${AMARELO}Obtendo as imagens mais recentes...${NC}"
    docker-compose pull
fi

# Executar as atualizações conforme solicitado
if [ "$atualizar_frontend" = true ]; then
    atualizar_frontend
fi

if [ "$atualizar_backend" = true ]; then
    atualizar_backend
fi

echo -e "${VERDE}Atualização concluída!${NC}" 