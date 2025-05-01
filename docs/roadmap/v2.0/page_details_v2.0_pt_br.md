# Detalhes das Páginas - Beaver v2.0

## Páginas Principais

### Visão Geral da Arquitetura
- **Descrição**: Esta página permite aos usuários visualizar e interagir com o grafo de arquitetura empresarial. Utiliza Cytoscape.js para renderizar nós e arestas, oferecendo layouts como cola (direcionado por força), concêntrico e em largura.

- **Funcionalidades**:
  - Visualização interativa de grafos.
  - Filtros nativos por ambiente, domínio e criticidade.
  - Suporte a consultas temporais via `valid_from` e `valid_to`.
  - **Novo na v2.0**: Filtro por instâncias específicas de componentes em diferentes ambientes.

### Gerenciamento de ADRs
- **Descrição**: Página dedicada ao gerenciamento de Registros de Decisão Arquitetural (ADRs).
- **Funcionalidades**:
  - Criação e edição de ADRs.
  - Capacidades completas de diff e rollback.
  - Integração com fluxo de trabalho de impacto para comentários e merges.
  - **Novo na v2.0**: Sistema de participantes múltiplos com papéis definidos (owner, reviewer, consumer).

### Fluxo de Trabalho de Impacto
- **Descrição**: Facilita o fluxo de trabalho de impacto, permitindo aos arquitetos gerenciar mudanças.
- **Funcionalidades**:
  - Rascunho, diff visual, comentários e merge pelo papel de arquiteto.
  - **Novo na v2.0**: Análise de impacto em instâncias específicas de componentes.

### Glossário
- **Descrição**: Fornece um dicionário incorporado com suporte a tags.
- **Funcionalidades**:
  - Autocompletar termos com `#tag`.
  - Definições em hover-card.
  - Suporte a tagging em massa e pesquisa via API.
  - **Novo na v2.0**: Status de termos do glossário (rascunho, aprovado, obsoleto).

## Páginas de Administração

### Gerenciamento de Usuários
- **Descrição**: Página de administração para gerenciar contas e papéis de usuários.
- **Funcionalidades**:
  - Operações CRUD para usuários.
  - Atribuição e gerenciamento de papéis.
  - **Novo na v2.0**: Associação de usuários a times organizacionais.

### Configurações do Sistema
- **Descrição**: Permite aos administradores configurar definições globais do sistema.
- **Funcionalidades**:
  - Configuração de definições da aplicação.
  - Configurações de monitoramento e logging.
  - **Novo na v2.0**: Gerenciamento de tipos de itens de roadmap e ambientes.

## Páginas de Autenticação

### Login
- **Descrição**: Página para autenticação de usuários.
- **Funcionalidades**:
  - Login seguro com autenticação JWT.
  - Opções de recuperação e redefinição de senha.

### Registro
- **Descrição**: Permite que novos usuários registrem uma conta.
- **Funcionalidades**:
  - Formulário de registro de usuário.
  - Processo de verificação de e-mail.

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
    - Seleção de status (Ativo, Inativo, Obsoleto/Planejado)
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

### Gerenciamento de Instâncias
- **Descrição**: **Novo na v2.0**: Página para gerenciar instâncias específicas de componentes em diferentes ambientes.
- **Funcionalidades**:
  - Operações CRUD completas para instâncias de componentes.
  - Vinculação de instâncias a ambientes específicos.
  - Formulário interativo com validações:
    - Campos obrigatórios: Componente pai, Ambiente
    - Campo opcional para hostname
    - Especificações técnicas em formato JSON com validação
  - Interface baseada em cards para listagem de instâncias:
    - Cards com altura fixa mostrando componente, ambiente e hostname
    - Badges indicando o ambiente da instância
    - Contador de ADRs associados à instância
  - Organização de dados:
    - Filtro por componente ou ambiente
    - Ordenação por nome de componente, ambiente ou data de criação
  - Integração com análise de impacto de ADRs

### Gerenciamento de Relacionamentos
- **Descrição**: Página para gerenciar relacionamentos entre componentes existentes no grafo de arquitetura.
- **Funcionalidades**:
  - Operações CRUD completas para relacionamentos.
  - Os relacionamentos conectam dois componentes pré-existentes via um tipo de conexão definido.
  - **Novo na v2.0**: Suporte a relacionamentos entre instâncias específicas de componentes.
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

### Gerenciamento de Categorias
- **Descrição**: Página para gerenciar categorias de componentes dentro da arquitetura.
- **Funcionalidades**:
  - Operações CRUD completas para categorias.
  - Interface interativa com validações de campo:
    - Campos obrigatórios: Nome da categoria.
    - Campo opcional para descrição detalhada (até 256 caracteres) com um contador visual.
    - Seleção de uma imagem representativa para a categoria:
      - Apenas formato `.png` é aceito.
      - Imagens são armazenadas estaticamente no diretório `public/images/categories` no frontend.
      - Usuários podem selecionar uma imagem a partir de uma lista predefinida.
      - Imagens selecionadas são usadas para representar visualmente os nós no grafo.
  - Atualizações em tempo real da lista após criar, editar ou excluir uma categoria.
  - Interface baseada em modal para visualização e edição detalhadas.
  - Layout responsivo baseado em cards:
    - Cards com altura fixa (180px) exibindo nome, descrição e imagem.
    - Truncamento inteligente para nomes e descrições longos.
    - Indicador visual mostrando o número de componentes associados a cada categoria.
    - Formato de exibição compacto para data de criação.
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

### Gerenciamento de Ambientes
- **Descrição**: **Novo na v2.0**: Página para gerenciar ambientes onde componentes são implantados.
- **Funcionalidades**:
  - Operações CRUD completas para ambientes.
  - Formulário com campos para nome e descrição do ambiente.
  - Listagem de componentes implantados em cada ambiente.
  - Contadores de instâncias por ambiente.
  - Filtragem e ordenação de ambientes.
  - Proteção contra exclusão de ambientes em uso.

### Gerenciamento de Times
- **Descrição**: Gerenciar times dentro da organização.
- **Funcionalidades**:
  - Operações CRUD para times.
  - **Novo na v2.0**: Gerenciamento de associação de usuários a times.
  - **Novo na v2.0**: Visualização dos componentes sob responsabilidade de cada time.
  - Interface de arraste-e-solte para associar usuários a times.
  - Contadores de membros e componentes por time.
  - Dashboard resumido de atividades por time.

## Conclusão
Este documento fornece uma visão detalhada das principais páginas do aplicativo Beaver v2.0, incluindo as funcionalidades administrativas e de autenticação. As melhorias da v2.0 estão focadas em maior flexibilidade do schema, melhor gerenciamento de ambientes e instâncias, e aprimoramento do trabalho colaborativo em ADRs. 