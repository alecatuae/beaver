# Detalhes das Páginas - Beaver v2.0
*Última atualização → Junho 2024*

---

## Páginas Principais

### Visão Geral da Arquitetura
- **Descrição**: Esta página permite aos usuários visualizar e interagir com o grafo de arquitetura empresarial. Utiliza Cytoscape.js para renderizar nós e arestas, oferecendo layouts como cola (direcionado por força), concêntrico e em largura.

- **Funcionalidades**:
  - Visualização interativa de grafos.
  - Filtros nativos por ambiente, domínio, time e criticidade.
  - Suporte a consultas temporais via `valid_from` e `valid_to`.
  - **Novo na v2.0**: Filtro por instâncias específicas de componentes em diferentes ambientes.
  - **Novo na v2.0**: Visualização de relações entre times e componentes sob sua responsabilidade.
  - Zoom e navegação intuitiva com suporte a gestos em dispositivos móveis.
  - Exportação da visualização em formatos PNG e SVG para documentação.

### Gerenciamento de ADRs
- **Descrição**: Página dedicada ao gerenciamento de Registros de Decisão Arquitetural (ADRs).
- **Funcionalidades**:
  - Criação e edição de ADRs seguindo template padronizado.
  - Capacidades completas de diff e rollback.
  - Integração com fluxo de trabalho de impacto para comentários e merges.
  - **Novo na v2.0**: Sistema de participantes múltiplos com papéis definidos (owner, reviewer, consumer).
  - **Novo na v2.0**: Validação automática que garante pelo menos um participante com papel "owner" para cada ADR.
  - **Novo na v2.0**: Suporte à referência de termos do Glossário nos textos usando "#termo".
  - Renderização de markdown para formatação rica dos documentos.
  - Painel de detalhes com abas Affected & Timeline para visualizar artefatos impactados.

### Fluxo de Trabalho de Impacto
- **Descrição**: Facilita o fluxo de trabalho de impacto, permitindo aos arquitetos gerenciar mudanças.
- **Funcionalidades**:
  - Rascunho, diff visual, comentários e merge pelo papel de arquiteto.
  - **Novo na v2.0**: Análise de impacto em instâncias específicas de componentes.
  - **Novo na v2.0**: Cálculo e exibição do impacto por ambiente antes do merge.
  - Estados de workflow: Draft → Review (comments) → Accepted/Rejected → Merged.
  - Suporte a rollback automático para ADR anterior (status Superseded).
  - Trilha de auditoria detalhada para cada etapa do fluxo.

### Glossário
- **Descrição**: Fornece um dicionário incorporado com suporte a tags.
- **Funcionalidades**:
  - Autocompletar termos com `#tag` em todos os formulários relevantes.
  - Definições em hover-card ativadas ao passar o mouse sobre termos.
  - Suporte a tagging em massa e pesquisa via API.
  - **Novo na v2.0**: Status de termos do glossário (rascunho, aprovado, obsoleto).
  - **Novo na v2.0**: Realce visual de termos referenciados em textos de ADRs e documentação.
  - Interface de administração dedicada para aprovação e depreciação de termos.
  - Histórico de alterações com versionamento de definições.

---

## Páginas de Administração

### Gerenciamento de Usuários
- **Descrição**: Página de administração para gerenciar contas e papéis de usuários.
- **Funcionalidades**:
  - Operações CRUD para usuários.
  - Atribuição e gerenciamento de papéis (Admin, Architect, Contributor, Viewer).
  - **Novo na v2.0**: Associação de usuários a times organizacionais.
  - Gerenciamento de permissões detalhadas por recurso.
  - Log de atividades por usuário com filtros e exportação.
  - Suspensão temporária de contas e gerenciamento de acesso.

### Configurações do Sistema
- **Descrição**: Permite aos administradores configurar definições globais do sistema.
- **Funcionalidades**:
  - Configuração de definições da aplicação.
  - Configurações de monitoramento e logging.
  - **Novo na v2.0**: Gerenciamento de tipos de itens de roadmap e ambientes.
  - Controle de preferências de visualização do grafo (layout padrão, esquemas de cores).
  - Configurações de segurança (política de senhas, tempo de expiração de tokens).
  - Gestão de backup e retenção de dados.
  - Opções de integração com sistemas externos.

