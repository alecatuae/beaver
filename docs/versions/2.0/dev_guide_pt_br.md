# Guia de Desenvolvimento - Beaver

## Introdução
Este guia fornece instruções detalhadas sobre como desenvolver e manter a aplicação Beaver. É baseado na arquitetura e padrões descritos no documento `Architecture_pt_br.md` e no guia de estilo `ui_ux_style_guide_pt_br.md`.

## Pré-requisitos
- Familiaridade com React, Next.js e Node.js.
- Entendimento de GraphQL, Pothos e Neo4j.
- Conhecimento básico de Docker e contêinerização.
- Compreensão dos padrões de design descritos no guia de estilo UI/UX.

## Configuração do Ambiente de Desenvolvimento
1. **Clone o Repositório**
   ```bash
   git clone <repository-url>
   cd beaver
   ```

2. **Instale as Dependências**
   Certifique-se de ter Node.js 20+ (frontend), Node.js 22 LTS (API) e Docker instalados. Em seguida, execute:
   ```bash
   # Para o frontend
   npm install
   
   # Para a API
   cd api && npm install && cd ..
   
   # Iniciar os contêineres
   docker-compose --profile base up -d
   ```

3. **Configuração do Ambiente**
   Copie o arquivo de ambiente de exemplo e gere as chaves JWT:
   ```bash
   cp .env.example .env
   ./scripts/gen-jwt.sh
   ```

## Fluxo de Desenvolvimento

### 1. Desenvolvimento do Front-end
- **Tecnologias Principais**:
  - Next.js 14+ para o framework
  - TypeScript 5+ para tipagem estática
  - TanStack Query para gerenciamento de estado e cache
  - Axios para requisições HTTP
  - Tailwind CSS para estilização

- **Práticas de Desenvolvimento**:
  - Implementar interfaces TypeScript para todas as respostas da API
  - Usar TanStack Query para cache e gerenciamento de estado
  - Seguir padrões de acessibilidade WCAG 2.1
  - Implementar testes unitários e de integração
  - Usar componentes reutilizáveis

- **Estrutura de Diretórios**:
  ```
  frontend/src/
  ├── app/                # Rotas e páginas
  ├── components/         # Componentes reutilizáveis
  ├── hooks/             # Hooks personalizados
  ├── lib/               # Utilitários e configurações
  │   ├── api/           # Cliente HTTP e endpoints
  │   └── types/         # Interfaces TypeScript
  └── styles/            # Estilos globais
  ```

- **Exemplo de Integração com API**:
  ```typescript
  // lib/api/components.ts
  import axios from 'axios';
  import { useQuery } from '@tanstack/react-query';

  interface Component {
    id: string;
    name: string;
    status: string;
    team: {
      id: string;
      name: string;
    };
  }

  interface ComponentsResponse {
    items: Component[];
    pageInfo: {
      currentPage: number;
      pageSize: number;
      totalItems: number;
    };
  }

  export const getComponents = async (params: {
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ComponentsResponse> => {
    const { data } = await axios.get('/api/v2/components', { params });
    return data;
  };

  // hooks/useComponents.ts
  export const useComponents = (params: {
    status?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return useQuery({
      queryKey: ['components', params],
      queryFn: () => getComponents(params)
    });
  };

  // app/components/page.tsx
  export default function ComponentsPage() {
    const { data, isLoading, error } = useComponents({
      page: 1,
      pageSize: 20
    });

    if (isLoading) return <div>Carregando...</div>;
    if (error) return <div>Erro ao carregar componentes</div>;

    return (
      <div>
        {data.items.map(component => (
          <div key={component.id}>
            <h2>{component.name}</h2>
            <p>Status: {component.status}</p>
            <p>Time: {component.team.name}</p>
          </div>
        ))}
      </div>
    );
  }
  ```

### 2. Desenvolvimento da API
- **Tecnologias Principais**:
  - Express.js para construção da API REST
  - Prisma para interações com o MariaDB
  - Neo4j-driver para interações com o banco de dados de grafos
  - JWT com assinatura RS256 para autenticação

