# Guia de Implementação Frontend - Beaver v2.0

## Visão Geral das Mudanças

A versão 2.0 do Beaver introduz diversas melhorias e novas funcionalidades que impactam significativamente o frontend da aplicação. Este documento orienta desenvolvedores na implementação dessas alterações, destacando pontos críticos e fornecendo recomendações práticas.

## Principais Alterações e Impactos

### 1. Novas Entidades e Relacionamentos

- **Instâncias de Componentes**: Interface para gerenciar instâncias específicas de componentes em diferentes ambientes
- **Times**: Visualização e gerenciamento de times responsáveis por componentes
- **Ambientes**: Seleção e filtro por ambientes ao invés do enum fixo anterior
- **Participantes de ADRs**: Substituição do owner único por múltiplos participantes com diferentes papéis
- **TRM (Technical Reference Model)**: Interface hierárquica para navegação em camadas e categorias

### 2. Impacto nos Componentes React

- **Formulários**: Atualização em formulários para Components, ADRs e RoadmapItems
- **Selects**: Substituição de selects hardcoded por consultas dinâmicas a tabelas
- **Visualização de Grafo**: Novos filtros e visualização de instâncias específicas
- **Sidebar**: Adição de novas seções para Times, Ambientes e TRM
- **Sistema de Mensagens**: Implementação de UI padronizada para mensagens de erro e logs

## Guia de Implementação Detalhado

### 1. Atualizações no Esquema GraphQL

Primeiro, é necessário atualizar as definições de tipos no cliente GraphQL para refletir as mudanças no backend:

```typescript
// Exemplos de tipos GraphQL atualizados

// src/types/graphql.ts
export type Environment = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
};

export type Team = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  members?: TeamMember[] | null;
};

export type TeamMember = {
  id: string;
  user: User;
  joinDate: string;
};

export type ComponentInstance = {
  id: string;
  component: Component;
  environment: Environment;
  hostname?: string | null;
  specs?: any | null;
  createdAt: string;
};

export type ADRParticipant = {
  id: string;
  user: User;
  role: 'owner' | 'reviewer' | 'consumer';
};

// Tipos atualizados
export type Component = {
  id: string;
  name: string;
  description?: string | null;
  status: 'planned' | 'active' | 'deprecated';
  // Remover env
  team?: Team | null;
  category?: Category | null;
  instances?: ComponentInstance[] | null;
  createdAt: string;
};

export type ADR = {
  id: string;
  title: string;
  description?: string | null;
  status: 'draft' | 'accepted' | 'superseded' | 'rejected';
  // Remover owner
  participants?: ADRParticipant[] | null;
  createdAt: string;
};
```

### 2. Queries e Mutations Atualizadas

Atualize as consultas GraphQL para trabalhar com as novas entidades:

```typescript
// src/graphql/environmentQueries.ts
import { gql } from '@apollo/client';

export const GET_ENVIRONMENTS = gql`
  query GetEnvironments {
    environments {
      id
      name
      description
      createdAt
    }
  }
`;

export const GET_ENVIRONMENT = gql`
  query GetEnvironment($id: Int!) {
    environment(id: $id) {
      id
      name
      description
      createdAt
      instances {
        id
        hostname
        specs
        component {
          id
          name
        }
      }
    }
  }
`;

// src/graphql/teamQueries.ts
export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      id
      name
      description
      createdAt
    }
  }
`;

// src/graphql/componentQueries.ts (atualizar)
export const GET_COMPONENT = gql`
  query GetComponent($id: Int!) {
    component(id: $id) {
      id
      name
      description
      status
      team {
        id
        name
      }
      category {
        id
        name
      }
      instances {
        id
        hostname
        environment {
          id
          name
        }
        specs
      }
      createdAt
    }
  }
`;