---

## Páginas de Autenticação

### Login
- **Descrição**: Página para autenticação de usuários.
- **Funcionalidades**:
  - Login seguro com autenticação JWT.
  - Opções de recuperação e redefinição de senha.
  - Proteção contra ataques de força bruta com rate limiting.
  - Suporte a autenticação de dois fatores (opcional).
  - Log de tentativas de login para auditoria de segurança.

### Registro
- **Descrição**: Permite que novos usuários registrem uma conta.
- **Funcionalidades**:
  - Formulário de registro de usuário com validações robustas.
  - Processo de verificação de e-mail.
  - Validação de força de senha.
  - Aceitação de termos de uso e políticas de privacidade.
  - Opção de integração com provedores de identidade corporativos (opcional).

---

## Operações CRUD

### Gerenciamento de Componentes
- **Descrição**: Página para gerenciar componentes de software.
- **Funcionalidades**:
  - Operações CRUD para componentes.
  - Associação de componentes com ADRs e outras entidades.
  - **Novo na v2.0**: Associação de componentes a times responsáveis.
  - Formulário interativo com validações de campo:
    - Campos obrigatórios de nome e descrição
    - Campo de descrição limitado a 256 caracteres com contador visual
    - Gerenciamento dinâmico de tags com capacidades de adicionar/remover
    - Seleção de status ('planned', 'active', 'deprecated')
    - **Novo na v2.0**: Seleção de time responsável pelo componente
  - Atualizações em tempo real da lista após operações de criar, editar ou excluir
  - Interface baseada em modal para visualização e edição detalhadas
  - Layout responsivo baseado em cards:
    - Cards de componentes com altura fixa (180px) para apresentação visual consistente
    - Truncamento inteligente para nomes e descrições longos
    - Exibição de tags limitada (até 3) com contador para tags adicionais
    - Formato de exibição de data compacto
    - Indicação de status com badges coloridas
    - **Novo na v2.0**: Indicador do time responsável pelo componente
  - Interface otimizada para desempenho:
    - Implementação de rolagem infinita carregando inicialmente 12 componentes
    - Componentes adicionais carregados automaticamente (8 por vez) ao rolar
    - API Intersection Observer usada para detecção eficiente da posição de rolagem
    - Indicador visual de carregamento durante a busca de dados
    - Layout de grade responsivo adaptando-se a diferentes tamanhos de tela (1, 2 ou 3 colunas)
  - Proteção e experiência do usuário aprimoradas:
    - Diálogo de confirmação para operações de exclusão para evitar perda acidental de dados
    - Aviso claro sobre ações irreversíveis
    - Posicionamento e estilo consistentes de botões em diálogos de confirmação
    - Capacidade de cancelar operações de exclusão
  - Organização flexível de dados:
    - Capacidades avançadas de ordenação para a listagem de componentes
    - Ordenar por nome (alfabético), data (cronológico) ou status (prioridade)
    - Indicação visual do campo e direção de ordenação atual (ascendente/descendente)
    - Estado de ordenação persistente durante a sessão
    - Interface clara com menu dropdown para opções de ordenação
  - Pesquisa em tempo real por nome, descrição ou tags
  - Exportação de listagens para formatos CSV e Excel

### Gerenciamento de Instâncias
- **Descrição**: **Novo na v2.0**: Página para gerenciar instâncias específicas de componentes (Component_Instance) em diferentes ambientes.
- **Funcionalidades**:
  - Operações CRUD completas para instâncias de componentes.
  - Vinculação de instâncias a ambientes específicos.
  - Formulário interativo com validações:
    - Campos obrigatórios: Componente pai, Ambiente
    - Campo opcional para hostname
    - Especificações técnicas em formato JSON com validação e editor estruturado
    - Campos para informações de infraestrutura (CPU, memória, armazenamento)
  - Interface baseada em cards para listagem de instâncias:
    - Cards com altura fixa mostrando componente, ambiente e hostname
    - Badges indicando o ambiente da instância
    - Contador de ADRs associados à instância
    - Indicadores de status operacional (quando disponíveis)
  - Organização de dados:
    - Filtro por componente ou ambiente
    - Ordenação por nome de componente, ambiente ou data de criação
    - Agrupamento por ambiente ou tipo de componente
  - Integração com análise de impacto de ADRs
  - Visualização de timeline de implantações e atualizações
  - Suporte a criação em lote de múltiplas instâncias

