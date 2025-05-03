/**
 * Tipos GraphQL para o Beaver v2.0
 * 
 * Este arquivo contém as definições de tipos TypeScript para 
 * as entidades e operações GraphQL na versão 2.0 da plataforma.
 */

// ===== TIPOS BÁSICOS =====

export type Maybe<T> = T | null;

export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: string;
  JSON: any;
};

// ===== ENUMS =====

export type ComponentStatus = 'planned' | 'active' | 'deprecated';

export type ADRStatus = 'draft' | 'accepted' | 'superseded' | 'rejected';

export type RoadmapStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type ParticipantRole = 'owner' | 'reviewer' | 'consumer';

export type ImpactLevel = 'low' | 'medium' | 'high';

export type LogLevel = 'info' | 'warn' | 'error';

export type GlossaryStatus = 'draft' | 'approved' | 'deprecated';

// ===== ENTIDADES PRINCIPAIS =====

export type User = {
  id: Scalars['ID'];
  username: Scalars['String'];
  email: Scalars['String'];
  fullName: Scalars['String'];
  role: Scalars['String'];
  createdAt: Scalars['DateTime'];
};

/**
 * Equipes organizacionais responsáveis por componentes
 * 
 * @see Tabela `Team` no MariaDB
 */
export type Team = {
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  members?: Maybe<TeamMember[]>;
  components?: Maybe<Component[]>;
};

/**
 * Associação entre usuários e times, com data de ingresso
 * 
 * @see Tabela `Team_Member` no MariaDB
 */
export type TeamMember = {
  id: Scalars['ID'];
  team: Team;
  user: User;
  joinDate: Scalars['DateTime'];
  createdAt: Scalars['DateTime'];
};

/**
 * Ambientes onde componentes são implantados
 * 
 * @see Tabela `Environment` no MariaDB
 */
export type Environment = {
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  instances?: Maybe<ComponentInstance[]>;
};

export type Category = {
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  image?: Maybe<Scalars['String']>;
  parentId?: Maybe<Scalars['ID']>;
  parent?: Maybe<Category>;
  children?: Maybe<Category[]>;
  createdAt: Scalars['DateTime'];
  components?: Maybe<Component[]>;
};

/**
 * Componente lógico da arquitetura
 * Representa um serviço, aplicação ou recurso que pode ter múltiplas instâncias
 * 
 * @see Tabela `Component` no MariaDB
 * @see Nós `:Component` no Neo4j
 */
export type Component = {
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  status: ComponentStatus;
  team?: Maybe<Team>;
  category?: Maybe<Category>;
  instances?: Maybe<ComponentInstance[]>;
  tags?: Maybe<ComponentTag[]>;
  createdAt: Scalars['DateTime'];
  relationships?: Maybe<Relationship[]>;
  adrs?: Maybe<ADR[]>;
  roadmapItems?: Maybe<RoadmapItem[]>;
  
  // Novas relações v2.0
  teamManagers?: Maybe<User[]>;
  totalInstances?: Maybe<Scalars['Int']>;
  instancesByEnvironment?: Maybe<{ [environmentId: string]: Scalars['Int'] }>;
  relatedComponents?: Maybe<Component[]>;
  referencedGlossaryTerms?: Maybe<GlossaryTerm[]>;
  lastUpdatedAt?: Maybe<Scalars['DateTime']>;
  lastUpdatedBy?: Maybe<User>;
  validFrom?: Maybe<Scalars['DateTime']>;
  validTo?: Maybe<Scalars['DateTime']>;
};

/**
 * Instâncias de componentes em ambientes específicos
 * Cada componente pode ter múltiplas instâncias em diferentes ambientes
 * 
 * @see Tabela `Component_Instance` no MariaDB
 * @see Nós `instance` no Neo4j
 */
export type ComponentInstance = {
  id: Scalars['ID'];
  component: Component;
  environment: Environment;
  hostname?: Maybe<Scalars['String']>;
  specs?: Maybe<Scalars['JSON']>;
  createdAt: Scalars['DateTime'];
  affectedByADRs?: Maybe<ADRComponentInstance[]>;
  instanceRelationships?: Maybe<Relationship[]>;
  status?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
  lastUpdated?: Maybe<Scalars['DateTime']>;
  healthScore?: Maybe<Scalars['Float']>;
};