// src/graphql/adrQueries.ts (atualizar)
export const GET_ADR = gql`
  query GetADR($id: Int!) {
    adr(id: $id) {
      id
      title
      description
      status
      participants {
        id
        role
        user {
          id
          fullName
          email
        }
      }
      createdAt
    }
  }
`;
```

### 3. Atualizações de Mutations:

```typescript
// src/graphql/componentMutations.ts (atualizar)
export const CREATE_COMPONENT = gql`
  mutation CreateComponent(
    $name: String!,
    $description: String,
    $status: Status,
    $teamId: Int,
    $categoryId: Int
  ) {
    createComponent(
      name: $name,
      description: $description,
      status: $status,
      teamId: $teamId,
      categoryId: $categoryId
    ) {
      id
      name
      status
      team {
        id
        name
      }
    }
  }
`;

// src/graphql/instanceMutations.ts (novo)
export const CREATE_COMPONENT_INSTANCE = gql`
  mutation CreateComponentInstance(
    $componentId: Int!,
    $environmentId: Int!,
    $hostname: String,
    $specs: JSON
  ) {
    createComponentInstance(
      componentId: $componentId,
      environmentId: $environmentId,
      hostname: $hostname,
      specs: $specs
    ) {
      id
      hostname
      environment {
        id
        name
      }
    }
  }
`;

// src/graphql/adrMutations.ts (atualizar)
export const CREATE_ADR = gql`
  mutation CreateADR(
    $title: String!,
    $description: String,
    $status: ADRStatus,
    $participants: [ParticipantInput!]!,
    $componentsIds: [Int!],
    $instancesIds: [Int!]
  ) {
    createADR(
      title: $title,
      description: $description,
      status: $status,
      participants: $participants,
      componentsIds: $componentsIds,
      instancesIds: $instancesIds
    ) {
      id
      title
      status
    }
  }
`;
```

### 4. Componentes de UI Atualizados

#### 4.1 Seletores Dinâmicos

Substitua os seletores baseados em enum por componentes que consultam dados dinâmicos:

```tsx
// src/components/EnvironmentSelector.tsx
import { useQuery } from '@apollo/client';
import { GET_ENVIRONMENTS } from '../graphql/environmentQueries';
import { Select } from './ui/select';

