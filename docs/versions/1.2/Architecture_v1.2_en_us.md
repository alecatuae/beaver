# Beaver – Architecture Documentation **MVP v1.2**  
*Last update → May 17 2024*

---

## 1 · Overview
**Beaver** is a lightweight web platform that **maps, documents and analyses** enterprise architecture in a **Neo4j 5 graph**.  
Teams interact through an **intuitive UI** (React + Next 14) with rich filters and **interactive graph visualization powered by Cytoscape**—no Cypher or GraphQL knowledge required.

---

## 2 · Solution Summary `[what]`

| Domain | Key Points |
|--------|------------|
| **Graph Core** | `:Component` / relationships; native filters `environment`, `domain`, `criticality`; temporal queries via `valid_from` / `valid_to`. |
| **Decisions-as-Code** | ADR nodes linked with `HAS_DECISION`; full diff & rollback. |
| **Impact Workflow** | Draft → visual diff → comments → merge by role `ARCHITECT`. |
| **Glossary** | Embedded dictionary; `#tag` support across nodes, edges and ADRs. |
| **Graph View** | Cytoscape.js renders nodes + edges; layouts: cola (force-directed), concentric, breadth-first. |

---

## 3 · Non-Goals `[out_of_scope]`
* Automatic discovery, real-time APM, FinOps.  
* **No CDC pipelines or message brokers (Kafka, RabbitMQ, etc.).**  
* CI/CD orchestration remains outside Beaver.

---

## 4 · Technology Stack & Libraries

| Layer | Libraries / Tools | Version (2025-Q2) |
|-------|-------------------|-------------------|
| **Front-end** | Next.js · React · TailwindCSS · Apollo Client · @radix-ui components · class-variance-authority · clsx · d3 · date-fns · lucide-react · next-themes · tailwind-merge · tailwindcss-animate | 14.1.x · 18.2.x · 3.4.x · 3.13.x · latest · 0.7.x · 2.1.x · 7.9.x · 4.1.x · 0.330.x · 0.2.x · 2.3.x · 1.0.x |
| **API** | Node.js · Apollo Server · Pothos GraphQL · Zod · Prisma Client · Neo4j-driver · Express · argon2 · jsonwebtoken · pino · dotenv | 20-22 LTS · 4.12.x · 3.41.x · 3.22.x · 5.8.x · 5.15.x · 4.21.x · 0.31.x · 9.0.x · 8.17.x · 16.3.x |
| **Testing** | Jest · Supertest · Cypress/Playwright | 29.7.x · 6.3.x · latest |
| **Dev-Ex** | ESLint (flat) · Biome · TypeScript · ts-node · ts-node-dev | 9.x · 1.6.x · 5.x · 10.9.x · 2.0.x |
| **Container / IaC** | Docker Engine · Docker Compose v3.9 | latest · 3.9 |
| **Security** | Helmet · rate-limiter-flexible · express-mongo-sanitize · compression · csurf | latest |
| **Observability (opt-in)** | prom-client · @opentelemetry/api · Grafana Agent · Loki-JS · Tempo-JS | latest |
| **Compliance & SBOM** | Trivy · Syft | latest |
| **Back-up & DR** | mariabackup · neo4j-admin | latest |

---

### 4.1 · Cytoscape Inter-dependency Assessment

| Aspect | Detail | Compatibility Notes |
|--------|--------|---------------------|
| **React Integration** | `react-cytoscapejs` provides a thin wrapper exposing Cytoscape&nbsp;instance via refs. | No React 17→18 breaking issues reported. Works with React Strict Mode. |
| **Next.js SSR** | Cytoscape accesses `window`. Use `dynamic(() => import('./Graph'), { ssr: false })`. | Zero impact on CSR performance; negligible bundle-size increase (~110 kB gzip). |
| **TailwindCSS** | Styling is container-based; Cytoscape draws on `<canvas>` / SVG. | Tailwind classes surround the Cytoscape container; no conflict. |
| **TanStack Query** | Supplies async graph data; hook returns nodes/edges to Cytoscape. | Independent modules; no shared dependencies. |
| **Apollo Client** | GraphQL fetch layer; results cached then transformed to Cytoscape elements. | Works side-by-side with TanStack Query when using dedicated caches. |
| **Build Tooling** | Next 14 + Webpack 5 tree-shakes Cytoscape ESM. | Ensure `externalsPresets: { node: false }` to avoid polyfill warnings. |
| **Licensing** | MIT (compatible with all stack libs). | No copyleft obligations. |

_No version collision detected. All dependent packages have current releases and active maintenance in 2025-Q2._

---

## 5 · Containerized Architecture

┌───────────────┐          GraphQL          ┌───────────────┐
│   Front-end   │  ───────────────────────▶ │     API BFF   │
│ Next.js (SSR) │ ◀───────────────────────  │ Apollo Server │
└───────────────┘                           └───────────────┘
        │  Bolt/Cypher           Prisma ORM │
        ▼                                   ▼