/**
 * Registro de Decisão Arquitetural (ADR)
 * Documenta decisões importantes relacionadas à arquitetura
 * Na v2.0 suporta múltiplos participantes e impacto em instâncias específicas
 * 
 * @see Tabela `ADR` no MariaDB
 * @see Nós `:ADR` no Neo4j com relações `HAS_DECISION` e `PARTICIPATES_IN`
 */
export type ADR = {
  id: Scalars['ID'];
  title: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  status: ADRStatus;
  participants?: Maybe<ADRParticipant[]>;
  components?: Maybe<Component[]>;
  componentInstances?: Maybe<ADRComponentInstance[]>;
  tags?: Maybe<ADRTag[]>;
  createdAt: Scalars['DateTime'];
  
  // Novas relações v2.0
  owners: ADRParticipant[];
  reviewers?: Maybe<ADRParticipant[]>;
  consumers?: Maybe<ADRParticipant[]>;
  approvedByAll: Scalars['Boolean'];
  referencedGlossaryTerms?: Maybe<GlossaryTerm[]>;
  relatedADRs?: Maybe<ADR[]>;
  lastUpdatedAt?: Maybe<Scalars['DateTime']>;
  supersededBy?: Maybe<ADR>;
  supersedes?: Maybe<ADR>;
  affectedEnvironments?: Maybe<Environment[]>;
  totalImpactScore?: Maybe<Scalars['Float']>;
};

/**
 * Associação entre usuários e ADRs, definindo o papel do usuário na decisão
 * 
 * @see Tabela `ADR_Participant` no MariaDB
 * @see Relacionamentos `PARTICIPATES_IN` no Neo4j
 */
export type ADRParticipant = {
  id: Scalars['ID'];
  adr: ADR;
  user: User;
  role: ParticipantRole;
  createdAt: Scalars['DateTime'];
  comments?: Maybe<Scalars['String']>;
  approved: Scalars['Boolean'];
  approvalDate?: Maybe<Scalars['DateTime']>;
};

export type ADRComponentInstance = {
  adr: ADR;
  instance: ComponentInstance;
  impactLevel: ImpactLevel;
};

export type Relationship = {
  id: Scalars['ID'];
  source: Component;
  target: Component;
  sourceInstance?: Maybe<ComponentInstance>;
  targetInstance?: Maybe<ComponentInstance>;
  type: Scalars['String'];
  tags?: Maybe<RelationshipTag[]>;
  description?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
};

export type GlossaryTerm = {
  id: Scalars['ID'];
  term: Scalars['String'];
  definition: Scalars['String'];
  status: GlossaryStatus;
  createdAt: Scalars['DateTime'];
};

export type RoadmapType = {
  id: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  colorHex: Scalars['String'];
  createdAt: Scalars['DateTime'];
  items?: Maybe<RoadmapItem[]>;
};

export type RoadmapItem = {
  id: Scalars['ID'];
  title: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  component?: Maybe<Component>;
  type: RoadmapType;
  status: RoadmapStatus;
  dueDate?: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
};

// ===== ENTIDADES DE TAGGING =====

export type ComponentTag = {
  id: Scalars['ID'];
  component: Component;
  tag: Scalars['String'];
};

export type RelationshipTag = {
  id: Scalars['ID'];
  source: Component;
  target: Component;
  tag: Scalars['String'];
};

export type ADRTag = {
  id: Scalars['ID'];
  adr: ADR;
  tag: Scalars['String'];
};

// ===== INPUTS =====

export type EnvironmentInput = {
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
};

export type TeamInput = {
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  members?: Maybe<TeamMemberInput[]>;
};

export type TeamMemberInput = {
  userId: Scalars['ID'];
  joinDate?: Maybe<Scalars['DateTime']>;
};

export type ComponentInput = {
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  status?: Maybe<ComponentStatus>;
  teamId?: Maybe<Scalars['ID']>;
  categoryId?: Maybe<Scalars['ID']>;
  tags?: Maybe<Scalars['String'][]>;
  referencedTerms?: Maybe<Scalars['String'][]>;
  validFrom?: Maybe<Scalars['DateTime']>;
  validTo?: Maybe<Scalars['DateTime']>;
};

export type ComponentInstanceInput = {
  componentId: Scalars['ID'];
  environmentId: Scalars['ID'];
  hostname?: Maybe<Scalars['String']>;
  specs?: Maybe<Scalars['JSON']>;
  status?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
  healthScore?: Maybe<Scalars['Float']>;
};

export type ParticipantInput = {
  userId: Scalars['ID'];
  role: ParticipantRole;
  comments?: Maybe<Scalars['String']>;
  approved?: Maybe<Scalars['Boolean']>;
};