- **Práticas de Desenvolvimento da API**:
  - Implementar validação com Zod para todas as entradas de dados
  - Seguir padrões RESTful para endpoints
  - Manter sincronização entre MariaDB e Neo4j para todas as entidades
  - Implementar tratamento adequado de erros com códigos padronizados
  - Documentar todos os endpoints REST com OpenAPI/Swagger

- **Estrutura de Diretórios da API**:
  ```
  api/src/
  ├── controllers/        # Controladores para cada recurso
  │   ├── ComponentController.ts
  │   ├── ADRController.ts
  │   ├── TeamController.ts
  │   └── ...
  ├── routes/             # Definições de rotas
  │   ├── components.ts
  │   ├── adrs.ts
  │   ├── teams.ts
  │   └── index.ts        # Exporta todas as rotas
  ├── middleware/         # Middlewares (auth, validação)
  │   ├── auth.ts
  │   └── validation.ts
  ├── services/           # Lógica de negócios
  │   ├── ComponentService.ts
  │   └── ...
  └── index.ts            # Ponto de entrada
  ```

- **Padrões REST**:
  - Usar verbos HTTP apropriados (GET, POST, PUT, DELETE)
  - Implementar paginação e filtros via query parameters
  - Retornar códigos HTTP apropriados
  - Usar versionamento de API (/api/v2/...)
  - Implementar cache via headers HTTP

- **Exemplo de Endpoint**:
  ```typescript
  // GET /api/v2/components
  router.get('/components', async (req, res) => {
    const { status, page = 1, pageSize = 20 } = req.query;
    const components = await prisma.component.findMany({
      where: { status },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { team: true }
    });
    res.json({
      items: components,
      pageInfo: {
        currentPage: page,
        pageSize,
        totalItems: await prisma.component.count({ where: { status } })
      }
    });
  });
  ```

### 3. Boas Práticas

#### Sistema de Mensagens de Erro
- Implementar o sistema padronizado de mensagens de erro conforme documentação:
  - Categorizar erros por tipo (validação, autenticação, comunicação, etc.)
  - Usar componentes visuais padronizados para cada tipo de erro
  - Seguir a estrutura de código de erro `ERR-XXXX-YY-ZZ`
  - Garantir mensagens claras e orientadas à solução

#### Logs para Desenvolvimento
- Implementar logging estruturado conforme especificação:
  - Utilizar níveis corretos (error, warn, info, debug, trace)
  - Incluir contexto suficiente em cada log para facilitar depuração
  - Nunca registrar dados sensíveis nos logs
  - Integrar com sistema de monitoramento em produção

#### Operações de Exclusão
- **Sempre** implementar um diálogo de confirmação para qualquer operação de exclusão:
  - Fornecer mensagem clara sobre a natureza permanente da ação
  - Oferecer opção de cancelamento facilmente acessível
  - Seguir design visual padronizado do guia de estilo
  - Implementar exclusão como operação assíncrona com feedback visual
  - Atualizar listagens automaticamente após conclusão da operação
  - Verificar dependências antes de permitir exclusões

### 4. Testes
- Jest e Supertest para testes unitários e de integração
- Playwright para testes end-to-end
- Implementar testes para todas as funcionalidades da plataforma:
  - Gerenciamento de instâncias de componentes
  - Sistema de participantes em ADRs
  - Integração com termos do glossário
  - Visualização e filtros TRM

### 5. Qualidade de Código e Padrões
- ESLint e Biome para qualidade de código
- TypeScript para tipagem estática
- Commitizen para mensagens de commit
- Semantic-release para versionamento
- Pre-commit hooks com lint-staged

### 6. Observabilidade e Monitoramento
- Opcional: Utilizar Prometheus, Grafana, Loki e Tempo para monitoramento e observabilidade
- Implementar métricas customizadas para funcionalidades críticas

### 7. Princípios de Engenharia

- **Use as melhores práticas**  
  Nunca aplique hacks ou correções temporárias.

- **Escreva código limpo e legível**  
  Favoreça a clareza em vez de complexidade desnecessária.

- **Mantenha a simplicidade**  
  Soluções simples são melhores que soluções complexas.

- **Seja consistente**  
  Siga os padrões e convenções do projeto.

- **Capture erros cedo**  
  Valide entradas, use tipagem forte e escreva testes automatizados.

