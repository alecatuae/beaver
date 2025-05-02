# Requisitos Beaver v2.0

## Visão Geral

Este documento apresenta os requisitos para a versão 2.0 da plataforma Beaver, uma ferramenta de gerenciamento de arquitetura empresarial. A v2.0 representa uma evolução significativa da plataforma, introduzindo novos recursos como o modelo TRM (Technical Reference Model), gerenciamento de instâncias específicas de componentes em múltiplos ambientes, sistema aprimorado de ADRs com múltiplos participantes, e capacidade de referência direta a termos do Glossário.

O Beaver foi projetado para centralizar a documentação arquitetural, facilitar a colaboração entre equipes de tecnologia, e permitir uma visão abrangente da infraestrutura corporativa. Esta versão expande essas capacidades com foco em:

1. **Rastreabilidade aprimorada**: Gerenciamento de instâncias específicas de componentes em diferentes ambientes
2. **Colaboração estruturada**: Sistema de participantes múltiplos em ADRs com papéis definidos
3. **Padronização terminológica**: Referência direta a termos do Glossário usando "#" nos textos
4. **Visualização hierárquica**: Categorização de componentes pelo modelo TRM
5. **Gestão organizacional**: Vinculação de times a componentes e usuários

Os requisitos estão organizados em categorias de negócio, funcionais (por módulo) e não-funcionais, proporcionando uma visão completa das capacidades e limitações do sistema.

---

# Requisitos de Negócio

| Código  | Descrição                                                                                               | Fontes |
|---------|---------------------------------------------------------------------------------------------------------|--------|
| BN-01   | Centralizar mapeamento, documentação e análise da arquitetura corporativa em uma única plataforma web.  | ​      |
| BN-02   | Permitir governança de decisões por meio de Architecture Decision Records (ADR) versionados, com histórico completo e diff. |        |
| BN-03   | Oferecer visão categorizada pelo TRM (Technical Reference Model) com suporte a múltiplos ambientes, permitindo rastrear componentes específicos e suas instâncias em cada ambiente para facilitar auditoria tecnológica. |        |
| BN-04   | Possibilitar análise de impacto (componentes, relacionamentos, riscos) antes de aplicar mudanças na arquitetura. |        |
| BN-05   | Suportar colaboração de equipes organizacionais com gestão de times, membros e responsabilidades sobre componentes, além de papéis (Admin, Architect, Contributor, Viewer) e trilha de auditoria detalhada. | ​      |
| BN-06   | Manter documentação canônica (Glossário, roadmaps, logs) integrada ao grafo para eliminar silos de conhecimento. |        |
| BN-07   | Garantir rastreamento de compliance e riscos ligando ADRs a controles, riscos e políticas internas.     | ​      |
| BN-08   | Possibilitar planejamento unificado para equipes de desenvolvimento e infraestrutura através de um backlog integrado com tipos personalizáveis. | ​      |
| BN-09   | Permitir referência direta a termos do Glossário nos textos de ADRs através de marcação com "#" (hashtag), facilitando a padronização terminológica e compreensão dos documentos arquiteturais. | ​      |

# Requisitos Funcionais

> Agrupados por módulo / página principal (UI) de acordo com Page Details e Style Guide.

## 1. Component Management