### Gerenciamento de Relacionamentos
- **Descrição**: Página para gerenciar relacionamentos entre componentes existentes no grafo de arquitetura.
- **Funcionalidades**:
  - Operações CRUD completas para relacionamentos.
  - Os relacionamentos conectam dois componentes pré-existentes via um tipo de conexão definido.
  - **Novo na v2.0**: Suporte a relacionamentos entre instâncias específicas de componentes (Component_Instance).
  - Formulário interativo com validações de campo:
    - Campos obrigatórios: Componente de Origem, Componente de Destino e Tipo de Relacionamento.
    - Campo opcional para descrição adicional (até 256 caracteres) com contador visual.
    - Seleção de tipo de relacionamento a partir de uma lista predefinida (ex.: CONNECTS_TO, PROTECTS, STORES_DATA_IN).
    - Validação automática para prevenir criação de relacionamentos duplicados entre os mesmos componentes.
  - Atualizações em tempo real da lista após operações de criar, editar ou excluir.
  - Interface baseada em modal para visualização e edição detalhadas de relacionamentos.
  - Layout responsivo baseado em cards para listagens de relacionamentos:
    - Cards com altura fixa (180px) exibindo Origem → Destino e Tipo de Relacionamento.
    - Truncamento inteligente para nomes longos de componentes e descrição.
    - Badge colorida exibindo o tipo de relacionamento.
    - Indicador visual se o relacionamento possui descrição.
    - Formato de exibição compacto para datas de criação e última atualização.
  - Interface otimizada para desempenho:
    - Implementação de rolagem infinita carregando inicialmente 12 relacionamentos.
    - Relacionamentos adicionais carregados automaticamente (8 por vez) ao rolar.
    - API Intersection Observer usada para carregamento preguiçoso eficiente.
    - Spinner visual de carregamento durante a busca de dados.
    - Layout de grade responsivo adaptando-se a diferentes tamanhos de tela (1, 2 ou 3 colunas).
  - Proteção e experiência do usuário aprimoradas:
    - Diálogo de confirmação necessário para operações de exclusão com aviso de ação irreversível.
    - Posicionamento consistente de botões de confirmação e cancelamento.
    - Prevenção de exclusão se os componentes estiverem atualmente envolvidos em processos críticos do sistema (regra opcional).
  - Organização flexível de dados:
    - Capacidades avançadas de ordenação para listagem de relacionamentos:
      - Ordenar por Componente de Origem (alfabético), Componente de Destino (alfabético) ou Tipo de Relacionamento.
      - Indicação visual do campo de ordenação ativo e ordem (crescente/decrescente).
      - Estado de ordenação persistente durante a sessão do usuário.
    - Interface clara e compacta com menu dropdown para opções de ordenação.
  - Filtragem avançada:
    - Filtrar por Tipo de Relacionamento.
    - Pesquisar por nome de Componente de Origem ou Destino (correspondências parciais permitidas).
    - Combinação de filtros e pesquisa para refinar resultados.
  - **Padrões de Interação Adicionais**:
    - Passar o mouse sobre um card de relacionamento destaca os nós relacionados na visualização principal do grafo.
    - Editar um relacionamento atualiza a aresta correspondente no grafo em tempo real.
    - Excluir um relacionamento remove a aresta correspondente imediatamente do grafo sem necessidade de recarga completa.
    - Opção de criação visual de relacionamentos diretamente no grafo.

