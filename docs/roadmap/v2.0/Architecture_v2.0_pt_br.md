# Arquitetura Beaver v2.0
*Última atualização → Junho 2024*

---

## Visão Geral

O Beaver é uma plataforma de gerenciamento de arquitetura empresarial que permite visualizar, documentar e gerenciar componentes de software, decisões arquiteturais (ADRs) e relacionamentos entre os diferentes elementos da arquitetura de TI. A versão 2.0 introduz melhorias significativas na estrutura de dados e na capacidade de gerenciamento de múltiplos ambientes e instâncias de componentes.

---

## Resumo da Solução `[o que]`

| Domínio | Pontos-Chave |
|--------|------------|
| **Núcleo de Grafo** | `:Component` / `:Component_Instance` / relacionamentos; filtros nativos `environment`, `team`, `domain`, `criticality`; consultas temporais via `valid_from` / `valid_to`. |
| **Decisões como Código** | Nós ADR interconectados com `HAS_DECISION` e `PARTICIPATES_IN`; diferencial visual completo e reversão. |
| **Fluxo de Trabalho de Impacto** | Rascunho → diferencial visual → comentários → merge pelo papel `ARCHITECT`. |
| **Glossário** | Dicionário incorporado; suporte a `#tag` em nós, arestas e ADRs, com autocompletar e hover-cards. |
| **Visualização de Grafo** | Cytoscape.js renderiza nós + arestas; layouts: cola (direcionado por força), concêntrico, em largura. |
| **Times e Ambientes** | Gerenciamento de times responsáveis por componentes e instâncias específicas em múltiplos ambientes. |

---

## Não-Objetivos `[fora_do_escopo]`
* Descoberta automática, APM em tempo real, FinOps.  
* **Sem pipelines CDC ou message brokers (Kafka, RabbitMQ, etc.).**  
* Orquestração de CI/CD permanece fora do Beaver.
* Geração automática de relatórios de compliance.

---

## Camadas da Aplicação

### Frontend
- **Tecnologias**: Next.js, React, TailwindCSS
- **Gerenciamento de Estado**: TanStack Query
- **Visualização**: Cytoscape.js para renderização de grafos interativos
- **Autenticação**: JWT com armazenamento seguro via cookies HTTP-only

### Backend
- **API**: Apollo Server com Pothos GraphQL
- **ORM**: Prisma para interação com MariaDB
- **Bancos de Dados**:
  - **MariaDB**: Armazenamento relacional para metadados, usuários, e configurações
  - **Neo4j**: Armazenamento de grafos para visualização de arquitetura e consultas de relacionamento

---

## Stack de Tecnologia e Bibliotecas

| Camada | Bibliotecas / Ferramentas | Versão (2025-Q2) |
|-------|-------------------|-------------------|
| **Front-end** | Next.js · React · TailwindCSS · Apollo Client · @radix-ui components · class-variance-authority · clsx · d3 · date-fns · lucide-react · next-themes · tailwind-merge · tailwindcss-animate | 14.1.x · 18.2.x · 3.4.x · 3.13.x · latest · 0.7.x · 2.1.x · 7.9.x · 4.1.x · 0.330.x · 0.2.x · 2.3.x · 1.0.x |
| **API** | Node.js · Apollo Server · Pothos GraphQL · Zod · Prisma Client · Neo4j-driver · Express · argon2 · jsonwebtoken · pino · dotenv | 20-22 LTS · 4.12.x · 3.41.x · 3.22.x · 5.8.x · 5.15.x · 4.21.x · 0.31.x · 9.0.x · 8.17.x · 16.3.x |
| **Testes** | Jest · Supertest · Cypress/Playwright | 29.7.x · 6.3.x · latest |
| **Dev-Ex** | ESLint (flat) · Biome · TypeScript · ts-node · ts-node-dev | 9.x · 1.6.x · 5.x · 10.9.x · 2.0.x |
| **Container / IaC** | Docker Engine · Docker Compose v3.9 | latest · 3.9 |
| **Segurança** | Helmet · rate-limiter-flexible · express-mongo-sanitize · compression · csurf | latest |
| **Observabilidade (opcional)** | prom-client · @opentelemetry/api · Grafana Agent · Loki-JS · Tempo-JS | latest |
| **Compliance & SBOM** | Trivy · Syft | latest |
| **Backup & DR** | mariabackup · neo4j-admin | latest |

