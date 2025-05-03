# Beaver Architecture v2.0
*Last update → June 2024*

---

## Overview

Beaver is a technology architecture management platform that allows users to visualize, document, and manage software components, architectural decisions (ADRs), and relationships between different IT architecture elements. Version 2.0 introduces significant improvements to the data structure and the ability to manage multiple environments and component instances.

---

## Solution Summary `[what]`

| Domain | Key Points |
|--------|------------|
| **Graph Core** | `:Component` / `:Component_Instance` / relationships; native filters `environment`, `team`, `domain`, `criticality`; temporal queries via `valid_from` / `valid_to`. |
| **Decisions as Code** | ADR nodes interconnected with `HAS_DECISION` and `PARTICIPATES_IN`; complete visual differential and rollback. |
| **Impact Workflow** | Draft → visual differential → comments → merge by `ARCHITECT` role. |
| **Glossary** | Built-in dictionary; support for `#tag` in nodes, edges, and ADRs, with autocomplete and hover-cards. |
| **Graph Visualization** | Cytoscape.js renders nodes + edges; layouts: cola (force-directed), concentric, breadth-first. |
| **Teams and Environments** | Management of teams responsible for components and specific instances in multiple environments. |

---

## Non-Objectives `[out_of_scope]`
* Automatic discovery, real-time APM, FinOps.  
* **No CDC pipelines or message brokers (Kafka, RabbitMQ, etc.).**  
* CI/CD orchestration remains outside of Beaver.
* Automatic generation of compliance reports.

---

## Application Layers

### Frontend
- **Technologies**: Next.js, React, TailwindCSS
- **State Management**: TanStack Query
- **Visualization**: Cytoscape.js for interactive graph rendering
- **Authentication**: JWT with secure storage via HTTP-only cookies

### Backend
- **API**: Apollo Server with Pothos GraphQL
- **ORM**: Prisma for MariaDB interaction
- **Databases**:
  - **MariaDB**: Relational storage for metadata, users, and configurations
  - **Neo4j**: Graph storage for architecture visualization and relationship queries

---

## Technology Stack and Libraries

| Layer | Libraries / Tools | Version (2025-Q2) |
|-------|-------------------|-------------------|
| **Front-end** | Next.js · React · TailwindCSS · Apollo Client · @radix-ui components · class-variance-authority · clsx · d3 · date-fns · lucide-react · next-themes · tailwind-merge · tailwindcss-animate | 14.1.x · 18.2.x · 3.4.x · 3.13.x · latest · 0.7.x · 2.1.x · 7.9.x · 4.1.x · 0.330.x · 0.2.x · 2.3.x · 1.0.x |
| **API** | Node.js · Apollo Server · Pothos GraphQL · Zod · Prisma Client · Neo4j-driver · Express · argon2 · jsonwebtoken · pino · dotenv | 20-22 LTS · 4.12.x · 3.41.x · 3.22.x · 5.8.x · 5.15.x · 4.21.x · 0.31.x · 9.0.x · 8.17.x · 16.3.x |
| **Testing** | Jest · Supertest · Cypress/Playwright | 29.7.x · 6.3.x · latest |
| **Dev-Ex** | ESLint (flat) · Biome · TypeScript · ts-node · ts-node-dev | 9.x · 1.6.x · 5.x · 10.9.x · 2.0.x |
| **Container / IaC** | Docker Engine · Docker Compose v3.9 | latest · 3.9 |
| **Security** | Helmet · rate-limiter-flexible · express-mongo-sanitize · compression · csurf | latest |
| **Observability (optional)** | prom-client · @opentelemetry/api · Grafana Agent · Loki-JS · Tempo-JS | latest |
| **Compliance & SBOM** | Trivy · Syft | latest |
| **Backup & DR** | mariabackup · neo4j-admin | latest |

---

### Cytoscape Interdependency Assessment

