# Estrutura de Diretórios do Projeto Beaver v2.0

*Última atualização → Junho 2024*

Este documento descreve a estrutura de diretórios completa do projeto Beaver v2.0, oferecendo uma visão geral da organização do código-fonte, configurações e documentação.

## Visão Geral da Estrutura

O projeto Beaver v2.0 segue uma arquitetura de aplicação web moderna com separação clara entre frontend e backend, utilizando React/Next.js para o frontend e Node.js/Apollo GraphQL para o backend. A estrutura do projeto é organizada da seguinte forma:

```
beaver/
├── api/               # Backend (API GraphQL Apollo + Prisma)
├── docs/              # Documentação do projeto
├── observability/     # Configurações de monitoramento e métricas
├── public/            # Arquivos estáticos para o frontend
├── scripts/           # Scripts de automação e utilitários
├── secrets/           # Armazenamento de segredos e chaves (não versionado)
└── src/               # Frontend (Next.js + React)
```

## Detalhamento dos Diretórios

### `/api` - Backend

Este diretório contém todo o código relacionado ao backend da aplicação, incluindo a API GraphQL, comunicação com bancos de dados e lógica de negócios.

```
api/
├── dist/              # Código compilado para produção
├── frontend/          # Versão de desenvolvimento do frontend (teste local)
├── prisma/            # Configuração do Prisma ORM
│   ├── migrations/    # Migrações de banco de dados
│   └── schema.prisma  # Schema do Prisma
├── public/            # Arquivos estáticos para a API
├── secrets/           # Certificados e segredos
├── src/               # Código-fonte do backend
│   ├── db/            # Camada de dados e conexão com bancos
│   ├── resolvers/     # Resolvers GraphQL por domínio
│   │   ├── component/ # Resolvers específicos de componentes
│   │   └── relationship/ # Resolvers de relacionamentos
│   ├── routes/        # Rotas REST (endpoints auxiliares)
│   ├── schema/        # Definições de schema GraphQL
│   ├── tests/         # Testes automatizados
│   └── utils/         # Utilitários e helpers
└── tests/             # Testes de integração
    └── fixtures/      # Dados de teste
```

#### Principais arquivos no backend:

- `api/src/index.ts`: Ponto de entrada da API
- `api/src/context.ts`: Configuração do contexto GraphQL (acesso aos bancos)
- `api/src/prisma.ts`: Cliente Prisma para MariaDB
- `api/src/db/neo4j.ts`: Cliente para Neo4j Graph DB

### `/src` - Frontend

Este diretório contém todo o código do frontend da aplicação, organizado de acordo com o padrão do Next.js 14+.

```
src/
├── app/               # Aplicação Next.js com App Router
│   ├── arch-overview/ # Página de visualização da arquitetura
│   ├── categories/    # Gerenciamento de categorias
│   ├── components/    # Gerenciamento de componentes
│   ├── relationships/ # Gestão de relacionamentos
│   ├── layout.tsx     # Layout principal da aplicação
│   └── page.tsx       # Página inicial (Home)
├── components/        # Componentes React reutilizáveis
│   ├── layout/        # Componentes de layout (sidebar, header, etc.)
│   └── ui/            # Componentes de UI reutilizáveis
├── lib/               # Bibliotecas e utilitários
│   └── hooks/         # React hooks personalizados
├── public/            # Arquivos públicos específicos do frontend
└── types/             # Definições de tipos TypeScript
```

#### Principais componentes no frontend:

- `src/app/layout.tsx`: Layout raiz da aplicação
- `src/app/page.tsx`: Página inicial
- `src/components/layout/app-layout.tsx`: Layout de aplicação compartilhado
- `src/components/layout/sidebar.tsx`: Barra lateral de navegação

### `/docs` - Documentação

Contém toda a documentação do projeto, incluindo arquitetura, guias de desenvolvimento e especificações, organizadas por versões.

```
docs/
└── versions/          # Documentação organizada por versões
    ├── 1.2/           # Documentação da versão 1.2
    └── 2.0/           # Documentação específica da versão 2.0
```

#### Documentação da v1.2:

- `Architecture_v1.2_en_us.md`: Arquitetura da versão 1.2
- `dev_guide_en_us.md`: Guia de desenvolvimento
- `components_Neo4j-between-MariaDB.md`: Integração entre os bancos de dados
- `CHANGELOG`: Registro de alterações
- Documentos de fluxos e processos: `fluxo_*.md`
- Schemas: `mariadb_schema.md/sql`, `neo4j_schema.md/txt`

#### Documentação da v2.0:

- `Architecture_v2.0_pt_br.md`: Documento principal de arquitetura
- `impacto_aplicacao.md`: Análise de impacto da migração para v2.0
- `page_details_v2.0_pt_br.md`: Detalhes das páginas e funcionalidades
- `estrutura_documentacao_v2.0_pt_br.md`: Guia da estrutura da documentação
- `estrutura_diretorios_projeto_beaver_v2.0.md`: Documento atual
- Implementação: `implementacao_frontend_v2.0_pt_br.md`, `implementacao_backend_v2.0_pt_br.md`
- Schemas: `mariadb_schema_v2.0_pt_br.md`, `neo4j_schema_v2.0_pt_br.md`
- Scripts: `mariadb_script_full_v2.0.sql`, `neo4j_schema_script_v2.0.txt`
- Design: `ui_ux_style_guide_pt_br.md`, `sidebar_layout_v2.0_pt_br.md`

### `/observability` - Monitoramento

Contém configurações para monitoramento e observabilidade da aplicação em produção.

```
observability/
├── loki/              # Configurações do Loki para logging
├── prometheus/        # Configurações do Prometheus para métricas
└── tempo/             # Configurações do Tempo para rastreamento
```

### `/public` - Arquivos Estáticos

Arquivos estáticos servidos diretamente pelo servidor web.

```
public/
└── images/            # Imagens públicas
    └── categories/    # Imagens das categorias de componentes
```

### `/scripts` - Scripts de Automação

Scripts para automação de tarefas comuns de desenvolvimento e operações.

```
scripts/
├── gen-jwt.sh         # Geração de chaves JWT
├── update-app.sh      # Atualização da aplicação em produção
└── ...                # Outros scripts utilitários
```

### `/secrets` - Segredos

Diretório para armazenamento de segredos e certificados (não incluído no controle de versão).

```
secrets/               # Chaves privadas, certificados e credenciais
```

## Padrões de Desenvolvimento

O projeto Beaver v2.0 segue os seguintes padrões e convenções de desenvolvimento:

### Backend (API)

- **Padrão de Resolvers**: Organização por domínio (components, relationships, adr)
- **ORM**: Prisma para acesso ao MariaDB
- **GraphQL**: Schema-first com Apollo Server
- **Autenticação**: JWT com RS256

### Frontend (Next.js)

- **Estrutura**: App Router do Next.js 14+
- **Componentes UI**: Organização em `/components/ui` para componentes básicos
- **Estilização**: TailwindCSS para styling
- **Estado**: Hooks React e TanStack Query para estado e data fetching
- **GraphQL**: Apollo Client para comunicação com a API

## Dependências Principais

### Backend

- Node.js 20+
- Apollo Server 4.x
- Prisma 6.x
- Neo4j-driver 5.x

### Frontend

- Next.js 14.x
- React 18.x
- TailwindCSS 3.x
- Radix UI Components
- Cytoscape.js (visualização de grafos)

## Configuração de Ambiente

O projeto utiliza Docker Compose para gerenciar os ambientes de desenvolvimento e produção:

- MariaDB 11.x: Banco de dados relacional
- Neo4j 5.x: Banco de dados de grafos
- Node.js: Servidor API e servidor Next.js

## Convenções de Nomenclatura

- **Diretórios**: kebab-case (ex: `arch-overview`)
- **Arquivos TypeScript/React**: 
  - Componentes: PascalCase (ex: `Button.tsx`)
  - Utilitários: camelCase (ex: `authUtils.ts`)
- **Arquivos de Configuração**: kebab-case (ex: `docker-compose.yml`)

## Conclusão

Esta estrutura de diretórios foi projetada para proporcionar uma organização clara e modular, facilitando o desenvolvimento e a manutenção do Beaver v2.0. A separação entre frontend e backend permite que as equipes trabalhem de forma independente, enquanto as convenções de nomenclatura e os padrões de código garantem consistência em todo o projeto. 