---

### Avaliação de Interdependência do Cytoscape

| Aspecto | Detalhe | Notas de Compatibilidade |
|--------|--------|---------------------|
| **Integração React** | `react-cytoscapejs` fornece um wrapper que expõe a instância do Cytoscape via refs. | Sem problemas de quebra relatados na migração React 17→18. Funciona com o React Strict Mode. |
| **SSR Next.js** | Cytoscape acessa `window`. Use `dynamic(() => import('./Graph'), { ssr: false })`. | Zero impacto no desempenho CSR; aumento negligenciável do tamanho do bundle (~110 kB gzip). |
| **TailwindCSS** | Estilização baseada em contêiner; Cytoscape desenha em `<canvas>` / SVG. | Classes Tailwind envolvem o contêiner Cytoscape; sem conflito. |
| **TanStack Query** | Fornece dados de grafo assíncronos; hook retorna nós/arestas para o Cytoscape. | Módulos independentes; sem dependências compartilhadas. |
| **Apollo Client** | Camada de busca GraphQL; resultados são armazenados em cache e transformados em elementos do Cytoscape. | Funciona lado a lado com TanStack Query quando usa caches dedicados. |
| **Ferramentas de Build** | Next 14 + Webpack 5 tree-shake ESM do Cytoscape. | Garanta `externalsPresets: { node: false }` para evitar avisos de polyfill. |
| **Licenciamento** | MIT (compatível com todas as bibliotecas da stack). | Sem obrigações copyleft. |

_Nenhuma colisão de versão detectada. Todos os pacotes dependentes têm versões atuais e manutenção ativa em 2025-Q2._

---

## Arquitetura em Contêineres

┌───────────────┐          GraphQL          ┌───────────────┐
│   Front-end   │  ───────────────────────▶ │     API BFF   │
│ Next.js (SSR) │ ◀───────────────────────  │ Apollo Server │
└───────────────┘                           └───────────────┘
        │  Bolt/Cypher           Prisma ORM │
        ▼                                   ▼
┌───────────────┐                     ┌──────────────┐
│    Neo4j 5    │                     │  MariaDB 11  │
└───────────────┘                     └──────────────┘

*A consistência dos dados é garantida exclusivamente pela camada de API.*

---

## Principais Melhorias na v2.0

### Gerenciamento de Ambientes
- Nova tabela `Environment` para substituir o campo enum `env`
- Suporte a múltiplos ambientes personalizáveis (development, homologation, production, etc.)
- Capacidade de rastrear componentes específicos em cada ambiente
- Visualização integrada de componentes implantados em cada ambiente com contadores e indicadores de status

### Instâncias de Componentes
- Nova entidade `Component_Instance` que representa a manifestação física/lógica de um componente em um ambiente específico
- Armazenamento de metadados específicos da instância como hostname e especificações técnicas em formato JSON flexível
- Relações específicas de instância com ADRs para análise de impacto mais precisa
- Suporte a relacionamentos entre instâncias específicas de componentes em diferentes ambientes

### Gerenciamento de ADRs Aprimorado
- Substituição do modelo de proprietário único por um sistema de múltiplos participantes via `ADR_Participant`
- Suporte a diferentes papéis (owner, reviewer, consumer) para cada participante
- Capacidade de vincular ADRs diretamente a instâncias de componentes específicas
- Sistema de referência a termos do Glossário nos textos dos ADRs usando marcação "#termo"
- Autocompletar durante a digitação de termos do Glossário com "#"
- Realce visual de termos referenciados com hover-cards exibindo definições
- **Validação de Integridade**: Trigger `trg_adr_owner_must_exist` garante que cada ADR tenha pelo menos um participante com o papel "owner"

