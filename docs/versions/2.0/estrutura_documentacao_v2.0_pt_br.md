# Estrutura da Documentação Beaver v2.0

*Última atualização → Junho 2024*

Este documento descreve a estrutura de arquivos e o propósito de cada documento presente na pasta `docs/roadmap/v2.0` do projeto Beaver.

## Visão Geral

A documentação do Beaver v2.0 está organizada em várias categorias de arquivos que abrangem desde a arquitetura geral do sistema até detalhes de implementação específicos. Estes documentos servem como referência técnica para desenvolvedores, arquitetos e outros stakeholders do projeto.

## Arquivos de Arquitetura

| Arquivo | Descrição |
|---------|-----------|
| `Architecture_v2.0_pt_br.md` | Documento principal de arquitetura que descreve a visão geral do sistema, seus componentes, melhorias da versão 2.0, stack tecnológico, e requisitos não-funcionais. |
| `components_Neo4j-between-MariaDB.md` | Detalha a sincronização e relacionamentos entre componentes nos bancos de dados MariaDB (relacional) e Neo4j (grafo). |
| `impacto_aplicacao.md` | Análise do impacto das mudanças da v2.0 na aplicação existente. |

## Requisitos e Especificações

| Arquivo | Descrição |
|---------|-----------|
| `requisitos_beaver_v2.0_pt_br.md` | Lista de requisitos funcionais e não-funcionais para a versão 2.0 do Beaver. |
| `page_details_v2.0_pt_br.md` | Descrição detalhada das páginas e funcionalidades da interface do usuário. |

## Guias de Desenvolvimento

| Arquivo | Descrição |
|---------|-----------|
| `dev_guide_v2.0_pt_br.md` | Guia geral para desenvolvedores com padrões de código, ferramentas e práticas recomendadas. |
| `implementacao_frontend_v2.0_pt_br.md` | Guia específico para implementação do frontend, incluindo estrutura de componentes, gerenciamento de estado e integração com API. |
| `implementacao_backend_v2.0_pt_br.md` | Guia específico para implementação do backend, incluindo estrutura da API, autenticação e comunicação com bancos de dados. |

## Banco de Dados

| Arquivo | Descrição |
|---------|-----------|
| `mariadb_schema_v2.0_pt_br.md` | Documentação do schema do MariaDB, incluindo tabelas, campos, relacionamentos e índices. |
| `mariadb_script_full_v2.0.sql` | Script SQL completo para criação do banco de dados MariaDB do zero. |
| `neo4j_schema_v2.0_pt_br.md` | Documentação do schema do Neo4j, incluindo nós, relacionamentos, propriedades e consultas comuns. |
| `neo4j_schema_script_v2.0.txt` | Script Cypher para criação do schema do Neo4j. |

## UI/UX

| Arquivo | Descrição |
|---------|-----------|
| `ui_ux_style_guide_pt_br.md` | Guia de estilo de interface do usuário com padrões visuais, componentes, tipografia e cores. |
| `sidebar_layout_v2.0_pt_br.md` | Especificação detalhada do layout da barra lateral de navegação. |

## Organização de Versionamento

Os documentos seguem um padrão de nomenclatura consistente:
- `nome_do_arquivo_v2.0_pt_br.md` - Indica que o documento se refere à versão 2.0 e está em português brasileiro
- Todos os arquivos incluem uma data de última atualização no cabeçalho

## Uso da Documentação

Recomenda-se iniciar a leitura pelos seguintes documentos, nesta ordem:

1. `Architecture_v2.0_pt_br.md` - Para entender a visão geral da arquitetura
2. `requisitos_beaver_v2.0_pt_br.md` - Para compreender os requisitos do sistema
3. `page_details_v2.0_pt_br.md` - Para conhecer as funcionalidades da interface do usuário
4. `dev_guide_v2.0_pt_br.md` - Para entender as práticas de desenvolvimento

Os demais documentos podem ser consultados conforme necessidade específica para implementação ou manutenção de componentes do sistema.

## Controle de Versão

A documentação faz parte do controle de versão do projeto e deve ser mantida atualizada a cada mudança significativa no código. Alterações nos documentos devem ser incluídas nos commits relevantes que implementam as funcionalidades ou mudanças descritas.

## Conclusão

Esta estrutura de documentação foi projetada para fornecer uma visão abrangente do sistema Beaver v2.0, facilitando o entendimento e a implementação por parte da equipe de desenvolvimento. Recomenda-se que qualquer nova funcionalidade ou alteração seja devidamente documentada seguindo o mesmo padrão e estrutura. 