# Page Details

## Main Pages

### Architecture Overview
- **Description**: This page allows users to view and interact with the enterprise architecture graph. It uses Cytoscape.js to render nodes and edges, offering layouts such as cola (force-directed), concentric, and breadth-first.

- **Features**:
  - Interactive graph visualization.
  - Native filters by environment, domain, and criticality.
  - Temporal queries support via `valid_from` and `valid_to`.

### ADR Management
- **Description**: Dedicated page for managing Architectural Decision Records (ADRs).
- **Features**:
  - Creation and editing of ADRs.
  - Full diff and rollback capabilities.
  - Integration with impact workflow for comments and merges.

### Impact Workflow
- **Description**: Facilitates the impact workflow, allowing architects to manage changes.
- **Features**:
  - Draft, visual diff, comments, and merge by architect role.

### Glossary
- **Description**: Provides an embedded dictionary with tag support.
- **Features**:
  - Autocomplete terms with `#tag`.
  - Hover-card definitions.
  - Bulk tagging and search support via API.

## Administration Pages

### User Management
- **Description**: Admin page for managing user accounts and roles.
- **Features**:
  - Create, read, update, and delete (CRUD) operations for users.
  - Role assignment and management.

### System Settings
- **Description**: Allows administrators to configure system-wide settings.
- **Features**:
  - Configuration of application settings.
  - Monitoring and logging settings.

## Authentication Pages

### Login
- **Description**: Page for user authentication.
- **Features**:
  - Secure login with JWT authentication.
  - Password recovery and reset options.

### Registration
- **Description**: Allows new users to register for an account.
- **Features**:
  - User registration form.
  - Email verification process.

## CRUD Operations

### Component Management
- **Description**: Page for managing software components.
- **Features**:
  - CRUD operations for components.
  - Association of components with ADRs and other entities.
  - Interactive form with field validations:
    - Required name and description fields
    - Description field limited to 256 characters with visual counter
    - Dynamic tag management with add/remove capabilities
    - Status selection (Active, Inactive, Deprecated)
  - Real-time list updates after create, edit, or delete operations
  - Modal-based interface for detail viewing and editing
  - Responsive card-based layout:
    - Fixed-height component cards (180px) for consistent visual presentation
    - Intelligent text truncation for long names and descriptions
    - Limited tag display (up to 3) with counter for additional tags
    - Compact date display format
    - Status indication with color-coded badges
  - Performance optimized interface:
    - Infinite scroll implementation loading 12 components initially
    - Additional components load automatically (8 at a time) when scrolling down
    - Intersection Observer API used for efficient detection of scroll position
    - Visual loading indicator for transparency during data fetching
    - Responsive grid layout adapting to different screen sizes (1, 2, or 3 columns)
  - Improved user protection and experience:
    - Confirmation dialog for deletion operations to prevent accidental data loss
    - Clear warning about irreversible actions
    - Consistent button placement and styling in confirmation dialogs
    - Ability to cancel deletion operations
  - Flexible data organization:
    - Advanced sorting capabilities for component listing
    - Sort by name (alfabético), date (cronológico), or status (prioridade)
    - Visual indication of current sort field and direction (ascendente/descendente)
    - Persistent sorting state during session
    - Clear UI with dropdown menu for sort options

A interface de gerenciamento de componentes oferece uma experiência intuitiva para criar, visualizar, editar e excluir componentes no sistema. Principais características incluem:

- Layout responsivo baseado em cards com altura fixa de componentes (180px) para apresentação visual consistente
- Truncamento inteligente para nomes e descrições longas
- Exibição de tags limitada a três, com contador para tags adicionais
- Formato de data compacto
- Indicação de status com badges coloridos
- Formulário de criação/edição validado com contador de caracteres para descrições (limite de 256 caracteres)
- Pesquisa em tempo real por nome, descrição ou tags
- Paginação infinita para melhor desempenho com grandes conjuntos de dados

### Relationship Management
- **Description**: Page for managing relationships between existing components in the architecture graph.
- **Features**:
  - Full CRUD operations for relationships (Create, Read, Update, Delete).
  - Relationships link two pre-existing components via a defined connection type.
  - Interactive form with field validations:
    - Required fields: Source Component, Target Component, and Relationship Type.
    - Optional field for additional description (up to 256 characters) with visual counter.
    - Relationship type selection from a predefined list (e.g., CONNECTS_TO, PROTECTS, STORES_DATA_IN).
    - Automatic validation to prevent creation of duplicate relationships between the same components.
  - Real-time list updates after create, edit, or delete operations.
  - Modal-based interface for relationship detail viewing and editing.
  - Responsive card-based layout for relationship listings:
    - Fixed-height cards (180px) displaying Source → Target and Relationship Type.
    - Intelligent truncation for long component names and description.
    - Color-coded badge displaying the relationship type.
    - Visual indicator if the relationship has a description.
    - Compact display format for creation and last update dates.
  - Performance optimized interface:
    - Infinite scroll implementation loading 12 relationships initially.
    - Additional relationships load automatically (8 at a time) on scroll.
    - Intersection Observer API used for efficient lazy loading.
    - Visual loading spinner during data fetching.
    - Responsive grid layout adapting to different screen sizes (1, 2, or 3 columns).
  - Improved user protection and experience:
    - Confirmation dialog required for delete operations with irreversible action warning.
    - Consistent placement of confirmation and cancellation buttons.
    - Prevention of deletion if components are currently involved in critical system processes (optional rule).
  - Flexible data organization:
    - Advanced sorting capabilities for relationships listing:
      - Sort by Source Component (alphabetical), Target Component (alphabetical), or Relationship Type.
      - Visual indication of active sort field and order (ascending/descending).
      - Persistent sorting state during user session.
    - Clear and compact UI with dropdown menu for sort options.
  - Advanced filtering:
    - Filter by Relationship Type.
    - Search by Source or Target Component name (partial matches allowed).
    - Combination of filters and search to refine results.
- **Additional Interaction Patterns**:
  - Hovering over a relationship card highlights the related nodes in the main graph visualization.
  - Editing a relationship updates the corresponding graph edge in real-time.
  - Deleting a relationship removes the corresponding edge immediately from the graph without requiring full reload.

A funcionalidade de gerenciamento de relacionamentos permite definir e gerenciar conexões entre componentes no sistema. Características principais incluem:

- Interface completa para CRUD (Criar, Ler, Atualizar, Excluir) de relacionamentos
- Cards de relacionamento com altura fixa (160px) para visualização consistente
- Badges coloridos por tipo de relacionamento para identificação visual rápida
- Indicador direcional claro entre componentes de origem e destino
- Formulário de criação/edição com:
  - Seleção facilitada de componentes com campo de busca
  - Escolha intuitiva de tipos de relacionamento com indicadores visuais
  - Campo de descrição opcional (limite de 256 caracteres)
  - Validação completa de formulários
- Filtragem de relacionamentos por tipo e componentes envolvidos
- Confirmação de exclusão para prevenir remoções acidentais
- Atualização em tempo real após ações do usuário (criar, editar, excluir)
- Integração completa com o banco de dados de grafos Neo4j para persistência de relacionamentos

### Team Management
- **Description**: Manage teams within the organization.
- **Features**:
  - CRUD operations for teams.
  - Team role and permission management.

## Conclusion
This document provides a detailed overview of the main pages within the Beaver application, including administrative and authentication functionalities. For more detailed information, refer to the `Architecture_v1.2_en_us.md` document. 