### Categorização Hierárquica
- Tabela `Category` aprimorada para suportar organização mais estruturada pelo TRM (Technical Reference Model)
- Componentes podem ser categorizados em níveis hierárquicos (Infrastructure, Platform, Application, Shared Services)
- Suporte a imagens representativas para categorias, armazenadas como arquivos .png estáticos

### Gerenciamento de Times
- Associação de usuários a times organizacionais com rastreamento de data de ingresso
- Vinculação de times responsáveis a componentes específicos
- Dashboard resumido de atividades por time
- Visualização de componentes sob responsabilidade de cada time

### Glossário Integrado
- Sistema de glossário com termos categorizados por status (draft, approved, deprecated)
- Funcionalidade de autocomplete de "#tag" em formulários de componente, ADR e relacionamento
- Detecção e realce de termos referenciados por "#" em textos de ADRs
- Normalização de caracteres especiais e suporte à pesquisa por termos referenciados

### Backlog Unificado
- Tabela `RoadmapType` para substituir o enum de tipos fixos
- Suporte a tipos de itens de roadmap para equipes de desenvolvimento e infraestrutura
- Capacidade de definir cores e descrições personalizadas para cada tipo de item

### Melhorias na Auditoria
- Campo `metadata` tipo JSON na tabela `Log` para armazenamento de dados de auditoria mais detalhados
- Suporte a diferentes níveis de log (info, warn, error)

---

## Sequência de Inicialização do Sistema (Docker Compose)

1. `cp .env.example .env && ./scripts/gen-jwt.sh`  
2. `docker compose --profile base up -d --build`  
3. `docker compose exec api npx prisma migrate deploy && npm run prisma:seed`  
4. Para atualizações e manutenção: `./scripts/update-app.sh`
5. Observabilidade opcional: `docker compose --profile observability up -d`  
6. Teste de fumaça: login → criar componente → **visualizar grafo (Cytoscape)** → vincular ADR → diff → logout

---

## Integração MariaDB e Neo4j

A arquitetura dual de persistência foi mantida e aprimorada:

1. **MariaDB**: Continua sendo o banco primário para dados relacionais, agora com estrutura mais flexível. Versão mínima suportada 10.5+ (recomendada 11.8) com suporte a campos JSON e triggers.
2. **Neo4j**: Mantém o papel de armazenamento de grafos (versão 5), agora precisa sincronizar também as instâncias de componentes.

A comunicação entre os bancos acontece através do serviço de API, que:
- Mantém IDs consistentes entre os sistemas
- Sincroniza automaticamente mudanças entre bancos
- Provê um fluxo transacional para garantir consistência

### Sincronização MariaDB e Neo4j

A sincronização entre os dois bancos de dados para as novas entidades da v2.0 ocorre da seguinte forma:

1. **Component_Instance**: 
   - Quando uma instância é criada no MariaDB, ela também é criada no Neo4j (como nó `:Component_Instance`)
   - A API estabelece automaticamente as relações `:INSTANTIATES` (Componente → Instância) e `:DEPLOYED_IN` (Instância → Ambiente)

2. **Environment**: 
   - Ambientes são replicados do MariaDB para o Neo4j como nós `:Environment`
   - A ordem de criação sempre começa pelo MariaDB

3. **Team**: 
   - Times são replicados do MariaDB para o Neo4j como nós `:Team`
   - A relação `:MANAGED_BY` é criada entre componentes e times

4. **ADR_Participant**: 
   - No Neo4j, a relação `:PARTICIPATES_IN` é criada para conectar nós `:User` aos nós `:ADR`, incluindo o papel do participante como propriedade
   - Esta relação representa os dados da tabela `ADR_Participant` do MariaDB

---

