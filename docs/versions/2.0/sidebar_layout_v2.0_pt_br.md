# Layout do Sidebar - Beaver v2.0
*Última atualização → Junho 2024*

---

## Visão Geral

O sidebar do Beaver v2.0 foi redesenhado para acomodar as novas funcionalidades e melhorar a navegação do usuário. A estrutura hierárquica do menu permite acesso rápido às principais funcionalidades do sistema, refletindo as melhorias implementadas na versão 2.0, especialmente o suporte ao TRM (Technical Reference Model) e ao gerenciamento de instâncias de componentes em diferentes ambientes.

## Estrutura do Sidebar

### Logo e Marca
- **Logo Beaver**: Ícone quadrado roxo com a letra "B" (posicionado no canto superior esquerdo)
- **Nome da Aplicação**: "Beaver" exibido à direita do logo em tipografia clara

### Itens de Menu Principal

1. **Home**
   - Ícone: Grade com quatro quadrados
   - Função: Dashboard inicial com visão geral das estatísticas e atividades recentes
   - Destaque visual: Barra lateral roxa indicando a página atual quando selecionada
   - Posição atual: Primeiro item do menu principal

2. **Arch Overview (Visão Geral da Arquitetura)**
   - Ícone: Livros/Biblioteca (estante)
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Acesso à visualização interativa do grafo de arquitetura empresarial
   - Submenus:
     - **Graph View**: Visualização principal do grafo de arquitetura
     - **TRM View**: Visualização organizada por camadas do TRM
     - **Timeline View**: Visualização temporal de mudanças arquiteturais
   - Recursos:
     - Filtros por ambiente, domínio, time e criticidade
     - Visualização de instâncias específicas de componentes
     - Suporte a consultas temporais via `valid_from` e `valid_to`
     - Visualização de relações entre times e componentes sob responsabilidade
     - Filtro por camadas do TRM (Infrastructure, Platform, Application, Shared Services)

3. **ADR Management (Gerenciamento de ADRs)**
   - Ícone: Documento/Página
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Gerenciamento de Registros de Decisão Arquitetural
   - Submenus:
     - **ADR List**: Lista de todos os ADRs
     - **My ADRs**: ADRs associados ao usuário atual
     - **ADR Templates**: Templates para criação de novos ADRs
   - Recursos:
     - Sistema de participantes múltiplos (owner, reviewer, consumer)
     - Validação automática garantindo pelo menos um participante com papel "owner"
     - Capacidades de diff visual e rollback
     - Referência a termos do Glossário usando "#termo" com autocomplete e hover-cards

4. **Impact Workflow (Fluxo de Trabalho de Impacto)**
   - Ícone: Nuvem com setas circulares (sincronização)
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Gestão de mudanças arquiteturais e análise de impacto
   - Submenus:
     - **Impact Analysis**: Análise de impacto de mudanças
     - **Pending Reviews**: Solicitações pendentes de revisão
     - **Change History**: Histórico de alterações aplicadas
   - Recursos:
     - Análise de impacto em instâncias específicas de componentes por ambiente
     - Cálculo e exibição do impacto por ambiente antes do merge
     - Trilha de auditoria detalhada para cada etapa do fluxo
     - Rollback automático para ADR anterior (status Superseded)

5. **Glossário**
   - Ícone: Livro aberto
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Dicionário de termos padronizados da organização
   - Submenus:
     - **Term List**: Lista completa de termos
     - **Term Admin**: Administração e aprovação de termos
     - **Categories**: Categorias de termos
   - Recursos:
     - Status de termos (draft, approved, deprecated)
     - Autocompletar termos com "#tag" em todos os formulários
     - Realce visual de termos referenciados em textos de ADRs
     - Interface de administração para aprovação e depreciação de termos
     - Histórico de alterações com versionamento de definições

6. **Components Management (Gerenciamento de Componentes)**
   - Ícone: Cubo 3D
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Gerenciamento de componentes lógicos e suas relações
   - Submenus:
     - **Components**: Gerenciamento de componentes lógicos
     - **Categories**: Categorias hierárquicas organizadas pelo TRM
     - **Relationship**: Relacionamentos entre componentes
     - **Instances**: Instâncias específicas de componentes
   - Recursos:
     - Associação a times responsáveis por componentes
     - Suporte a estados 'planned', 'active', 'deprecated'
     - Categorização hierárquica via TRM (Technical Reference Model)
     - Visualização e gestão de instâncias por ambiente

7. **Team Management (Gerenciamento de Times)**
   - Ícone: Duas pessoas/Usuários
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Gestão de times organizacionais e suas responsabilidades
   - Submenus:
     - **Teams**: Lista e gerenciamento de times
     - **Members**: Gerenciamento de membros e associações
     - **Responsibilities**: Matriz RACI de responsabilidades
     - **Team Dashboard**: Métricas e atividades por time
   - Recursos:
     - Associação de usuários a times com rastreamento de data de ingresso
     - Visualização dos componentes sob responsabilidade de cada time
     - Dashboard resumido de atividades por time
     - Interface de arraste-e-solte para associação de usuários
     - Matriz de responsabilidades RACI para componentes