| Aspect | Detail | Compatibility Notes |
|--------|--------|---------------------|
| **React Integration** | `react-cytoscapejs` provides a wrapper that exposes the Cytoscape instance via refs. | No breaking issues reported in React 17→18 migration. Works with React Strict Mode. |
| **Next.js SSR** | Cytoscape accesses `window`. Use `dynamic(() => import('./Graph'), { ssr: false })`. | Zero impact on CSR performance; negligible increase in bundle size (~110 kB gzip). |
| **TailwindCSS** | Container-based styling; Cytoscape draws in `<canvas>` / SVG. | Tailwind classes wrap the Cytoscape container; no conflict. |
| **TanStack Query** | Provides asynchronous graph data; hook returns nodes/edges for Cytoscape. | Independent modules; no shared dependencies. |
| **Apollo Client** | GraphQL fetch layer; results are cached and transformed into Cytoscape elements. | Works side by side with TanStack Query when using dedicated caches. |
| **Build Tools** | Next 14 + Webpack 5 tree-shake Cytoscape ESM. | Ensure `externalsPresets: { node: false }` to avoid polyfill warnings. |
| **Licensing** | MIT (compatible with all stack libraries). | No copyleft obligations. |

_No version collisions detected. All dependent packages have current versions and active maintenance in 2025-Q2._

---

## Container Architecture

┌───────────────┐          GraphQL          ┌───────────────┐
│   Front-end   │  ───────────────────────▶ │     API BFF   │
│ Next.js (SSR) │ ◀───────────────────────  │ Apollo Server │
└───────────────┘                           └───────────────┘
        │  Bolt/Cypher           Prisma ORM │
        ▼                                   ▼
┌───────────────┐                     ┌──────────────┐
│    Neo4j 5    │                     │  MariaDB 11  │
└───────────────┘                     └──────────────┘

*Data consistency is guaranteed exclusively by the API layer.*

---

## Key Improvements in v2.0

### Environment Management
- New `Environment` table to replace the `env` enum field
- Support for multiple customizable environments (development, homologation, production, etc.)
- Ability to track specific components in each environment
- Integrated visualization of components deployed in each environment with counters and status indicators

### Component Instances
- New `Component_Instance` entity that represents the physical/logical manifestation of a component in a specific environment
- Storage of instance-specific metadata such as hostname and technical specifications in flexible JSON format
- Instance-specific relationships with ADRs for more precise impact analysis
- Support for relationships between specific component instances in different environments

### Enhanced ADR Management
- Replacement of the single owner model with a system of multiple participants via `ADR_Participant`
- Support for different roles (owner, reviewer, consumer) for each participant
- Ability to link ADRs directly to specific component instances
- Glossary term reference system in ADR texts using "#term" markup
- Autocomplete during typing of Glossary terms with "#"
- Visual highlighting of referenced terms with hover-cards displaying definitions
- **Integrity Validation**: `trg_adr_owner_must_exist` trigger ensures that each ADR has at least one participant with the "owner" role

### Hierarchical Categorization
- Enhanced `Category` table to support more structured organization through the TRM (Technical Reference Model)
- Components can be categorized in hierarchical levels (Infrastructure, Platform, Application, Shared Services)
- Support for representative images for categories, stored as static .png files

### Team Management
- Association of users with organizational teams with tracking of join date
- Linking of responsible teams to specific components
- Summarized dashboard of activities by team
- Visualization of components under each team's responsibility

### Integrated Glossary
- Glossary system with terms categorized by status (draft, approved, deprecated)
- "#tag" autocomplete functionality in component, ADR, and relationship forms
- Detection and highlighting of terms referenced by "#" in ADR texts
- Normalization of special characters and support for searching by referenced terms

### Unified Backlog
- `RoadmapType` table to replace the fixed types enum
- Support for roadmap item types for development and infrastructure teams
- Ability to define custom colors and descriptions for each type of item

### Audit Improvements
- `metadata` JSON field in the `Log` table for storing more detailed audit data
- Support for different log levels (info, warn, error)

---