## Endurecimento de Segurança
* Contêineres executados como não-root UID 10001; sistema de arquivos raiz somente leitura.  
* MariaDB & Neo4j criptografados com PKI interna; TLS em todos os lugares.  
* Senhas Argon2id; JWT RS256 (30 min de acesso / 8 h de atualização).  
* Helmet, rate-limiter-flexible; SBOM (`syft`) armazenado com artefatos.

---

## Modelo de Dados

### Neo4j – Grafo
- **Nós**: `:Component`, `:Component_Instance`, `:Environment`, `:Team`, `:ADR`
- **Campos Temporais**: `valid_from` / `valid_to` em nós `:Component`
- **Tipos de Relacionamento**: 
  - Existentes: `DEPENDS_ON`, `CONNECTS_TO`, `RUNS_ON`, `STORES_DATA_IN`, `CONTAINS`, `PROTECTS`, `HAS_DECISION`
  - Novos na v2.0: `INSTANTIATES`, `DEPLOYED_IN`, `MANAGED_BY`, `INSTANCE_CONNECTS_TO`, `AFFECTS_INSTANCE`, `PARTICIPATES_IN`

### MariaDB – Prisma
Schema Prisma 6.6 com:
- **Enums**: `Role`, `Status` ('planned', 'active', 'deprecated'), `RoadmapType`, `ADRStatus`
- **Modelos**: `User`, `Team`, `Component`, `Component_Instance`, `Environment`, `ADR`, `ADR_Participant`, `RoadmapItem`, `Log`
- **Tabelas de Glossário**: `GlossaryTerm`, `ComponentTag`, `RelationshipTag`, `ADRTag`
- **Trigger**: `trg_adr_owner_must_exist` para garantir que cada ADR tenha pelo menos um participante com papel "owner"

---

## Docker Compose (excerto)

```yaml
version: "3.9"

services:
  frontend:
    build: ./frontend
    image: beaver-frontend:2.0
    environment:
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: http://api:4000/graphql
    depends_on: [api]
    ports: ["3000:3000"]
    user: "10001:10001"

  api:
    build: ./api
    image: beaver-api:2.0
    environment:
      DATABASE_URL: mysql://beaver:beaver@mariadb:3306/beaver
      NEO4J_URL: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: neo4j
      NODE_ENV: production
    volumes: ["./secrets:/app/secrets:ro"]
    depends_on: [neo4j, mariadb]
    ports: ["4000:4000"]
    user: "10001:10001"

  mariadb:
    image: mariadb:11.8
    environment:
      MARIADB_ROOT_PASSWORD: root
      MARIADB_DATABASE: beaver
      MARIADB_USER: beaver
      MARIADB_PASSWORD: beaver
    volumes: ["mariadb-data:/var/lib/mysql"]
    ports: ["3306:3306"]

  neo4j:
    image: neo4j:5.26.5-enterprise
    environment:
      NEO4J_AUTH: neo4j/neo4j
    volumes: ["neo4j-data:/data"]
    ports: ["7474:7474", "7687:7687"]

volumes:
  mariadb-data:
  neo4j-data:
```

---

## Diretrizes de Desenvolvimento

| Camada     | Regras                                                        | Portões de Qualidade           |
|------------|---------------------------------------------------------------|--------------------------------|
| Front-end  | Next 14, Tailwind 4, TanStack Query 5, Cytoscape.js 3.29      | ESLint (flat), Biome, Playwright |
| API        | Pothos GraphQL, Apollo 4, Zod 3, CQRS                         | Jest 32, Supertest             |
| DB         | Prisma 6 migrações                                          | Prisma Studio                  |
| Infra      | Terraform 1.9, Dockerfile + Compose                           | Trivy, Hadolint                |

* **Pre-commit:** `lint-staged` → ESLint + Biome  
* **Conventional Commits** → semantic-release versionamento  
* **CI:** Matriz Node 20 & 22 · Buildx multi-arch · Assinatura de SBOM & provenance

---

## Modelo de Dados

As principais entidades do sistema são:

- **User**: Usuários da plataforma com autenticação e controle de acesso
- **Team**: Grupos organizacionais responsáveis por componentes
- **Component**: Elementos arquiteturais como serviços, aplicações, ou recursos
  - Status: 'planned', 'active', 'deprecated'
- **Component_Instance**: Manifestação específica de um componente em um ambiente
- **Environment**: Ambientes técnicos onde os componentes são executados
- **ADR**: Registros de decisões arquiteturais
- **ADR_Participant**: Participantes de ADRs com papéis definidos (owner, reviewer, consumer)
- **Category**: Categorias organizadas hierarquicamente pelo TRM
- **Glossary**: Termos padronizados com status e definições
- **RoadmapItem**: Itens de planejamento para equipes de desenvolvimento e infraestrutura

---

## Segurança e Controle de Acesso

O sistema continua utilizando um modelo de autenticação JWT (RS256, com tokens de acesso de 30 minutos e de atualização de 8 horas) com os seguintes níveis de acesso:

- **Admin**: Acesso completo, incluindo gerenciamento de usuários e configurações do sistema
- **Architect**: Pode criar e aprovar ADRs, gerenciar componentes e relacionamentos
- **Contributor**: Pode contribuir com conteúdo, criar rascunhos de ADRs e atualizar documentação
- **Viewer**: Acesso somente leitura a todos os dados

---

## Observabilidade (opcional)

`docker compose --profile observability` inicia Prometheus 2.52, Grafana 11, Loki 3, Tempo 3.  
Dashboards prontos e alertas são fornecidos em **`/observability/`**.

---

## Requisitos Não-Funcionais

- **Performance**: Otimização para renderização de grafos com até 10.000 nós em menos de 1 segundo em desktop
- **Internacionalização**: Suporte a en-us (padrão) e pt-br, com strings extraídas
- **Observabilidade**: Perfil opcional que inicia Prometheus, Grafana, Loki e Tempo
- **Backup**: Estratégia de backup com delta noturno do MariaDB (30 dias) e backup completo semanal do Neo4j (4 semanas)
- **Acessibilidade**: Contraste ≥ 4.5:1, navegável por teclado, foco visível

---

## Idiomas

* **Inglês Americano (en-us)** — padrão
* **Português Brasileiro (pt-br)**

---

## Backup & DR

| Ativo          | Frequência      | Ferramenta           | Retenção      |
|----------------|----------------|---------------------|----------------|
| MariaDB        | delta noturno   | `mariabackup`       | 30 dias        |
| Neo4j          | completo semanal | `neo4j-admin backup`| 4 semanas      |
| Object storage | —              | Rclone para S3/MinIO | imutabilidade 14 dias |

Runbooks estão localizados em **`/doc/runbooks/`**.

---

## Glossário (excerto)

| Termo          | Definição                         |
|----------------|----------------------------------|
| **ADR**        | Registro de Decisão Arquitetural  |
| **Glossário**  | Dicionário canônico da empresa    |
| **Change Set** | Lote de edições de grafo          |
| **BFF**        | Backend-for-Frontend              |
| **TRM**        | Modelo de Referência Técnica      |

---

## Padrões de Codificação e Documentação

Todo o código deve ser minuciosamente comentado em inglês (en-us). Quaisquer alterações na base de código devem ser documentadas no arquivo `docs/CHANGELOG` para garantir rastreabilidade e manutenibilidade.

---

## Conclusão

A arquitetura Beaver v2.0 traz avanços significativos na flexibilidade, rastreabilidade e organização dos dados, mantendo a base sólida da versão anterior. As melhorias permitem uma gestão mais precisa de ambientes, melhor colaboração em decisões arquiteturais e maior capacidade de planejamento integrado para equipes de desenvolvimento e infraestrutura. A introdução do sistema de referência a termos do Glossário usando "#" nos textos de ADRs facilita a padronização terminológica e melhora a compreensão dos documentos arquiteturais.

---

## Arquivos Anexos

- Relacionamento Entre Componentes no MariaDB e Neo4j: components_Neo4j-between-MariaDB.md 