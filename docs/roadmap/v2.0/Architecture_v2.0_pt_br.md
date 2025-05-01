# Arquitetura Beaver v2.0

## Visão Geral

O Beaver é uma plataforma de gerenciamento de arquitetura empresarial que permite visualizar, documentar e gerenciar componentes de software, decisões arquiteturais (ADRs) e relacionamentos entre os diferentes elementos da arquitetura de TI. A versão 2.0 introduz melhorias significativas na estrutura de dados e na capacidade de gerenciamento de múltiplos ambientes e instâncias de componentes.

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

## Principais Melhorias na v2.0

### Gerenciamento de Ambientes
- Nova tabela `Environment` para substituir o campo enum `env`
- Suporte a múltiplos ambientes personalizáveis (development, homologation, production, etc.)
- Capacidade de rastrear componentes específicos em cada ambiente

### Instâncias de Componentes
- Nova entidade `Component_Instance` que representa a manifestação física/lógica de um componente em um ambiente específico
- Armazenamento de metadados específicos da instância como hostname e especificações técnicas
- Relações específicas de instância com ADRs para análise de impacto mais precisa

### Gerenciamento de ADRs Aprimorado
- Substituição do modelo de proprietário único por um sistema de múltiplos participantes via `ADR_Participant`
- Suporte a diferentes papéis (owner, reviewer, consumer) para cada participante
- Capacidade de vincular ADRs diretamente a instâncias de componentes específicas

### Categorização Hierárquica
- Tabela `Category` aprimorada para suportar organização mais estruturada
- Componentes podem ser categorizados de forma mais granular

### Backlog Unificado
- Tabela `RoadmapType` para substituir o enum de tipos fixos
- Suporte a tipos de itens de roadmap para equipes de desenvolvimento e infraestrutura
- Capacidade de definir cores e descrições personalizadas para cada tipo de item

### Melhorias na Auditoria
- Campo `metadata` tipo JSON na tabela `Log` para armazenamento de dados de auditoria mais detalhados
- Suporte a diferentes níveis de log (info, warn, error)

## Integração MariaDB e Neo4j

A arquitetura dual de persistência foi mantida e aprimorada:

1. **MariaDB**: Continua sendo o banco primário para dados relacionais, agora com estrutura mais flexível.
2. **Neo4j**: Mantém o papel de armazenamento de grafos, agora precisa sincronizar também as instâncias de componentes.

A comunicação entre os bancos acontece através do serviço de API, que:
- Mantém IDs consistentes entre os sistemas
- Sincroniza automaticamente mudanças entre bancos
- Provê um fluxo transacional para garantir consistência

## Modelo de Dados

As principais entidades do sistema são:

- **User**: Usuários da plataforma com autenticação e controle de acesso
- **Team**: Grupos organizacionais responsáveis por componentes
- **Component**: Elementos arquiteturais como serviços, aplicações, ou recursos
- **Component_Instance**: Manifestação específica de um componente em um ambiente
- **Environment**: Ambientes técnicos onde os componentes são executados
- **ADR**: Registros de decisões arquiteturais
- **RoadmapItem**: Itens de planejamento para equipes de desenvolvimento e infraestrutura

## Segurança e Controle de Acesso

O sistema continua utilizando um modelo de autenticação JWT com os seguintes níveis de acesso:

- **Admin**: Acesso completo, incluindo gerenciamento de usuários e configurações do sistema
- **Architect**: Pode criar e aprovar ADRs, gerenciar componentes e relacionamentos
- **Contributor**: Pode contribuir com conteúdo, criar rascunhos de ADRs e atualizar documentação
- **Viewer**: Acesso somente leitura a todos os dados

## Conclusão

A arquitetura Beaver v2.0 traz avanços significativos na flexibilidade, rastreabilidade e organização dos dados, mantendo a base sólida da versão anterior. As melhorias permitem uma gestão mais precisa de ambientes, melhor colaboração em decisões arquiteturais e maior capacidade de planejamento integrado para equipes de desenvolvimento e infraestrutura. 