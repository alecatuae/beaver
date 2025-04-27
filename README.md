# Beaver

Plataforma de Suporte para Arquitetura e Engenharia

## Sobre o Projeto

Beaver é uma aplicação web desenvolvida para auxiliar times de arquitetura e engenharia no gerenciamento de decisões arquiteturais, visualização de componentes e fluxos de impacto de mudanças.

## Tecnologias Principais

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Apollo Server, Pothos GraphQL
- **Banco de Dados**: Prisma, MariaDB
- **Observabilidade** (opcional): Prometheus, Grafana, Loki, Tempo

## Funcionalidades

- Visualização interativa da arquitetura utilizando grafos (Cytoscape.js)
- Gerenciamento de ADRs (Architectural Decision Records)
- Fluxo de impacto para análise de mudanças
- Glossário de termos técnicos
- Gerenciamento de componentes e equipes

## Requisitos

- Node.js 22 LTS
- Docker e Docker Compose

## Instalação e Execução

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd beaver
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie os serviços do Docker:
```bash
docker-compose up -d
```

4. Execute o aplicativo em modo de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação em [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
beaver/
├── src/                      # Código fonte principal
│   ├── app/                  # Estrutura de rotas do Next.js
│   ├── components/           # Componentes React reutilizáveis
│   │   └── layout/           # Componentes de layout (Header, Sidebar, Footer)
│   └── ...
├── public/                   # Arquivos estáticos
├── docs/                     # Documentação
├── api/                      # Código da API GraphQL
└── ...
```

## Documentação

Para mais informações, consulte os arquivos de documentação disponíveis na pasta `docs/`.

## Licença

© 2025 Beaver. Todos os direitos reservados.

## Desenvolvido por

Alexandre Nascimento | alecatuae@amail.com