┌───────────────┐                     ┌──────────────┐
│    Neo4j 5    │                     │  MariaDB 11  │
└───────────────┘                     └──────────────┘

*Data consistency is enforced exclusively through the API layer.*

---

## 6 · System Startup Sequence (Docker Compose)

1. `cp .env.example .env && ./scripts/gen-jwt.sh`  
2. `docker compose --profile base up -d --build`  
3. `docker compose exec api npx prisma migrate deploy && npm run prisma:seed`  
4. For updates and maintenance: `./scripts/update-app.sh`
5. Optional observability: `docker compose --profile observability up -d`  
6. Smoke test: login → create component → **view graph (Cytoscape)** → link ADR → diff → logout.

---

## 7 · Security Hardening
* Containers run as non-root UID 10001; root FS read-only.  
* MariaDB & Neo4j encrypted with internal PKI; TLS everywhere.  
* Argon2id passwords; JWT RS256 (30 min access / 8 h refresh).  
* Helmet, rate-limiter-flexible; SBOM (`syft`) stored with artefacts.

---

## 8 · Data Models

### 8.1 Neo4j – Graph
`[:Component]` super-label with temporal fields `valid_from` / `valid_to`; relationship types `DEPENDS_ON`, `CONNECTS_TO`, `RUNS_ON`, `STORES_DATA_IN`, `CONTAINS`, `PROTECTS`.

### 8.2 MariaDB – Prisma
Prisma schema 6.6 featuring enums `Role`, `Env`, `Status`, `RoadmapType`, `ADRStatus` and models `User`, `Team`, `Component`, `ADR`, `RoadmapItem`, `Log`, plus glossary tables `GlossaryTerm`, `ComponentTag`, `RelationshipTag`, `ADRTag`.

---

## 9 · Docker Compose (excerpt)

```yaml
version: "3.9"

services:
  frontend:
    build: ./frontend
    image: beaver-frontend:1.2
    environment:
      NEXT_PUBLIC_GRAPHQL_ENDPOINT: http://api:4000/graphql
    depends_on: [api]
    ports: ["3000:3000"]
    user: "10001:10001"

  api:
    build: ./api
    image: beaver-api:1.2
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

---

## 10 · Development Guidelines

| Layer      | Rules                                                         | Quality Gates                |
|------------|---------------------------------------------------------------|------------------------------|
| Front-end  | Next 14, Tailwind 4, TanStack Query 5, Cytoscape.js 3.29      | ESLint (flat), Biome, Playwright |
| API        | Pothos GraphQL, Apollo 4, Zod 3, CQRS                         | Jest 32, Supertest           |
| DB         | Prisma 6 migrations                                           | Prisma Studio                |
| Infra      | Terraform 1.9, Dockerfile + Compose                           | Trivy, Hadolint              |

* **Pre-commit:** `lint-staged` → ESLint + Biome  
* **Conventional Commits** → semantic-release versioning  
* **CI:** Node 20 & 22 matrix · Buildx multi-arch · SBOM & provenance signing  

---

## 11 · Observability (opt-in)

`docker compose --profile observability` starts Prometheus 2.52, Grafana 11, Loki 3, Tempo 3.  
Ready-made dashboards and alerts are provided in **`/observability/`**.

---

## 12 · Glossary & Tagging

The embedded Architecture Glossary includes a status workflow (draft → approved → deprecated).  
UI autocompletes `#terms`, shows hover-card definitions, and the API supports bulk tagging and search.

---

## 13 · Languages

* **American English (en-us)** — default  
* **Brazilian Portuguese (pt-br)**  

---

## 13 · Back-up & DR

| Asset          | Frequency      | Tool                | Retention      |
|----------------|----------------|---------------------|----------------|
| MariaDB        | nightly delta  | `mariabackup`       | 30 days        |
| Neo4j          | weekly full    | `neo4j-admin backup`| 4 weeks        |
| Object storage | —              | Rclone to S3/MinIO  | immutability 14 days |

Runbooks are located in **`/doc/runbooks/`**.

---

## 14 · Glossary (excerpt)

| Term          | Definition                       |
|---------------|----------------------------------|
| **ADR**       | Architectural Decision Record    |
| **Glossary**  | Canonical company dictionary     |
| **Change Set**| Batch of graph edits             |
| **BFF**       | Backend-for-Frontend             |

---

## 15 · Coding and Documentation Standards

All code must be thoroughly commented in English (en-us). Any changes to the codebase should be documented in the `docs/CHANGELOG` file to ensure traceability and maintainability.

---

## attached files

- Relationship Between Components in MariaDB and Neo4j : components_Neo4j-between-MariaDB.mb