8. **Environment Management (Gerenciamento de Ambientes)**
   - Ícone: Servidor/Nuvem
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Gestão centralizada dos ambientes onde componentes são implantados
   - Submenus:
     - **Environments**: Lista e configuração de ambientes
     - **Deployment Flow**: Fluxo de promoção entre ambientes
     - **Status Dashboard**: Status consolidado por ambiente
   - Recursos:
     - CRUD de ambientes personalizáveis
     - Configuração de ordem de promoção entre ambientes
     - Dashboard de status consolidado por ambiente

9. **Backlog Unificado**
   - Ícone: Lista de tarefas/Kanban
   - Estado: Menu expansível (seta para baixo quando fechado)
   - Função: Planejamento integrado para equipes de desenvolvimento e infraestrutura
   - Submenus:
     - **Kanban Board**: Visualização em quadro Kanban
     - **Timeline**: Visualização em linha do tempo
     - **Roadmap Types**: Configuração de tipos de itens
   - Recursos:
     - Tipos de itens personalizáveis via tabela RoadmapType
     - Visualização em formato Kanban e timeline
     - Agrupamento por time, componente ou sprint

10. **Admin & Settings (Administração e Configurações)**
    - Ícone: Engrenagem
    - Estado: Menu expansível (seta para baixo quando fechado)
    - Função: Configurações administrativas e gestão do sistema
    - Submenus:
      - **User Management**: Gestão de usuários e permissões
      - **System Configuration**: Configurações globais do sistema
      - **UI Preferences**: Preferências de interface do usuário
      - **Security**: Configurações de segurança e acesso
      - **Backup & Retention**: Configurações de backup e retenção de dados
    - Recursos:
      - Gerenciamento de usuários e permissões
      - Configurações de interface e preferências
      - Definições de segurança e políticas de acesso
      - Configurações de backup e retenção de dados
      - Parâmetros globais do sistema

11. **Logs & Monitoring (Logs e Monitoramento)**
    - Ícone: Gráfico de barras/Estatísticas
    - Estado: Menu expansível (seta para baixo quando fechado)
    - Função: Visualização e análise dos logs e métricas do sistema
    - Submenus:
      - **System Logs**: Logs de sistema e atividades
      - **Audit Logs**: Logs de auditoria para compliance
      - **Performance Metrics**: Métricas de desempenho
      - **Reports**: Relatórios e exportações
    - Recursos:
      - Níveis de log (info, warn, error)
      - Metadados em formato JSON para dados de auditoria detalhados
      - Filtros avançados para análise de segurança e atividades
      - Exportação de logs para relatórios de auditoria

### Alternador de Tema

- **Alternar tema** (Toggle theme)
   - Ícone: Lua (para o modo escuro atual)
   - Posição: Parte inferior do sidebar
   - Função: Alterna entre tema escuro (atual) e claro
   - Implementação: Utiliza o componente ThemeProvider do Next.js

## Considerações de Design e Usabilidade

- **Esquema de Cores**: A interface utiliza um tema escuro com destaque em roxo (cor principal da marca)
- **Tipografia**: Fonte sans-serif clara e legível com contraste adequado para acessibilidade
- **Iconografia**: Ícones minimalistas de linha consistentes em todo o sidebar
- **Hierarquia Visual**: 
  - Itens principais de menu com ícones à esquerda e texto à direita
  - Submenus com recuo (16px) para indicar relação hierárquica
  - Item atual destacado com barra lateral roxa
- **Responsividade**: O sidebar pode ser recolhido para maximizar a área útil da tela, com suporte a dispositivos móveis
- **Navegação**: O botão de retração visível no canto superior direito permite expandir/retrair o sidebar
- **Interação de Submenu**: 
  - Clique no item principal expande/recolhe os submenus
  - Estado de expansão é mantido durante a sessão do usuário
  - Animação suave na transição de expansão/retração

## Implementação Técnica

- Construído com componentes React e estilizado com TailwindCSS
- Ícones da biblioteca Lucide React
- Gerenciamento de estado para expansão/retração de submenus
- Armazenamento de preferências do usuário em localStorage
- Suporte a navegação por teclado para acessibilidade
- Sistema de rotas integrado com Next.js

## Conclusão

O sidebar do Beaver v2.0 proporciona acesso intuitivo às novas funcionalidades implementadas, especialmente o TRM (Technical Reference Model), o gerenciamento de instâncias de componentes em diferentes ambientes, e o sistema aprimorado de ADRs com suporte a referência de termos do Glossário. A organização hierárquica com submenus claramente definidos permite que os usuários naveguem facilmente entre funcionalidades relacionadas, melhorando a experiência geral de uso.

A estrutura pode ser adaptada conforme feedback dos usuários durante a implementação. 