| Código       | Descrição                                                                                                  | Fontes |
|--------------|------------------------------------------------------------------------------------------------------------|--------|
| RF-CMP-01    | CRUD completo de componentes com validação (nome, descrição ≤ 256 caracteres, status).                     | ​      |
| RF-CMP-02    | Associação de componentes a categorias, times responsáveis e tags (#glossary), permitindo rastreabilidade organizacional. |        |
| RF-CMP-03    | Pesquisa em tempo real + filtros (status, tag, time responsável, ambiente).                                | ​      |
| RF-CMP-04    | Paginação infinita (12 iniciais / +8 por scroll).                                                          | ​      |
| RF-CMP-05    | Listagem em cards 180 px com truncamento inteligente, badges de status, tags e time responsável.          | ​      |
| RF-CMP-06    | Gerenciamento de instâncias específicas de componentes em cada ambiente, incluindo hostname e especificações técnicas. | ​      |

## 2. Relationship Management

| Código       | Descrição                                                                                                  | Fontes |
|--------------|------------------------------------------------------------------------------------------------------------|--------|
| RF-REL-01    | CRUD de relacionamentos entre componentes com validação (source, target, type).                            |        |
| RF-REL-02    | Prevenção de duplicidades e destaque visual do tipo (badge colorido).                                      | ​      |
| RF-REL-03    | Hover em card destaca nós conectados no grafo em tempo real.                                               | ​      |
| RF-REL-04    | Suporte a relacionamentos entre instâncias específicas de componentes em diferentes ambientes.             | ​      |

## 3. ADR Management

| Código       | Descrição                                                                                                  | Fontes               |
|--------------|------------------------------------------------------------------------------------------------------------|----------------------|
| RF-ADR-01    | Criar, editar, visualizar ADRs seguindo template (Context, Decision, Consequences, Alternatives, Status), com suporte a múltiplos participantes (owner, reviewer, consumer).  | ​                    |
| RF-ADR-02    | Selecionar artefatos afetados (Component, Component Instance, Relationship, Risk) via drawer com busca.     | wireframe "Create ADR" |
| RF-ADR-03    | Exibir lista de ADRs com filtros por status e busca; cards mostram snippet + contagem de impacto.         | wireframe "ADR List" |
| RF-ADR-04    | Painel de detalhes renderiza markdown completo do ADR e abas Affected & Timeline.                          | wireframe "ADR List" |
| RF-ADR-05    | Suportar diff visual e rollback de versões (impact workflow).                                              | ​                    |
| RF-ADR-06    | Vincular participantes aos ADRs com papéis definidos (owner, reviewer, consumer), permitindo visibilidade de responsabilidades na tomada de decisão. | ​                    |
| RF-ADR-07    | Permitir referência a termos do Glossário nos textos dos ADRs usando "#termo", com autocompletar durante a digitação, realce visual dos termos referenciados e hover-card com definição. | ​                    |

## 4. Impact Workflow

| Código       | Descrição                                                                                                  | Fontes |
|--------------|------------------------------------------------------------------------------------------------------------|--------|
| RF-IMP-01    | Estados: Draft → Review (comments) → Accepted/Rejected → Merged.                                           | ​      |
| RF-IMP-02    | Calcula e exibe impacto (qtde de componentes, instâncias específicas, riscos) antes do merge, incluindo análise por ambiente. | ​      |
| RF-IMP-03    | Permite rollback automático a ADR anterior (status Superseded).                                            | ​      |

## 5. TRM & Category

| Código       | Descrição                                                                                                  | Fontes |
|--------------|------------------------------------------------------------------------------------------------------------|--------|
| RF-TRM-01    | CRUD de categorias com imagem .png selecionada de lista estática (/public/images/categories).              | ​      |
| RF-TRM-02    | Agrupar categorias em TRM Levels (Infrastructure, Platform, Application, Shared Services).                 | ​      |
| RF-TRM-03    | Filtro e gráfico por TRM Level na Architecture Overview.                                                   | ​      |
| RF-TRM-04    | Associar times responsáveis a componentes, possibilitando visão de responsabilidades técnicas na organização. | ​      |

## 6. Glossary

| Código       | Descrição                                                                                                  | Fontes |
|--------------|------------------------------------------------------------------------------------------------------------|--------|
| RF-GLO-01    | CRUD de termos com status (draft/approved/deprecated).                                                     | ​      |
| RF-GLO-02    | Autocomplete #tag em formulários de componente, ADR, relacionamento.                                       | ​      |
| RF-GLO-03    | Hover-card com definição no grafo e nas listas.                                                            | ​      |
| RF-GLO-04    | Funcionalidade de detecção e realce de termos referenciados por "#" em textos de ADRs, com normalização de caracteres especiais e suporte à pesquisa por termos referenciados. | ​      |

## 7. Graph Visualization

| Código       | Descrição                                                                                                  | Fontes                   |
|--------------|------------------------------------------------------------------------------------------------------------|--------------------------|
| RF-GRF-01    | Renderizar grafo (Cytoscape.js) com layouts cola, concentric, breadth-first.                               | ​                        |
| RF-GRF-02    | Mostrar nós Component, ComponentInstance, Environment, Team e ADR; arestas técnicas + DECIDES_ON.           | ​                        |
| RF-GRF-03    | Filtros nativos (environment, team, domain, criticality, status).                                           | ​                        |
| RF-GRF-04    | Clique em nó abre painel de detalhes (component, instance, ADR, etc.).                                      | Style guide – Details panel |

## 8. Segurança & Auditoria

| Código       | Descrição                                                                                                  | Fontes   |
|--------------|------------------------------------------------------------------------------------------------------------|----------|
| RF-SEC-01    | Autenticação JWT (RS256, access 30 min / refresh 8 h).                                                     | ​        |
| RF-SEC-02    | RBAC: Admin (full), Architect (edit ADRs), Contributor (edit components/rel), Viewer (read-only).           | inferido BN-05 |
| RF-SEC-03    | Log de atividades (tabela Log) com níveis (info, warn, error) e metadados JSON para cada ação.              | ​        |

## 9. Gerenciamento de Ambientes e Instâncias

| Código       | Descrição                                                                                                  | Fontes                   |
|--------------|------------------------------------------------------------------------------------------------------------|--------------------------|
| RF-ENV-01    | CRUD de ambientes onde componentes são implantados (development, homologation, production, etc.).           | ​                        |
| RF-ENV-02    | Visualização de componentes implantados em cada ambiente com contadores e indicadores.                      | ​                        |
| RF-INS-01    | CRUD de instâncias específicas de componentes em diferentes ambientes.                                      | ​                        |
| RF-INS-02    | Armazenamento de especificações técnicas em formato JSON flexível para cada instância.                      | ​                        |
| RF-INS-03    | Associação de ADRs a instâncias específicas com níveis de impacto (low, medium, high).                      | ​                        |

## 10. Gerenciamento de Times

| Código       | Descrição                                                                                                  | Fontes                   |
|--------------|------------------------------------------------------------------------------------------------------------|--------------------------|
| RF-TEAM-01   | CRUD de times organizacionais com descrição e membros.                                                      | ​                        |
| RF-TEAM-02   | Associação de usuários a times com rastreamento de data de ingresso.                                        | ​                        |
| RF-TEAM-03   | Visualização de componentes sob responsabilidade de cada time.                                              | ​                        |
| RF-TEAM-04   | Dashboard resumido de atividades por time.                                                                  | ​                        |

# Requisitos Não-Funcionais Essenciais (Resumo)

| Categoria          | Exigência                                                                                       | Fonte |
|--------------------|--------------------------------------------------------------------------------------------------|-------|
| Performance        | Listas usam infinite scroll; grafo até 10.000 nós com render < 1 s em desktop.                  | ​     |
| Escalabilidade     | API BFF Node 20/22; bancos MariaDB 10.5+ (suporte a JSON e triggers) + Neo4j 5 separados em Docker. | ​    |
| Armazenamento      | Suporte a armazenamento de estruturas de dados flexíveis em campos JSON para especificações técnicas e metadados de log. | ​ |
| Observabilidade    | Perfil opcional inicia Prometheus, Grafana, Loki, Tempo.                                        | ​     |
| Acessibilidade     | Contraste ≥ 4.5:1, navegável por teclado, foco visível.                                          | ​     |
| Internacionalização| Suporte en-us (default) e pt-br; strings extraídas. Interface e documentação disponíveis em ambos idiomas. | ​     |
| Backup & DR        | MariaDB nightly delta (30 d), Neo4j weekly full (4 sem).                                        | ​     |
