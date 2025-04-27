// Inicialização Neo4j para o Beaver

// Configuração de constraints para Component
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Component) REQUIRE c.valid_from IS NOT NULL;
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Component) REQUIRE c.valid_to IS NOT NULL;

// Configuração de constraints para ADR
CREATE CONSTRAINT IF NOT EXISTS FOR (a:ADR) REQUIRE a.id IS UNIQUE;

// Configuração de constraints para GlossaryTerm
CREATE CONSTRAINT IF NOT EXISTS FOR (g:GlossaryTerm) REQUIRE g.term IS UNIQUE;

// Configuração de constraints para Platform
CREATE CONSTRAINT IF NOT EXISTS FOR (p:Platform) REQUIRE p.id IS UNIQUE;

// Configuração de constraints para DataStore
CREATE CONSTRAINT IF NOT EXISTS FOR (d:DataStore) REQUIRE d.id IS UNIQUE;

// Configuração de constraints para SubComponent
CREATE CONSTRAINT IF NOT EXISTS FOR (s:SubComponent) REQUIRE s.id IS UNIQUE;

// Configuração de constraints para Data
CREATE CONSTRAINT IF NOT EXISTS FOR (d:Data) REQUIRE d.id IS UNIQUE;

// Criar alguns nós de exemplo para testar o esquema

// Components
CREATE (c1:Component {id: 1, name: 'Frontend', description: 'User interface component', valid_from: datetime('2025-01-01'), valid_to: datetime('2030-01-01')});
CREATE (c2:Component {id: 2, name: 'API', description: 'Backend API service', valid_from: datetime('2025-01-01'), valid_to: datetime('2030-01-01')});
CREATE (c3:Component {id: 3, name: 'Database', description: 'Data storage component', valid_from: datetime('2025-01-01'), valid_to: datetime('2030-01-01')});

// Platforms
CREATE (p1:Platform {id: 1, name: 'Docker Container', description: 'Containerized environment'});
CREATE (p2:Platform {id: 2, name: 'Kubernetes', description: 'Container orchestration platform'});

// DataStores
CREATE (d1:DataStore {id: 1, name: 'MariaDB', description: 'Relational database'});
CREATE (d2:DataStore {id: 2, name: 'Neo4j', description: 'Graph database'});

// SubComponents
CREATE (s1:SubComponent {id: 1, name: 'Authentication Module', description: 'User authentication component'});
CREATE (s2:SubComponent {id: 2, name: 'Graph Visualization', description: 'Cytoscape graph component'});

// Data
CREATE (dt1:Data {id: 1, name: 'User Data', description: 'Personal user information'});
CREATE (dt2:Data {id: 2, name: 'Architecture Data', description: 'System architecture data'});

// ADRs
CREATE (a1:ADR {id: 1, title: 'Use of Graph Database', decision: 'We decided to use Neo4j as our graph database solution', status: 'accepted'});
CREATE (a2:ADR {id: 2, title: 'Frontend Framework Choice', decision: 'We decided to use Next.js for the frontend', status: 'accepted'});

// GlossaryTerms
CREATE (g1:GlossaryTerm {term: 'ADR', definition: 'Architectural Decision Record'});
CREATE (g2:GlossaryTerm {term: 'Component', definition: 'A discrete functional part of the system architecture'});

// Relacionamentos
// DEPENDS_ON
MATCH (a:Component), (b:Component) WHERE a.id = 1 AND b.id = 2
CREATE (a)-[:DEPENDS_ON]->(b);

MATCH (a:Component), (b:Component) WHERE a.id = 2 AND b.id = 3
CREATE (a)-[:DEPENDS_ON]->(b);

// CONNECTS_TO
MATCH (a:Component), (b:Component) WHERE a.id = 1 AND b.id = 2
CREATE (a)-[:CONNECTS_TO]->(b);

// RUNS_ON
MATCH (a:Component), (b:Platform) WHERE a.id = 1 AND b.id = 1
CREATE (a)-[:RUNS_ON]->(b);

MATCH (a:Component), (b:Platform) WHERE a.id = 2 AND b.id = 1
CREATE (a)-[:RUNS_ON]->(b);

MATCH (a:Component), (b:Platform) WHERE a.id = 3 AND b.id = 1
CREATE (a)-[:RUNS_ON]->(b);

// STORES_DATA_IN
MATCH (a:Component), (b:DataStore) WHERE a.id = 3 AND b.id = 1
CREATE (a)-[:STORES_DATA_IN]->(b);

// CONTAINS
MATCH (a:Component), (b:SubComponent) WHERE a.id = 1 AND b.id = 2
CREATE (a)-[:CONTAINS]->(b);

MATCH (a:Component), (b:SubComponent) WHERE a.id = 2 AND b.id = 1
CREATE (a)-[:CONTAINS]->(b);

// PROTECTS
MATCH (a:Component), (b:Data) WHERE a.id = 2 AND b.id = 1
CREATE (a)-[:PROTECTS]->(b);

// HAS_DECISION
MATCH (a:Component), (b:ADR) WHERE a.id = 3 AND b.id = 1
CREATE (a)-[:HAS_DECISION]->(b);

MATCH (a:Component), (b:ADR) WHERE a.id = 1 AND b.id = 2
CREATE (a)-[:HAS_DECISION]->(b); 