## System Initialization Sequence (Docker Compose)

1. `cp .env.example .env && ./scripts/gen-jwt.sh`  
2. `docker compose --profile base up -d --build`  
3. `docker compose exec api npx prisma migrate deploy && npm run prisma:seed`  
4. For updates and maintenance: `./scripts/update-app.sh`
5. Optional observability: `docker compose --profile observability up -d`  
6. Smoke test: login → create component → **view graph (Cytoscape)** → link ADR → diff → logout

---

## MariaDB and Neo4j Integration

The dual persistence architecture has been maintained and enhanced:

1. **MariaDB**: Continues to be the primary database for relational data, now with a more flexible structure. Minimum supported version 10.5+ (recommended 11.8) with support for JSON fields and triggers.
2. **Neo4j**: Maintains the role of graph storage (version 5), now needs to synchronize component instances as well.

Communication between the databases occurs through the API service, which:
- Maintains consistent IDs between systems
- Automatically synchronizes changes between databases
- Provides a transactional flow to ensure consistency

### MariaDB and Neo4j Synchronization

Synchronization between the two databases for the new v2.0 entities occurs as follows:

1. **Component_Instance**: 
   - When an instance is created in MariaDB, it is also created in Neo4j (as a `:Component_Instance` node)
   - The API automatically establishes the `:INSTANTIATES` (Component → Instance) and `:DEPLOYED_IN` (Instance → Environment) relationships

2. **Environment**: 
   - Environments are replicated from MariaDB to Neo4j as `:Environment` nodes
   - The creation order always starts with MariaDB

3. **Team**: 
   - Teams are replicated from MariaDB to Neo4j as `:Team` nodes
   - The `:MANAGED_BY` relationship is created between components and teams

4. **ADR_Participant**: 
   - In Neo4j, the `:PARTICIPATES_IN` relationship is created to connect `:User` nodes to `:ADR` nodes, including the participant's role as a property
   - This relationship represents the data from the `ADR_Participant` table in MariaDB

---

## Security Hardening
* Containers run as non-root UID 10001; read-only root filesystem.  
* MariaDB & Neo4j encrypted with internal PKI; TLS everywhere.  
* Argon2id passwords; JWT RS256 (30 min access / 8 h refresh).  
* Helmet, rate-limiter-flexible; SBOM (`syft`) stored with artifacts.

---

## Data Model

### Neo4j – Graph
- **Nodes**: `:Component`, `:Component_Instance`, `:Environment`, `:Team`, `:ADR`
- **Temporal Fields**: `valid_from` / `valid_to` in `:Component` nodes
- **Relationship Types**: 
  - Existing: `DEPENDS_ON`, `CONNECTS_TO`, `RUNS_ON`, `STORES_DATA_IN`, `CONTAINS`, `PROTECTS`, `HAS_DECISION`
  - New in v2.0: `INSTANTIATES`, `DEPLOYED_IN`, `MANAGED_BY`, `INSTANCE_CONNECTS_TO`, `AFFECTS_INSTANCE`, `PARTICIPATES_IN`

### MariaDB – Prisma
Prisma 6.6 schema with:
- **Enums**: `Role`, `Status` ('planned', 'active', 'deprecated'), `RoadmapType`, `ADRStatus`
- **Models**: `User`, `Team`, `Component`, `Component_Instance`, `Environment`, `ADR`, `ADR_Participant`, `RoadmapItem`, `Log`
- **Glossary Tables**: `GlossaryTerm`, `ComponentTag`, `RelationshipTag`, `ADRTag`
- **Trigger**: `trg_adr_owner_must_exist` to ensure that each ADR has at least one participant with the "owner" role

---

## Docker Compose (excerpt)

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

## Development Guidelines