### Gerenciamento de Categorias
- **Descrição**: Página para gerenciar categorias de componentes dentro da arquitetura.
- **Funcionalidades**:
  - Operações CRUD completas para categorias.
  - **Novo na v2.0**: Organização hierárquica de categorias em níveis TRM.
  - Interface interativa com validações de campo:
    - Campos obrigatórios: Nome da categoria.
    - Campo opcional para descrição detalhada (até 256 caracteres) com um contador visual.
    - Seleção de uma imagem representativa para a categoria:
      - Apenas formato `.png` é aceito.
      - Imagens são armazenadas estaticamente no diretório `public/images/categories` no frontend.
      - Usuários podem selecionar uma imagem a partir de uma lista predefinida.
      - Imagens selecionadas são usadas para representar visualmente os nós no grafo.
    - **Novo na v2.0**: Campo para selecionar o nível TRM pai (Infrastructure, Platform, Application, Shared Services).
  - Atualizações em tempo real da lista após criar, editar ou excluir uma categoria.
  - Interface baseada em modal para visualização e edição detalhadas.
  - Layout responsivo baseado em cards:
    - Cards com altura fixa (180px) exibindo nome, descrição e imagem.
    - Truncamento inteligente para nomes e descrições longos.
    - Indicador visual mostrando o número de componentes associados a cada categoria.
    - Formato de exibição compacto para data de criação.
    - **Novo na v2.0**: Indicador do nível TRM ao qual a categoria pertence.
  - Interface otimizada para desempenho:
    - Implementação de rolagem infinita, carregando inicialmente 12 categorias.
    - Categorias adicionais carregadas automaticamente (8 por vez) ao rolar.
    - API Intersection Observer usada para detecção eficiente da posição de rolagem.
    - Indicador visual de carregamento durante a busca de dados.
    - Layout de grade responsivo adaptando-se a diferentes tamanhos de tela.
  - Proteção do usuário aprimorada:
    - Diálogo de confirmação para operações de exclusão com aviso sobre ação irreversível.
    - Verificação de segurança prevenindo exclusão de categorias com componentes associados.
    - Posicionamento consistente de botões de confirmar e cancelar.
    - Organização flexível de dados:
      - Capacidades avançadas de ordenação para listar categorias:
        - Ordenar por nome (alfabético), data (cronológico) ou número de componentes.
        - Indicação visual do campo de ordenação ativo e direção (ascendente/descendente).
        - Estado de ordenação persistente durante a sessão do usuário.
    - Interface compacta com menu dropdown para opções de ordenação.
  - Filtragem avançada:
    - Pesquisar por nome de categoria (correspondências parciais permitidas).
    - Filtrar para categorias com ou sem componentes associados.
    - **Novo na v2.0**: Filtro por nível TRM.
    - Visualização alternativa em formato de árvore hierárquica mostrando a estrutura TRM.

### Gerenciamento de Ambientes
- **Descrição**: **Novo na v2.0**: Página para gerenciar ambientes onde componentes são implantados.
- **Funcionalidades**:
  - Operações CRUD completas para ambientes.
  - Formulário com campos para nome e descrição do ambiente.
  - Configuração de ordem de promoção entre ambientes (ex.: desenvolvimento → homologação → produção).
  - Listagem de componentes implantados em cada ambiente.
  - Contadores de instâncias por ambiente.
  - Filtragem e ordenação de ambientes.
  - Proteção contra exclusão de ambientes em uso.
  - Dashboard de status com visão consolidada por ambiente.
  - Definição de etiquetas e propriedades específicas por ambiente para anotações personalizadas.
  - Visualização de dependências entre ambientes.

### Gerenciamento de Times
- **Descrição**: Gerenciar times dentro da organização.
- **Funcionalidades**:
  - Operações CRUD para times.
  - **Novo na v2.0**: Gerenciamento de associação de usuários a times.
  - **Novo na v2.0**: Visualização dos componentes sob responsabilidade de cada time.
  - Interface de arraste-e-solte para associar usuários a times.
  - Contadores de membros e componentes por time.
  - Dashboard resumido de atividades por time.
  - Histórico de alterações na composição do time.
  - Visualização de grafo de relacionamentos entre times.
  - Matriz de responsabilidades RACI para componentes.
  - Exportação de relatórios de alocação de times.
  - Integração com sistema de notificações para comunicação em equipe.