interface EnvironmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function EnvironmentSelector({ value, onChange, disabled }: EnvironmentSelectorProps) {
  const { data, loading } = useQuery(GET_ENVIRONMENTS);
  
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled || loading}
    >
      <Select.Trigger className="w-full">
        <Select.Value placeholder="Selecione um ambiente" />
      </Select.Trigger>
      <Select.Content>
        {data?.environments.map((env) => (
          <Select.Item key={env.id} value={env.id}>
            {env.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}

// Implemente componentes similares para TeamSelector, RoadmapTypeSelector, etc.
```

#### 4.2 Formulário de ADR Atualizado

```tsx
// src/app/adrs/adr-form.tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { CREATE_ADR, UPDATE_ADR } from '../graphql/adrMutations';
import { GET_USERS } from '../graphql/userQueries';
import { ParticipantsSelector } from '../components/ParticipantsSelector';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../components/ui/use-toast';

export function ADRForm({ adr, onSuccess }) {
  const [title, setTitle] = useState(adr?.title || '');
  const [description, setDescription] = useState(adr?.description || '');
  const [status, setStatus] = useState(adr?.status || 'draft');
  const [participants, setParticipants] = useState(adr?.participants || []);
  const [componentsIds, setComponentsIds] = useState([]);
  const [instancesIds, setInstancesIds] = useState([]);
  
  const { data: usersData } = useQuery(GET_USERS);
  const { toast } = useToast();
  
  const [createADR, { loading: createLoading }] = useMutation(CREATE_ADR);
  const [updateADR, { loading: updateLoading }] = useMutation(UPDATE_ADR);
  
  const isLoading = createLoading || updateLoading;
  
  // Validação de pelo menos um owner entre os participantes
  const hasOwner = participants.some(p => p.role === 'owner');
  const isValid = title.trim() !== '' && hasOwner;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "O título é obrigatório e deve haver pelo menos um owner",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const variables = {
        title,
        description,
        status,
        participants,
        componentsIds,
        instancesIds
      };
      
      if (adr) {
        await updateADR({
          variables: {
            id: adr.id,
            ...variables
          }
        });
      } else {
        await createADR({
          variables
        });
      }
      
      toast({
        title: adr ? "ADR atualizado" : "ADR criado",
        description: "Operação realizada com sucesso"
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Título</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do ADR"
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Descrição</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição detalhada da decisão"
          rows={5}
          disabled={isLoading}
        />
      </div>
      
      {/* Novo componente para seleção de participantes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Participantes</label>
        <ParticipantsSelector
          users={usersData?.users || []}
          value={participants}
          onChange={setParticipants}
          disabled={isLoading}
        />
        {!hasOwner && (
          <p className="text-sm text-red-500">É necessário pelo menos um owner</p>
        )}
      </div>
      
      {/* Outros campos (componentes, instâncias, etc.) */}
      
      <Button type="submit" disabled={!isValid || isLoading}>
        {adr ? "Atualizar ADR" : "Criar ADR"}
      </Button>
    </form>
  );
}
```

#### 4.3 Novo Componente de Seleção de Participantes

```tsx
// src/components/ParticipantsSelector.tsx
import { useState } from 'react';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { PlusIcon, MinusIcon } from 'lucide-react';

const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'reviewer', label: 'Revisor' },
  { value: 'consumer', label: 'Consumidor' }
];

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Participant {
  userId: string;
  role: string;
}

interface ParticipantsSelectorProps {
  users: User[];
  value: Participant[];
  onChange: (participants: Participant[]) => void;
  disabled?: boolean;
}

export function ParticipantsSelector({ 
  users, 
  value, 
  onChange, 
  disabled 
}: ParticipantsSelectorProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('owner');
  
  // Usuários que já são participantes
  const usedUserIds = value.map(p => p.userId);
  
  // Usuários disponíveis para seleção
  const availableUsers = users.filter(user => !usedUserIds.includes(user.id));
  
  const addParticipant = () => {
    if (!selectedUser) return;
    
    onChange([
      ...value,
      { userId: selectedUser, role: selectedRole }
    ]);
    
    setSelectedUser('');
  };
  
  const removeParticipant = (userId: string) => {
    onChange(value.filter(p => p.userId !== userId));
  };
  
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.fullName : 'Usuário desconhecido';
  };
  
  const getRoleLabel = (role: string) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select
          value={selectedUser}
          onValueChange={setSelectedUser}
          disabled={disabled || availableUsers.length === 0}
          className="flex-1"
        >
          <Select.Trigger>
            <Select.Value placeholder="Selecione um usuário" />
          </Select.Trigger>
          <Select.Content>
            {availableUsers.map((user) => (
              <Select.Item key={user.id} value={user.id}>
                {user.fullName}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        
        <Select
          value={selectedRole}
          onValueChange={setSelectedRole}
          disabled={disabled}
        >
          <Select.Trigger className="w-[150px]">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {ROLES.map((role) => (
              <Select.Item key={role.value} value={role.value}>
                {role.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={addParticipant}
          disabled={disabled || !selectedUser}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {value.length > 0 && (
        <div className="grid gap-2">
          {value.map((participant) => (
            <Card key={participant.userId} className="overflow-hidden">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{getUserName(participant.userId)}</span>
                  <Badge 
                    variant={participant.role === 'owner' ? 'default' : 'secondary'}
                  >
                    {getRoleLabel(participant.role)}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeParticipant(participant.userId)}
                  disabled={disabled}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

## Checklist de Implantação Frontend

A seguir está um checklist detalhado para orientar a implantação das alterações no frontend da versão 2.0 do Beaver:

### 1. Preparação do Ambiente

- [x] Atualizar dependências do Next.js para versão 14.1.x
- [x] Atualizar dependências do React para versão 18.2.x
- [x] Atualizar TailwindCSS para versão 3.4.x
- [x] Atualizar Apollo Client para a versão 3.13.x
- [x] Confirmar compatibilidade com TanStack Query (React Query)
- [x] Verificar compatibilidade com Cytoscape.js 3.29.x

### 2. Atualização de Tipos e Schemas

- [x] Atualizar definições de tipos em `src/types/graphql.ts`
- [x] Implementar novos tipos (Environment, Team, TeamMember, ComponentInstance, ADRParticipant)
- [x] Atualizar tipos existentes para refletir novas relações (Component, ADR)
- [x] Verificar tipagem dos hooks personalizados que utilizam esses tipos

### 3. Atualização de Queries e Mutations

- [x] Implementar novas queries para ambientes (`src/graphql/environmentQueries.ts`)
- [x] Implementar novas queries para times (`src/graphql/teamQueries.ts`)
- [x] Atualizar queries de componentes para incluir novas relações
- [x] Atualizar queries de ADRs para trabalhar com participantes
- [x] Implementar novas mutations para ambientes
- [x] Implementar novas mutations para times e membros
- [x] Implementar mutations para instâncias de componentes
- [x] Atualizar mutations de ADRs para trabalhar com participantes
- [x] Testar todas as queries e mutations no Apollo Sandbox

### 4. Componentes de UI

- [ ] Implementar seletores dinâmicos para entidades (EnvironmentSelector, TeamSelector)
- [ ] Atualizar formulários para usar novos seletores e campos
- [ ] Atualizar componente de formulário ADR para trabalhar com múltiplos participantes
- [ ] Desenvolver componente ParticipantsSelector
- [ ] Implementar visualização hierárquica para TRM
- [ ] Atualizar componentes de visualização de grafo para incluir instâncias
- [ ] Implementar sistema padronizado de mensagens de erro
- [ ] Atualizar o sidebar para incluir novas seções

### 5. Páginas e Rotas

- [ ] Criar páginas para gerenciamento de ambientes
- [ ] Criar páginas para gerenciamento de times
- [ ] Criar visualização de TRM (camadas e categorias)
- [ ] Atualizar páginas de componentes para mostrar instâncias
- [ ] Atualizar páginas de ADRs para mostrar participantes
- [ ] Implementar visualização filtrada do grafo por ambiente/time

### 6. Testes

- [ ] Atualizar testes unitários para refletir as mudanças nos componentes
- [ ] Implementar testes de integração para novas funcionalidades
- [ ] Verificar acessibilidade em todos os novos componentes de UI
- [ ] Realizar testes de responsividade
- [ ] Testar fluxos de usuário completos para cada nova funcionalidade

### 7. Otimização

- [ ] Implementar carregamento otimizado de dados (paginação, lazy loading)
- [ ] Otimizar consultas GraphQL para evitar over-fetching
- [ ] Aplicar estratégias de cache para queries frequentes
- [ ] Implementar feedback visual para operações de longa duração
- [ ] Otimizar renderização de componentes complexos (memoização)

### 8. Compatibilidade

- [ ] Verificar compatibilidade com navegadores alvo
- [ ] Implementar fallbacks para recursos não suportados
- [ ] Testar em diferentes dispositivos e tamanhos de tela
- [ ] Garantir compatibilidade com temas claro e escuro

### 9. Documentação

- [ ] Documentar novas APIs de componentes
- [ ] Atualizar documentação de uso para desenvolvedores
- [ ] Criar exemplos de uso para novos componentes e padrões
- [ ] Documentar estratégias de migração para código existente

### 10. Implantação Final

- [ ] Realizar build de produção e verificar otimizações
- [ ] Verificar logs e erros no console
- [ ] Realizar implantação em ambiente de staging
- [ ] Validar todas as funcionalidades no ambiente de staging
- [ ] Planejar estratégia de rollout gradual
- [ ] Preparar rollback caso necessário
- [ ] Implantar em produção
``` 