| Layer     | Rules                                                        | Quality Gates                  |
|------------|---------------------------------------------------------------|--------------------------------|
| Front-end  | Next 14, Tailwind 4, TanStack Query 5, Cytoscape.js 3.29      | ESLint (flat), Biome, Playwright |
| API        | Pothos GraphQL, Apollo 4, Zod 3, CQRS                         | Jest 32, Supertest             |
| DB         | Prisma 6 migrations                                          | Prisma Studio                  |
| Infra      | Terraform 1.9, Dockerfile + Compose                           | Trivy, Hadolint                |

* **Pre-commit:** `lint-staged` → ESLint + Biome  
* **Conventional Commits** → semantic-release versioning  
* **CI:** Matrix Node 20 & 22 · Buildx multi-arch · SBOM & provenance signing

---

## Data Model

The main system entities are:

- **User**: Platform users with authentication and access control
- **Team**: Organizational groups responsible for components
- **Component**: Architectural elements such as services, applications, or resources
  - Status: 'planned', 'active', 'deprecated'
- **Component_Instance**: Specific manifestation of a component in an environment
- **Environment**: Technical environments where components are executed
- **ADR**: Architectural decision records
- **ADR_Participant**: ADR participants with defined roles (owner, reviewer, consumer)
- **Category**: Categories organized hierarchically by TRM
- **Glossary**: Standardized terms with status and definitions
- **RoadmapItem**: Planning items for development and infrastructure teams

---

## Security and Access Control

The system continues to use a JWT authentication model (RS256, with 30-minute access tokens and 8-hour refresh tokens) with the following access levels:

- **Admin**: Complete access, including user management and system configurations
- **Architect**: Can create and approve ADRs, manage components and relationships
- **Contributor**: Can contribute content, create ADR drafts, and update documentation
- **Viewer**: Read-only access to all data

---

## Observability (optional)

`docker compose --profile observability` starts Prometheus 2.52, Grafana 11, Loki 3, Tempo 3.  
Ready-made dashboards and alerts are provided in **`/observability/`**.

---

## Non-Functional Requirements

- **Performance**: Optimization for rendering graphs with up to 10,000 nodes in less than 1 second on desktop
- **Internationalization**: Support for en-us (default) and pt-br, with extracted strings
- **Observability**: Optional profile that starts Prometheus, Grafana, Loki, and Tempo
- **Backup**: Backup strategy with nightly MariaDB delta (30 days) and weekly Neo4j full backup (4 weeks)
- **Accessibility**: Contrast ≥ 4.5:1, keyboard navigable, visible focus

---

## Languages

* **American English (en-us)** — default
* **Brazilian Portuguese (pt-br)**

---

## Backup & DR

| Asset          | Frequency      | Tool                | Retention      |
|----------------|----------------|---------------------|----------------|
| MariaDB        | nightly delta   | `mariabackup`       | 30 days        |
| Neo4j          | weekly full | `neo4j-admin backup`| 4 weeks      |
| Object storage | —              | Rclone to S3/MinIO | 14 days immutability |

Runbooks are located in **`/doc/runbooks/`**.

---

## Glossary (excerpt)

| Term          | Definition                         |
|----------------|----------------------------------|
| **ADR**        | Architectural Decision Record  |
| **Glossary**  | Company's canonical dictionary    |
| **Change Set** | Batch of graph edits          |
| **BFF**        | Backend-for-Frontend              |
| **TRM**        | Technical Reference Model      |

---

## Coding and Documentation Standards

All code must be thoroughly commented in English (en-us). Any changes to the codebase should be documented in the `docs/CHANGELOG` file to ensure traceability and maintainability.

---

## Conclusion

The Beaver v2.0 architecture brings significant advances in flexibility, traceability, and data organization, while maintaining the solid foundation of the previous version. The improvements allow for more precise environment management, better collaboration in architectural decisions, and greater capacity for integrated planning for development and infrastructure teams. The introduction of the Glossary term reference system using "#" in ADR texts facilitates terminological standardization and improves the understanding of architectural documents.

---

## Attached Files

- Relationship Between Components in MariaDB and Neo4j: components_Neo4j-between-MariaDB.md 