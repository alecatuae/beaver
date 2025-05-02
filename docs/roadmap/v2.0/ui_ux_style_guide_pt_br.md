# Guia de Estilo UI/UX - Beaver v2.0

Este guia de estilo UI/UX abrangente documenta os padrões de design, princípios e diretrizes de implementação para a plataforma Beaver v2.0. Serve como referência para designers, desenvolvedores e stakeholders envolvidos no desenvolvimento e manutenção contínua da plataforma.

## Sumário

1. [Introdução](#introdução)
2. [Princípios de Design](#princípios-de-design)
3. [Design Visual](#design-visual)
   - [Tipografia](#tipografia)
   - [Paleta de Cores](#paleta-de-cores)
   - [Espaçamento e Layout](#espaçamento-e-layout)
   - [Iconografia](#iconografia)
   - [Sombras e Profundidade](#sombras-e-profundidade)
4. [Diretrizes de Componentes](#diretrizes-de-componentes)
   - [Navegação e Sidebar](#navegação-e-sidebar)
   - [Cabeçalho](#cabeçalho)
   - [Área de Conteúdo](#área-de-conteúdo)
   - [Cards de Componentes](#cards-de-componentes)
   - [Gerenciamento de Relacionamentos](#gerenciamento-de-relacionamentos)
   - [Painel de Detalhes](#painel-de-detalhes)
   - [Rodapé](#rodapé)
   - [Botões e Controles](#botões-e-controles)
   - [Controles de Ordenação de Dados](#controles-de-ordenação-de-dados)
   - [Formulários e Inputs](#formulários-e-inputs)
   - [Diagrama de Arquitetura](#diagrama-de-arquitetura)
5. [Padrões de Interação](#padrões-de-interação)
   - [Estados e Feedback](#estados-e-feedback)
   - [Confirmação de Exclusão](#confirmação-de-exclusão)
   - [Estados de Carregamento](#estados-de-carregamento)
   - [Design Responsivo](#design-responsivo)
   - [Sistema de Mensagens de Erro](#sistema-de-mensagens-de-erro)
6. [Diretrizes de Acessibilidade](#diretrizes-de-acessibilidade)
7. [Novos Elementos na v2.0](#novos-elementos-na-v20)
8. [Apêndice](#apêndice)

## Introdução

A plataforma Beaver foi projetada para apoiar equipes de arquitetura e engenharia, fornecendo ferramentas para documentação arquitetural, gerenciamento de registros de decisão (ADRs) e análise de impacto. Este guia de estilo assegura que a interface do usuário permaneça consistente, intuitiva e alinhada com as melhores práticas em design UX/UI. 

A versão 2.0 introduz suporte aprimorado ao TRM (Technical Reference Model), gerenciamento de instâncias de componentes em diferentes ambientes, sistema de referência a termos do glossário, e várias outras funcionalidades que expandem as capacidades da plataforma, mantendo sua coerência visual e usabilidade.

## Princípios de Design

Nosso design segue estes princípios fundamentais:

1. **Consistência Visual**: Manter tipografia, estilos de borda, ícones e botões uniformes em todas as telas.

2. **Hierarquia Clara**: Priorizar elementos importantes visualmente e usar diferentes pesos de fonte para estabelecer uma hierarquia de informação clara.

3. **Foco na Legibilidade**: Garantir tamanho mínimo de fonte de 16px e manter uma proporção de contraste de pelo menos 4,5:1 entre texto e fundo.

4. **Feedback Imediato**: Fornecer dicas visuais para ações do usuário através de animações, indicadores de carregamento e mudanças de estado.

5. **Ações Prioritárias Óbvias**: Distinguir botões primários de ações secundárias para guiar os usuários em direção às tarefas principais.

6. **Minimalismo Orientado à Função**: Incluir apenas elementos visuais que sirvam a um propósito claro em ajudar os usuários a atingir seus objetivos.

7. **Navegação Intuitiva**: Criar padrões de navegação previsíveis que estejam alinhados com as expectativas do usuário.

8. **Design Acessível**: Garantir que a interface seja utilizável por pessoas com diferentes habilidades e necessidades.

## Design Visual

### Tipografia

- **Família de Fonte**: Utilizar fonte sans-serif moderna (Inter, Roboto ou Poppins)
- **Hierarquia de Tamanhos**:
  - Títulos Principais (H1): 24-32px
  - Títulos de Seção (H2): 20-24px
  - Títulos de Subseção (H3): 18-20px
  - Itens de Menu: 16-18px
  - Texto Principal: 16px
  - Texto Auxiliar: 12-14px
- **Uso de Peso**:
  - Negrito (600/700) para títulos e ênfase
  - Médio (500) para subtítulos e elementos importantes
  - Regular (400) para texto principal e conteúdo geral

### Paleta de Cores

- **Cor Primária**: Roxo (#7839EE)
  - Utilizada para elementos ativos/interativos, destaque e ações primárias
  - Variações: Claro (#9A6CF4), Escuro (#5B20C2)

- **Cores Neutras**:
  - Fundo: Branco (#FFFFFF)
  - Fundo do Sidebar: Cinza Claro (#F1F1F5)
  - Texto: Cinza Escuro (#333333)
  - Texto Secundário: Cinza Médio (#666666)
  - Bordas: Cinza Claro (#DDDDDD)

- **Cores Funcionais**:
  - Sucesso: Verde (#34C759)
  - Atenção: Âmbar (#FFC107)
  - Erro: Vermelho (#FF3B30)
  - Informação: Azul (#2196F3)

### Espaçamento e Layout

- **Sistema de Grid**: 
  - Layout de três colunas para interfaces complexas
  - Unidade base de 8px (seguindo princípios de grid de 8pt)
  - Proporções de seção: Navegação (20-25%), Conteúdo (50-60%), Detalhes (20-25%)

- **Unidades de Espaçamento**:
  - Extra Pequeno: 4px
  - Pequeno: 8px
  - Médio: 16px
  - Grande: 24px
  - Extra Grande: 32px
  - XX Grande: 48px

- **Padding de Containers**:
  - Cards e Painéis: 16px
  - Seções Principais: 24px
  - Campos de Formulário: 12px horizontal, 8px vertical

### Iconografia

- **Estilo**: Estilo consistente por toda a interface (todos delineados ou todos preenchidos)
- **Tamanho**: 
  - Ícones padrão de UI: 20-24px
  - Ícones de destaque: 24-32px
  - Indicadores pequenos: 16px
- **Espaçamento**: Distância mínima de 8px entre ícone e texto associado
- **Uso**: Ícones devem ser contextualmente relevantes à sua função

### Sombras e Profundidade

- **Níveis de Profundidade**:
  - Nível 1 (sutil): `box-shadow: 0px 1px 2px rgba(0,0,0,0.05)`
  - Nível 2 (médio): `box-shadow: 0px 2px 4px rgba(0,0,0,0.1)`
  - Nível 3 (pronunciado): `box-shadow: 0px 4px 8px rgba(0,0,0,0.15)`

- **Raio de Borda**: 
  - Elementos padrão: 8px
  - Botões: 8px
  - Elementos pequenos: 4px
  - Pílulas/tags: 16px ou completamente arredondados

## Diretrizes de Componentes

### Navegação e Sidebar

- **Largura**: 240-260px (expandido), 64-80px (recolhido)
- **Fundo**: Ligeiramente mais escuro que a área de conteúdo principal
- **Layout**:
  - Logo da aplicação no topo (com texto quando expandido)
  - Menu vertical com itens agrupados por função
  - Cada item de menu inclui um ícone e rótulo
  - Item ativo destacado com cor de fundo, indicador à esquerda e tipografia mais forte
  - Alternador de tema na parte inferior
  - **Novo na v2.0**: Suporte a submenus hierárquicos para funcionalidades relacionadas
  - **Novo na v2.0**: Indicador visual de itens expansíveis (seta para baixo)

- **Estados**:
  - Padrão: Texto com peso regular, ícone padrão
  - Hover: Destaque sutil no fundo
  - Ativo: Fundo preenchido, texto de alto contraste, barra indicadora
  - Desativado: Opacidade reduzida

- **Estrutura de Menu**:
  - Itens principais com ícones à esquerda e texto à direita
  - Submenus com recuo (16px) para indicar relação hierárquica
  - Item atual destacado com barra lateral roxa
  - Estado de expansão mantido durante a sessão do usuário
  - Animação suave na transição de expansão/retração

### Cabeçalho

- **Altura**: 56-64px
- **Layout**:
  - Seletor de ambiente (dropdown)
  - Título da página (abaixo do cabeçalho ou parte dele)
  - Ícones de ação rápida (configurações, notificações)
  - Acesso ao perfil/conta do usuário
  - Opcional: funcionalidade de busca

- **Comportamento**:
  - Posição fixa durante rolagem
  - Consistente em todas as páginas
  - Separação visual clara da área de conteúdo

### Área de Conteúdo

- **Fundo**: Branco (#FFFFFF)
- **Padding**: 24px
- **Layout**:
  - Apresentação limpa e organizada do conteúdo principal
  - Títulos de seção claros
  - Largura adaptativa baseada no viewport
  - Rolagem quando o conteúdo excede a altura do viewport

- **Para Diagrama de Arquitetura**:
  - Foco central na visualização do diagrama
  - Conexões de componentes claramente rotuladas
  - Distinção visual entre tipos de nós
  - Indicadores direcionais nas conexões
  - Barra de ferramentas lateral com controles de interação
  - **Novo na v2.0**: Filtro por níveis TRM (Infrastructure, Platform, Application, Shared Services)
  - **Novo na v2.0**: Visualização de instâncias específicas de componentes

### Cards de Componentes

#### Dimensões
- **Altura Fixa**: 180px para consistência entre todos os cards
- **Largura Flexível**: Ajusta-se responsivamente com base no layout da grade
- **Padding**: Espaçamento interno de 16px para conteúdo

#### Layout
- **Estrutura**: Coluna flex com seções de cabeçalho, corpo e rodapé
- **Cabeçalho**: Nome do componente (truncado para 70% da largura se muito longo) e badge de status
- **Corpo**: Descrição com limite de 2 linhas para aparência consistente
- **Rodapé**: Tags (máximo 3 exibidas) e data de criação
- **Novo na v2.0**: Indicador do time responsável pelo componente

#### Tratamento de Texto
- **Nome do Componente**: Truncar com reticências se exceder a largura disponível
- **Descrição**: Limite de 2 linhas com reticências para overflow
- **Tags**: Mostrar primeiras 3 tags com indicador +N para tags adicionais
- **Data**: Exibir em formato compacto dd/MM/yyyy

#### Design Visual
- **Raio de Borda**: 8px para cantos arredondados
- **Sombra**: Elevação sutil no hover
- **Estado Hover**: Pequeno aumento de escala (1.02) para feedback interativo
- **Indicador de Status**: Badge colorido (verde para active, amarelo para deprecated, vermelho para inactive)
- **Novo na v2.0**: Realce visual de termos do glossário referenciados no texto com hover-cards

### Gerenciamento de Relacionamentos

#### Design de Card
- **Altura Fixa**: 160px para consistência entre todos os cards de relacionamento
- **Largura Flexível**: Ajusta-se responsivamente com base no layout da grade
- **Padding**: Espaçamento interno de 16px para conteúdo

#### Layout
- **Estrutura**: Coluna flex com seções de cabeçalho, corpo e rodapé
- **Cabeçalho**: Badge de tipo de relacionamento com distinção visual proeminente
- **Corpo**: Componentes de origem e destino com indicador direcional (→)
- **Rodapé**: Descrição (se disponível) e data de criação
- **Novo na v2.0**: Suporte a relacionamentos entre instâncias específicas

#### Tratamento de Texto
- **Tipo de Relacionamento**: Exibido como um badge colorido baseado na categoria do tipo
- **Nomes de Componentes**: Truncar com reticências se exceder a largura disponível
- **Descrição**: Limite de 2 linhas com reticências para overflow
- **Data**: Exibir em formato compacto dd/MM/yyyy

#### Design Visual
- **Raio de Borda**: 8px para cantos arredondados
- **Sombra**: Elevação sutil no hover
- **Estado Hover**: Pequeno aumento de escala (1.02) para feedback interativo
- **Indicadores de Tipo**: Codificados por cor por categoria:
  - **DEPENDS_ON**: Azul (#3b82f6)
  - **COMMUNICATES_WITH**: Verde (#10b981)
  - **EXTENDS**: Roxo (#8b5cf6)
  - **IMPLEMENTS**: Turquesa (#14b8a6)
  - **CONTAINS**: Laranja (#f59e0b)
  - **USES**: Índigo (#6366f1)

#### Diretrizes de Formulário
- **Seleção de Origem/Destino**: Dropdown com funcionalidade de busca para fácil seleção de componente
- **Seleção de Tipo**: Botões de rádio ou dropdown com indicadores de cor correspondentes aos badges de tipo
- **Descrição**: Campo opcional com limite de 256 caracteres e contador
- **Validação**: Mensagens de erro claras para campos obrigatórios e seleções inválidas

### Painel de Detalhes

- **Largura**: 320-360px (pode ser recolhível)
- **Layout**:
  - Funcionalidade de busca/filtro no topo
  - Informações categorizadas em seções recolhíveis
  - Metadados de componente em formato chave-valor
  - Títulos de seção claros
  - Apresentação compacta de informações detalhadas
  - Ações modais (botões) devem ser colocadas na parte inferior com espaçamento consistente (gap-4)
  - Evitar botões de ação duplicados (Editar/Excluir) em diferentes partes do mesmo modal

- **Interações**:
  - Expandir/recolher seções
  - Filtros rápidos para tipos de informação
  - Relação direta com o conteúdo selecionado na área principal
  - Botão de fechar deve ser posicionado no canto superior direito como um ícone (✕) sem rótulo
  - Botões de ação na parte inferior devem seguir as convenções de cor e estilo de toda a plataforma
  - **Novo na v2.0**: Exibição de instâncias específicas de componentes em cada ambiente
  - **Novo na v2.0**: Visualização de times responsáveis pelos componentes

### Rodapé

- **Altura**: 80-100px
- **Fundo**: Cinza claro, visualmente separado do conteúdo
- **Layout**:
  - Estrutura de duas colunas
  - Esquerda: Logo, copyright, créditos de desenvolvedor
  - Direita: Links rápidos organizados por categoria
  - Todo texto devidamente alinhado e dimensionado para legibilidade

### Botões e Controles

- **Botões Primários**:
  - Fundo: Cor primária (roxo #7839EE)
  - Texto: Branco
  - Padding: 8px 16px (mínimo)
  - Altura: 36-40px
  - Raio de borda: 8px
  - Efeito hover: Leve escurecimento do fundo
  - Uso para ações principais/destrutivas como "Salvar", "Criar", "Excluir", "Enviar"

- **Botões Secundários**:
  - Fundo: Transparente ou cinza claro
  - Borda: 1px sólido (cor varia por contexto)
  - Texto: Mesma cor da borda
  - Mesmas dimensões que botões primários
  - Efeito hover: Leve preenchimento de fundo
  - Uso para ações secundárias como "Cancelar", "Voltar", "Editar"

- **Botões Terciários/de Texto**:
  - Sem fundo ou borda
  - Texto: Cor primária ou apropriada ao contexto
  - Sublinhado no hover

- **Botões de Ícone**:
  - Fundo quadrado ou circular
  - Padding consistente (geralmente 8px)
  - Estado de hover claro
  - Tooltip opcional para clareza

### Controles de Ordenação de Dados

- **Aparência do Botão de Ordenação**:
  - Posicionamento consistente próximo aos controles de filtro
  - Representação clara de ícone (ArrowUpDown)
  - Texto do rótulo "Ordenar" para clareza
  - Mesma altura e estilo que botões adjacentes
  - Feedback visual do estado atual de ordenação

- **Opções de Ordenação**:
  - Dropdown com campos comuns de ordenação (nome, data, status)
  - Indicação do campo de ordenação atual com ícone
  - Alternar direção (ascendente/descendente) ao selecionar campo já ativo
  - Ícones indicando direção de ordenação (SortAsc/SortDesc)
  - Espaçamento e alinhamento consistentes de opções
  - Distinção visual clara da opção selecionada

### Formulários e Inputs

- **Inputs de Texto**:
  - Altura: 36-40px
  - Padding: 8px 12px
  - Borda: 1px sólido da cor da borda
  - Raio de borda: 4-8px
  - Estado de foco: Destaque na cor primária
  - Estado de erro: Destaque na cor de erro com mensagem

- **Inputs de Textarea**:
  - Padding: 12px
  - Borda: 1px sólido da cor da borda
  - Raio de borda: 4-8px
  - Campos de descrição: Máximo de 256 caracteres com contador visual
  - Contador de caracteres: Mostra caracteres restantes
  - Estado de aviso: Contador fica vermelho quando restam 20 ou menos caracteres
  - Estado de erro: Borda muda para cor de erro com mensagem descritiva

- **Dropdowns**:
  - Estilo similar aos inputs de texto
  - Indicador claro de expansibilidade
  - Estilo consistente das opções de dropdown
  - Estado ativo/selecionado destacado
  - Fundo sólido (branco no modo claro, fundo de card no modo escuro)
  - Menus não transparentes para melhor legibilidade
  - Raio de borda correspondente a outros elementos da UI

- **Checkboxes e Botões de Rádio**:
  - Estilo personalizado correspondente à linguagem geral de design
  - Estados ativos/selecionados claros
  - Espaçamento apropriado com rótulos

- **Novo na v2.0**: 
  - Suporte a autocompletar termos do glossário usando "#" em campos de texto
  - Campo para associação de times responsáveis em formulários de componente
  - Suporte a seleção de níveis TRM para categorias
  - Campo para seleção de múltiplos participantes em ADRs com diferentes papéis

### Diagrama de Arquitetura

- **Nós**:
  - Containers circulares com ícones contextuais
  - Tamanho consistente (40-64px de diâmetro)
  - Rótulos claros
  - Estados interativos de hover e seleção
  - **Novo na v2.0**: Distinção visual entre componentes e instâncias específicas
  - **Novo na v2.0**: Indicação visual de camadas TRM

- **Conexões**:
  - Setas direcionais mostrando fluxo de relacionamento
  - Rótulos de protocolo nas conexões
  - Espessura de linha indicando importância ou tipo
  - Destaques de conexão na seleção de nó

- **Controles**:
  - Botões de zoom in/out
  - Opção de redefinir visualização
  - Funcionalidade de exportar/baixar
  - Capacidades de panorâmica e manipulação direta
  - **Novo na v2.0**: Filtros por ambiente, time, nível TRM

## Padrões de Interação

### Estados e Feedback

- **Estados de Hover**: 
  - Mudança sutil de cor ou efeito de sombra
  - Mudança no tom de fundo
  - Transição: 0.2s ease

- **Estados Ativos/Selecionados**:
  - Distinção visual clara
  - Mudança no fundo, borda ou peso do texto
  - Mudança de estado de ícone opcional

- **Estados Desativados**:
  - Opacidade reduzida (geralmente 0.5-0.6)
  - Remoção de efeitos hover
  - Mudança de cursor para indicar não-interatividade

- **Mensagens de Feedback**:
  - Sucesso: Fundo verde com texto de confirmação
  - Erro: Fundo vermelho com descrição do problema e solução
  - Aviso: Fundo âmbar com informação de cautela
  - Informação: Fundo azul com contexto útil

### Confirmação de Exclusão

- **Consistentemente Exigido**: Todas as operações de exclusão devem solicitar confirmação do usuário
- **Design de Diálogo**:
  - Título claro: "Confirmar Exclusão"
  - Mensagem de aviso explicando as consequências
  - Menção de que a ação não pode ser desfeita
  - Dois botões: "Cancelar" (variante outline) e "Excluir" (variante default/primary)
  - Espaçamento consistente entre os botões (gap-4)
  - Botões alinhados à direita para manter o padrão da plataforma
- **Implementação**:
  - Diálogo modal centralizado com fundo semi-transparente
  - Foco inicial no botão "Cancelar" para evitar exclusões acidentais
  - Opção de fechar o diálogo clicando fora dele ou pressionando Escape

### Estados de Carregamento

- **Carregamento Global**: Spinner centralizado ou barra de progresso ao carregar páginas inteiras
- **Carregamento de Componente**: Indicadores inline para áreas de conteúdo específicas
- **Carregamento de Botão**: Mudança de estado ou spinner dentro do botão durante o processamento da ação
- **Telas de Esqueleto**: Elementos de espaço reservado cinza durante o carregamento de conteúdo
- **Carregamento de Rolagem Infinita**:
  - Pequeno spinner centralizado no fundo da lista
  - Carregamento automático de conteúdo adicional quando o usuário atinge o fundo do viewport
  - Lote inicial de 12 itens para exibição imediata
  - Lotes subsequentes de 8 itens para manter o desempenho
  - Indicador de carregamento claro usando animação de borda
  - Design não intrusivo que não bloqueia a continuação da visualização do conteúdo carregado

### Design Responsivo

- **Breakpoints**:
  - Mobile: 320-639px
  - Tablet: 640-1023px
  - Desktop: 1024px e acima

- **Mudanças de Comportamento**:
  - Sidebar recolhe para apenas ícones em telas menores
  - Layout de duas colunas em tablet (sidebar + conteúdo principal)
  - Layout de três colunas em desktop (sidebar + conteúdo principal + detalhes)
  - Rodapé empilha para coluna única em mobile

### Sistema de Mensagens de Erro

O Beaver v2.0 implementa um sistema de mensagens de erro unificado para garantir consistência na comunicação de problemas aos usuários e facilitar o diagnóstico para desenvolvedores.

#### Mensagens de Erro para Usuários

- **Design Visual**:
  - Fundo: Vermelho leve (#FEE2E2)
  - Borda: Vermelho médio (#EF4444) com espessura de 1px
  - Ícone: Círculo com "X" (#DC2626) posicionado à esquerda
  - Texto de Erro: Preto de alto contraste (#1F2937)
  - Texto de Solução: Cinza escuro (#4B5563)
  - Raio de Borda: 6px
  - Padding: 16px
  - Margens: 16px superior/inferior

- **Estrutura da Mensagem**:
  - Título claro e conciso começando com "Erro:"
  - Descrição do problema em linguagem simples
  - Sugestão específica de resolução quando possível
  - Botão de fechar (X) sempre presente no canto superior direito
  - Código de erro técnico de referência (formato: ERR-XXXX-YY-ZZ) discreto no canto inferior direito

- **Comportamento**:
  - Posicionamento: Topo da página para erros globais, próximo ao campo problemático para erros de formulário
  - Duração: Erros globais permanecem até serem fechados pelo usuário
  - Animação: Fade-in suave (0.3s ease-in) na aparição
  - Prioridade: Apenas uma mensagem de erro global exibida por vez
  - Dispensabilidade: Todas as mensagens podem ser fechadas pelo usuário

- **Categorias de Erro**:
  - **Validação**: Entrada do usuário inválida (formulários)
  - **Autenticação**: Problemas de login/permissão
  - **Conexão**: Problemas de rede/API
  - **Operação**: Falha em ações do sistema (salvar, excluir, etc.)
  - **Sistema**: Erros internos não esperados

#### Logs Detalhados para Desenvolvedores

Em ambiente de desenvolvimento (`NODE_ENV=development`), o sistema mantém logs detalhados no console do navegador para facilitar a depuração.

- **Estrutura do Log**:
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

- **Convenções de Código de Erro**:
  - Formato: `ERR-XXXX-YY-ZZ`
    - XXXX: Código de módulo (ex.: 4000-4999 para Componentes)
    - YY: Tipo de erro (01: validação, 02: permissão, 03: não encontrado...)
    - ZZ: Origem (UI, API, DB)

- **Integração com Ferramentas**:
  - Logs estruturados como objetos para fácil filtragem no console
  - Suporte a exportação de logs para ferramentas externas
  - Em ambiente de produção, os erros são registrados sem informações sensíveis
  - Hook global de erro para capturar exceções não tratadas

- **Boas Práticas para Desenvolvedores**:
  - Sempre incluir contexto suficiente para reproduzir o problema
  - Nunca registrar senhas, tokens ou dados pessoais sensíveis
  - Usar níveis de log apropriadamente, evitando poluição em produção
  - Garantir que códigos de erro sejam únicos e bem documentados

Este sistema unificado de tratamento de erros garante feedback claro para usuários, mantendo informações de diagnóstico detalhadas para desenvolvedores, acelerando a resolução de problemas e melhorando a experiência geral da plataforma.

## Diretrizes de Acessibilidade

- **Contraste de Cor**: Manter proporção mínima de 4,5:1 entre texto e fundo
- **Estados de Foco**: Indicadores de foco visíveis para navegação por teclado
- **Dimensionamento de Texto**: Suporte ao redimensionamento de texto do navegador até 200%
- **Leitores de Tela**: Garantir que todos os elementos da UI tenham rótulos ARIA apropriados
- **Navegação por Teclado**: Todos os elementos interativos devem ser acessíveis via teclado
- **Alvos de Toque**: Tamanho mínimo de 44px × 44px para interfaces de toque

## Novos Elementos na v2.0

### Componentes de Términos do Glossário

- **Autocomplete de Termos**:
  - Acionado pelo caractere "#" em campos de texto
  - Dropdown de sugestões filtradas conforme digitação
  - Estilo consistente com outros dropdowns do sistema
  - Indicação visual de status do termo (aprovado, rascunho, depreciado)

- **Hover-Cards de Términos**:
  - Acionado ao passar o mouse sobre termos referenciados
  - Card com definição completa e status
  - Aparece após delay de 300ms para evitar ativações acidentais
  - Permanece visível enquanto o cursor estiver sobre o card
  - Estilo consistente com outros elementos de tooltip/popover

### Visualização TRM

- **Navegação Hierárquica**:
  - Visualização em árvore das camadas TRM (Infrastructure, Platform, Application, Shared Services)
  - Indicadores visuais de expansão/colapso
  - Badges coloridos para cada nível TRM
  - Contador de componentes em cada nível/categoria

- **Representação Visual**:
  - Código de cores consistente para cada nível TRM
  - Ícones exclusivos para cada camada
  - Layout de visualização em camadas com relações inter-camadas

### Gerenciamento de Instâncias de Componentes

- **Cards de Instância**:
  - Design similar aos cards de componente, mas com badge de ambiente
  - Indicadores visuais de status operacional
  - Hostname e informações técnicas relevantes
  - Link para componente pai

- **Agrupamento por Ambiente**:
  - Visualização agrupada de instâncias por ambiente
  - Código de cores por ambiente
  - Contadores e estatísticas de resumo
  - Cabeçalhos de seção para cada ambiente

## Apêndice

- **Convenções de Nomenclatura de Arquivo**: Seguir kebab-case para todos os assets de design
- **Controle de Versão**: Documentar todas as alterações de UI no changelog
- **Assets do Sistema de Design**: Link para bibliotecas Figma e repositórios de componentes
- **Recursos de Implementação**: Links para repositórios de código e documentação

---

Este guia de estilo é um documento vivo e será atualizado conforme a plataforma Beaver evolui. Todos os membros da equipe são encorajados a contribuir para seu refinamento e melhoria contínuos. 