- **Projete para escala e manutenção**  
  Planeje para crescimento e suporte de longo prazo desde o início.

- **Documente o que importa**  
  Explique decisões e lógica não trivial.

- **Automatize sempre que possível**  
  Automatize testes, implantações, verificações e monitoramento.

- **Construa com segurança desde o início**  
  Valide tudo, proteja dados e siga o princípio do menor privilégio.

- **Seja responsável pelo seu código**  
  Corrija bugs, melhore testes e dê suporte às suas releases.

## Implementação de Funcionalidades

### Gerenciamento de Instâncias de Componentes
- Implementar CRUD completo para `Component_Instance`
- Garantir sincronização entre MariaDB e Neo4j para instâncias
- Seguir o design de cards e formulários conforme guia de estilo
- Implementar filtros por ambiente e componente

### Sistema de Participantes em ADRs
- Implementar validação automática de pelo menos um owner por ADR
- Desenvolver interface para gerenciamento de múltiplos participantes
- Garantir que triggers de banco de dados funcionem corretamente

### Integração com Glossário
- Implementar detecção de "#termo" em campos de texto
- Desenvolver sistema de autocompletar para termos do glossário
- Criar componente de hover-card para exibir definições

### Visualização TRM
- Implementar filtros por níveis TRM na visualização do grafo
- Desenvolver navegação hierárquica para categorias no TRM
- Garantir código de cores consistente para cada nível TRM

## Implantação
- Docker Compose para orquestração de contêineres (perfis "base" e "observability")
- Utilize o script `scripts/update-app.sh` para facilitar a atualização e reinicialização dos contêineres

## Atualização e Manutenção
Para atualizar ou reiniciar contêineres, use o script `update-app.sh`:

```bash
# Atualizar frontend e backend
./scripts/update-app.sh

# Atualizar apenas o backend com reconstrução
./scripts/update-app.sh -b --build

# Apenas reiniciar o frontend
./scripts/update-app.sh -f --restart

# Ver todas as opções
./scripts/update-app.sh --help
```

## Manutenção do Sistema
1. Faça backup dos dados de produção regularmente
2. Execute scripts de migração do banco de dados quando necessário:
   ```bash
   docker compose exec api npx prisma migrate deploy
   ```
3. Execute scripts de manutenção do Neo4j quando necessário
4. Atualize os contêineres com:
   ```bash
   ./scripts/update-app.sh --build
   ```
5. Verifique a integridade dos dados após qualquer migração

## Guias de Referência Rápida

### Sistema de Mensagens de Erro

| Código | Descrição | Módulo |
|--------|-----------|--------|
| 1000-1999 | Autenticação e Autorização | Login, permissões |
| 2000-2999 | Gerenciamento de ADRs | Criação, edição, participantes |
| 3000-3999 | Análise de Impacto | Workflow, aprovações |
| 4000-4999 | Gerenciamento de Componentes | CRUD de componentes e instâncias |
| 5000-5999 | Gerenciamento de Relacionamentos | Conexões, validações |
| 6000-6999 | TRM e Categorias | Hierarquia, níveis |
| 7000-7999 | Glossário | Termos, referências |
| 8000-8999 | Sistema e Configuração | Settings, ambientes |
| 9000-9999 | Integração e Comunicação | API externa, notificações |

### Convenções de Estilo

| Elemento | Especificação | Exemplo |
|----------|---------------|---------|
| Cores primárias | #7839EE (roxo), variações | Botões de ação principal |
| Tipografia | Inter/Roboto/Poppins | Tamanho base 16px |
| Espaçamento | Grid de 8pt | Padding cards: 16px |
| Cards | Altura fixa 180px | Layout consistente |
| Modais | Cabeçalho, corpo, rodapé | Botões alinhados à direita |
| Formulários | Labels acima dos campos | Validação inline |
| Mensagens de erro | Cor, ícone e ação recomendada | "[Tipo]: [Mensagem] \| [Ação]" |

## Conclusão
Este guia fornece uma visão abrangente do processo de desenvolvimento para a aplicação Beaver. Para informações técnicas mais detalhadas, consulte o documento `Architecture_pt_br.md` e o guia de estilo `ui_ux_style_guide_pt_br.md`. 