### Backlog Unificado
- **Descrição**: **Novo na v2.0**: Página para gerenciar itens de roadmap e planejamento.
- **Funcionalidades**:
  - CRUD de itens de roadmap com tipos personalizáveis.
  - Associação de itens a componentes, ambientes e times.
  - Visualização em formato de quadro Kanban e timeline.
  - Filtragem por status, tipo, responsável e prazo.
  - Agrupamento por time, componente ou sprint.
  - Rastreamento de progresso e métricas.
  - Integração com sistema de notificações para lembretes de prazos.
  - Exportação de relatórios e planos de entrega.

---

## Sistema de Mensagens de Erro e Logs

### Mensagens de Erro para Usuários

- **Descrição**: Sistema padronizado de apresentação de erros e alertas em toda a plataforma.
- **Componentes Principais**:
  - **ToastContainer**: Componente global para mensagens temporárias
  - **ErrorBoundary**: Captura exceções não tratadas em React
  - **FormErrorMessage**: Componente padronizado para erros de formulário
  - **GlobalErrorAlert**: Banner de erro para problemas críticos do sistema

- **Funcionalidades**:
  - **Categorização por Tipo**:
    - **Validação**: Entrada inválida em formulários com destaque do campo específico
    - **Autenticação**: Problemas relacionados a login, permissões ou sessão expirada
    - **Comunicação**: Falhas de rede, timeout de API ou recursos indisponíveis
    - **Operacional**: Erros em operações do sistema (CRUD, análises, etc.)
    - **Sistema**: Falhas internas não esperadas

  - **Apresentação Contextual**:
    - **Inline**: Erros próximos aos campos específicos em formulários
    - **Toast**: Mensagens temporárias no canto superior direito (duração: 5s)
    - **Modal**: Para erros que requerem atenção imediata ou impedem continuidade
    - **Banner**: Para erros globais que afetam múltiplas páginas

  - **Design Visual Padronizado**:
    - **Validação**: Ícone triangular amarelo com ponto de exclamação
    - **Erro**: Ícone circular vermelho com "X"
    - **Sucesso**: Ícone circular verde com marca de verificação
    - **Informação**: Ícone circular azul com "i"
    - Cada mensagem inclui título, descrição e ação recomendada
    - Formato consistente: `[Tipo]: [Mensagem] | [Ação Sugerida]`

  - **Customizações por Página**:
    - **ADR Management**: Erros específicos de validação de participantes
    - **Componentes**: Validação de duplicatas e categorias inválidas
    - **Relacionamentos**: Validação de ciclos e referências inválidas

  - **Implementação Visual**:
    - Fundo: Vermelho leve (#FEE2E2) para erros, cores específicas para outros tipos
    - Borda: Vermelho médio (#EF4444) com espessura de 1px
    - Ícone: Círculo com "X" (#DC2626) posicionado à esquerda
    - Texto de Erro: Preto de alto contraste (#1F2937)
    - Texto de Solução: Cinza escuro (#4B5563)
    - Raio de Borda: 6px
    - Padding: 16px
    - Margens: 16px superior/inferior

  - **Comportamento**:
    - Posicionamento: Topo da página para erros globais, próximo ao campo para erros de formulário
    - Duração: Erros globais permanecem até serem fechados pelo usuário
    - Animação: Fade-in suave (0.3s ease-in) na aparição
    - Prioridade: Apenas uma mensagem de erro global exibida por vez
    - Dispensabilidade: Todas as mensagens podem ser fechadas pelo usuário
    - Botão de fechar (X) sempre presente no canto superior direito
    - Código de erro técnico de referência (formato: ERR-XXXX-YY-ZZ) discreto no canto inferior direito

### Logs Detalhados para Desenvolvimento

- **Descrição**: Sistema abrangente de logging para ambiente de desenvolvimento.
- **Funcionalidades**:
  - Ambiente de desenvolvimento (`NODE_ENV=development`) habilita logs detalhados.
  - Console do navegador recebe logs estruturados e formatados.
  - Cada log segue um formato padronizado que inclui:
    ```javascript
    {
      timestamp: "2024-06-18T14:32:45.121Z",
      level: "error",
      errorCode: "ERR-4021-02-API",
      component: "ComponentManager.saveComponent",
      context: {
        userId: "user_123",
        componentId: "comp_456",
        requestData: { /* dados enviados */ },
        requestParams: { /* parâmetros da requisição */ }
      },
      message: "Falha ao salvar componente: Duplicate key violation",
      stackTrace: "...",
      httpStatus: 409,
      source: "api" // 'ui', 'api', 'db'
    }
    ```

  - **Níveis de Log**:
    - **error**: Erros críticos que impedem operações principais
    - **warn**: Problemas não críticos que permitem operação continuada
    - **info**: Informações importantes de fluxo e operações bem-sucedidas
    - **debug**: Detalhes adicionais úteis para depuração
    - **trace**: Informações extremamente detalhadas

  - **Utilidades para Desenvolvedores**:
    - **Filtragem**: Console permite filtrar por nível e módulo (categoria)
    - **Agrupamento**: Logs relacionados são agrupados para facilitar análise
    - **Colorização**: Diferentes níveis têm cores distintas no console
    - **Links para Código**: Clicáveis e levam à linha exata no debugger
    - **Exportação**: Logs podem ser exportados para análise posterior

  - **Integrações**:
    - Ambiente de produção envia logs para sistema de monitoramento
    - Logs críticos em produção geram alertas para equipe de suporte
    - Métricas de erro são exibidas no dashboard de observabilidade
    - Erros repetidos são agrupados para evitar spam
    - Logs estruturados como objetos para fácil filtragem no console
    - Em ambiente de produção, os erros são registrados sem informações sensíveis
    - Hook global de erro para capturar exceções não tratadas

  - **Boas Práticas para Desenvolvedores**:
    - Sempre incluir contexto suficiente para reproduzir o problema
    - Nunca registrar senhas, tokens ou dados pessoais sensíveis
    - Usar níveis de log apropriadamente, evitando poluição em produção
    - Garantir que códigos de erro sejam únicos e bem documentados

### Códigos de Erro Padronizados

- **Descrição**: Sistema de codificação padronizada para facilitar identificação e diagnóstico de erros.
- **Estrutura de Códigos**:
  - Formato: `ERR-XXXX-YY-ZZ`
    - **XXXX**: Código de módulo
      - 1000-1999: Autenticação e Autorização
      - 2000-2999: Gerenciamento de ADRs
      - 3000-3999: Análise de Impacto
      - 4000-4999: Gerenciamento de Componentes
      - 5000-5999: Gerenciamento de Relacionamentos
      - 6000-6999: TRM e Categorias
      - 7000-7999: Glossário
      - 8000-8999: Sistema e Configuração
      - 9000-9999: Integração e Comunicação
    
    - **YY**: Tipo de erro
      - 01: Validação de entrada
      - 02: Permissão/Autorização
      - 03: Não encontrado
      - 04: Conflito/Duplicação
      - 05: Timeout/Performance
      - 06: Formato inválido
      - 07: Dependência externa
      - 08: Estado inválido
      - 09: Limite excedido
      - 10: Recurso indisponível
    
    - **ZZ**: Origem
      - UI: Interface do usuário
      - API: Backend/API
      - DB: Banco de dados
      - EXT: Serviço externo

  - **Documentação de Erros**:
    - Cada código tem uma página dedicada na documentação interna
    - Inclui descrição, causas comuns, passos para reprodução e soluções
    - Acessível através do link na mensagem de erro pelo ícone "?"

---

## Conclusão

Este documento fornece uma visão detalhada das principais páginas do aplicativo Beaver v2.0, incluindo as funcionalidades administrativas e de autenticação. As melhorias da v2.0 estão focadas em maior flexibilidade do schema, melhor gerenciamento de ambientes e instâncias de componentes (Component_Instance), e aprimoramento do trabalho colaborativo em ADRs com validação automática de participantes. 

A introdução do sistema de referência a termos do Glossário usando "#" nos textos de ADRs facilita a padronização terminológica e melhora a compreensão dos documentos arquiteturais. Além disso, o sistema padronizado de mensagens de erro e logs detalhados para desenvolvedores contribui para uma melhor experiência tanto dos usuários finais quanto da equipe de desenvolvimento.

Para mais informações técnicas detalhadas, consulte o documento `Architecture_v2.0_pt_br.md`. 