export type ADRInput = {
  title: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  status?: Maybe<ADRStatus>;
  participants: ParticipantInput[];
  componentsIds?: Maybe<Scalars['ID'][]>;
  instancesIds?: Maybe<Scalars['ID'][]>;
  tags?: Maybe<Scalars['String'][]>;
  referencedTerms?: Maybe<Scalars['String'][]>;
  relatedADRsIds?: Maybe<Scalars['ID'][]>;
  supersededById?: Maybe<Scalars['ID']>;
  supersedesId?: Maybe<Scalars['ID']>;
  environmentsImpact?: Maybe<Array<{
    environmentId: Scalars['ID'];
    impactLevel?: Maybe<ImpactLevel>;
  }>>;
};

export type RelationshipInput = {
  sourceId: Scalars['ID'];
  targetId: Scalars['ID'];
  sourceInstanceId?: Maybe<Scalars['ID']>;
  targetInstanceId?: Maybe<Scalars['ID']>;
  type: Scalars['String'];
  description?: Maybe<Scalars['String']>;
};

export type RoadmapItemInput = {
  title: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  componentId?: Maybe<Scalars['ID']>;
  typeId: Scalars['ID'];
  status?: Maybe<RoadmapStatus>;
  dueDate?: Maybe<Scalars['DateTime']>;
};

// ===== FILTROS =====

export type TeamFilter = {
  search?: Maybe<Scalars['String']>;
  memberId?: Maybe<Scalars['ID']>;
};

export type EnvironmentFilter = {
  search?: Maybe<Scalars['String']>;
  instanceId?: Maybe<Scalars['ID']>;
};

export type ComponentFilter = {
  search?: Maybe<Scalars['String']>;
  status?: Maybe<ComponentStatus>;
  teamId?: Maybe<Scalars['ID']>;
  categoryId?: Maybe<Scalars['ID']>;
  environmentId?: Maybe<Scalars['ID']>;
  tags?: Maybe<Scalars['String'][]>;
};

export type ADRFilter = {
  search?: Maybe<Scalars['String']>;
  status?: Maybe<ADRStatus>;
  participantId?: Maybe<Scalars['ID']>;
  participantRole?: Maybe<ParticipantRole>;
  componentId?: Maybe<Scalars['ID']>;
  instanceId?: Maybe<Scalars['ID']>;
  environmentId?: Maybe<Scalars['ID']>;
  teamId?: Maybe<Scalars['ID']>;
  tags?: Maybe<Scalars['String'][]>;
  glossaryTerms?: Maybe<Scalars['String'][]>;
  createdAfter?: Maybe<Scalars['DateTime']>;
  createdBefore?: Maybe<Scalars['DateTime']>;
};

export type RoadmapFilter = {
  search?: Maybe<Scalars['String']>;
  status?: Maybe<RoadmapStatus>;
  typeId?: Maybe<Scalars['ID']>;
  componentId?: Maybe<Scalars['ID']>;
  dueDateFrom?: Maybe<Scalars['DateTime']>;
  dueDateTo?: Maybe<Scalars['DateTime']>;
};

// ===== PAGINAÇÃO =====

export type PaginationInput = {
  page?: Maybe<Scalars['Int']>;
  pageSize?: Maybe<Scalars['Int']>;
  sortField?: Maybe<Scalars['String']>;
  sortOrder?: Maybe<Scalars['String']>;
};

export type PageInfo = {
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  totalPages: Scalars['Int'];
  totalItems: Scalars['Int'];
  currentPage: Scalars['Int'];
};

// ===== RESPOSTAS PAGINADAS =====

export type TeamsResponse = {
  items: Team[];
  pageInfo: PageInfo;
};

export type EnvironmentsResponse = {
  items: Environment[];
  pageInfo: PageInfo;
};

export type ComponentInstancesResponse = {
  items: ComponentInstance[];
  pageInfo: PageInfo;
};

export type ComponentsResponse = {
  items: Component[];
  pageInfo: PageInfo;
};

export type ADRsResponse = {
  items: ADR[];
  pageInfo: PageInfo;
};

export type RoadmapItemsResponse = {
  items: RoadmapItem[];
  pageInfo: PageInfo;
};

// ===== MENSAGENS DE ERRO =====

export type ErrorResponse = {
  code: Scalars['String'];
  message: Scalars['String'];
  details?: Maybe<Scalars['String']>;
};
