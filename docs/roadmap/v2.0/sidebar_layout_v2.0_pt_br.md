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
   - Função: Acesso à visualização interativa do grafo de arquitetura empresarial
   - Recursos na v2.0:
     - Filtros por ambiente, domínio, time e criticidade
     - Visualização de instâncias específicas de componentes
     - Suporte a consultas temporais via `valid_from` e `valid_to`
     - **Novo**: Visualização de relações entre times e componentes sob responsabilidade
     - **Novo**: Filtro por camadas do TRM (Infrastructure, Platform, Application, Shared Services)

3. **ADR Management (Gerenciamento de ADRs)**
   - Ícone: Documento/Página
   - Função: Gerenciamento de Registros de Decisão Arquitetural
   - Recursos na v2.0:
     - Sistema de participantes múltiplos (owner, reviewer, consumer)
     - Validação automática garantindo pelo menos um participante com papel "owner"
     - Capacidades de diff visual e rollback
     - Referência a termos do Glossário usando "#termo" com autocomplete e hover-cards

4. **Impact Workflow (Fluxo de Trabalho de Impacto)**
   - Ícone: Nuvem com setas circulares (sincronização)
   - Função: Gestão de mudanças arquiteturais e análise de impacto
   - Recursos na v2.0:
     - Análise de impacto em instâncias específicas de componentes por ambiente
     - Cálculo e exibição do impacto por ambiente antes do merge
     - Trilha de auditoria detalhada para cada etapa do fluxo
     - Rollback automático para ADR anterior (status Superseded)

5. **Glossário**
   - Ícone: Livro aberto
   - Função: Dicionário de termos padronizados da organização
   - Recursos na v2.0:
     - Status de termos (draft, approved, deprecated)
     - Autocompletar termos com "#tag" em todos os formulários
     - Realce visual de termos referenciados em textos de ADRs
     - Interface de administração para aprovação e depreciação de termos
     - Histórico de alterações com versionamento de definições

6. **Components Management (Gerenciamento de Componentes)**
   - Ícone: Cubo 3D
   - Estado: Menu expansível (seta para baixo quando fechado, expandido na imagem)
   - Submenus exibidos quando expandido:
     - **Components**: Gerenciamento de componentes lógicos
     - **Categories**: Categorias hierárquicas organizadas pelo TRM
     - **Relationship**: Relacionamentos entre componentes
   - Novos recursos na v2.0:
     - Associação a times responsáveis por componentes
     - Suporte a estados 'planned', 'active', 'deprecated'
     - Categorização hierárquica via TRM (Technical Reference Model)
     - Visualização e gestão de instâncias por ambiente

7. **Team Management (Gerenciamento de Times)**
   - Ícone: Duas pessoas/Usuários
   - Função: Gestão de times organizacionais e suas responsabilidades
   - Recursos na v2.0:
     - Associação de usuários a times com rastreamento de data de ingresso
     - Visualização dos componentes sob responsabilidade de cada time
     - Dashboard resumido de atividades por time
     - Interface de arraste-e-solte para associação de usuários
     - Matriz de responsabilidades RACI para componentes

8. **System Settings (Configurações do Sistema)**
   - Ícone: Engrenagem
   - Função: Configurações globais e administrativas da aplicação
   - Recursos na v2.0:
     - Gerenciamento de ambientes de implantação
     - Configuração de tipos de roadmap personalizáveis
     - Controle de preferências de visualização do grafo
     - Configurações de segurança e políticas de acesso
     - Opções de backup e retenção de dados

9. **Logs**
   - Ícone: Gráfico de barras/Estatísticas
   - Função: Visualização e análise dos logs do sistema
   - Recursos na v2.0:
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

## Funcionalidades Adicionais não Visíveis no Sidebar Atual

As seguintes funcionalidades importantes da v2.0 estão atualmente integradas a outras seções do menu, mas poderiam ser adicionadas como itens separados de acordo com as necessidades dos usuários:

1. **Environment Management (Gerenciamento de Ambientes)**
   - Atualmente: Integrado ao System Settings
   - Função: Gestão centralizada dos ambientes onde componentes são implantados
   - Recursos principais:
     - CRUD de ambientes personalizáveis
     - Configuração de ordem de promoção entre ambientes
     - Dashboard de status consolidado por ambiente

2. **Instance Management (Gerenciamento de Instâncias)**
   - Atualmente: Acessível via Components
   - Função: Gestão de instâncias específicas (Component_Instance) em diferentes ambientes
   - Recursos principais:
     - Especificações técnicas em formato JSON flexível
     - Visualização de timeline de implantações
     - Associação de ADRs a instâncias específicas com níveis de impacto

3. **Backlog Unificado**
   - Atualmente: Pode ser acessado via menu de navegação superior
   - Função: Planejamento integrado para equipes de desenvolvimento e infraestrutura
   - Recursos principais:
     - Tipos de itens personalizáveis via tabela RoadmapType
     - Visualização em formato Kanban e timeline
     - Agrupamento por time, componente ou sprint

## Considerações de Design e Usabilidade

- **Esquema de Cores**: A interface utiliza um tema escuro com destaque em roxo (cor principal da marca)
- **Tipografia**: Fonte sans-serif clara e legível com contraste adequado para acessibilidade
- **Iconografia**: Ícones minimalistas de linha consistentes em todo o sidebar
- **Hierarquia Visual**: 
  - Itens principais de menu com ícones à esquerda e texto à direita
  - Submenus com recuo para indicar relação hierárquica
  - Item atual destacado com barra lateral roxa
- **Responsividade**: O sidebar pode ser recolhido para maximizar a área útil da tela, com suporte a dispositivos móveis
- **Navegação**: O botão de retração visível no canto superior direito permite expandir/retrair o sidebar

## Implementação Técnica

- Construído com componentes React e estilizado com TailwindCSS
- Ícones da biblioteca Lucide React
- Gerenciamento de estado para expansão/retração de submenus
- Armazenamento de preferências do usuário em localStorage
- Suporte a navegação por teclado para acessibilidade

## Conclusão

O sidebar do Beaver v2.0 proporciona acesso intuitivo às novas funcionalidades implementadas, especialmente o TRM (Technical Reference Model), o gerenciamento de instâncias de componentes em diferentes ambientes, e o sistema aprimorado de ADRs com suporte a referência de termos do Glossário. A organização hierárquica e a navegação clara ajudam os usuários a localizar rapidamente as ferramentas necessárias para gerenciar eficientemente a arquitetura empresarial.

A estrutura pode ser adaptada conforme a implementação avança, possivelmente reorganizando itens baseados no feedback dos usuários ou adicionando novas seções conforme necessário. 