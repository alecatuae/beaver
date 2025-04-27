import { Driver, Session, Record, QueryResult } from 'neo4j-driver';
import { logger } from '../utils/logger';

export class Neo4jClient {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Verifica a conectividade com o banco de dados Neo4j
   */
  async verifyConnectivity(): Promise<void> {
    await this.driver.verifyConnectivity();
  }

  /**
   * Fecha a conexão com o Neo4j
   */
  async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Executa uma consulta Cypher no banco de dados
   * @param cypher Consulta Cypher a ser executada
   * @param params Parâmetros da consulta
   * @returns Resultado da consulta
   */
  async run<T = any>(cypher: string, params?: any): Promise<T[]> {
    const session: Session = this.driver.session();
    
    try {
      const result: QueryResult = await session.run(cypher, params);
      
      return result.records.map((record) => {
        const obj: any = {};
        
        record.keys.forEach((key) => {
          const value = record.get(key);
          
          // Se for um nó Neo4j, extrai suas propriedades
          if (value && typeof value === 'object' && 'properties' in value) {
            obj[key] = value.properties;
          } else {
            obj[key] = value;
          }
        });
        
        return obj as T;
      });
    } catch (error) {
      logger.error(`Erro ao executar consulta Cypher: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Cria ou atualiza um nó Component no banco de dados
   * @param component Dados do componente
   * @returns O componente criado/atualizado
   */
  async upsertComponent(component: any): Promise<any> {
    const validFrom = component.validFrom || new Date().toISOString();
    const validTo = component.validTo || '9999-12-31T23:59:59Z';

    // Query para criar ou atualizar um componente
    const query = `
      MERGE (c:Component {id: $id})
      ON CREATE SET 
        c.name = $name,
        c.description = $description,
        c.valid_from = datetime($validFrom),
        c.valid_to = datetime($validTo)
      ON MATCH SET
        c.name = $name,
        c.description = $description,
        c.valid_from = datetime($validFrom),
        c.valid_to = datetime($validTo)
      RETURN c
    `;

    const result = await this.run(query, {
      id: component.id,
      name: component.name,
      description: component.description,
      validFrom,
      validTo
    });

    return result[0]?.c;
  }

  /**
   * Cria uma relação entre dois nós no Neo4j
   * @param sourceId ID do nó de origem
   * @param targetId ID do nó de destino
   * @param relationType Tipo de relação
   * @param properties Propriedades adicionais da relação
   * @returns A relação criada
   */
  async createRelationship(
    sourceId: number,
    targetId: number,
    relationType: string,
    properties: any = {}
  ): Promise<any> {
    const validRelationTypes = [
      'DEPENDS_ON', 'CONNECTS_TO', 'RUNS_ON', 
      'STORES_DATA_IN', 'CONTAINS', 'PROTECTS', 'HAS_DECISION'
    ];

    if (!validRelationTypes.includes(relationType)) {
      throw new Error(`Tipo de relação inválido: ${relationType}`);
    }

    const query = `
      MATCH (source), (target)
      WHERE source.id = $sourceId AND target.id = $targetId
      CREATE (source)-[r:${relationType} $properties]->(target)
      RETURN r
    `;

    const result = await this.run(query, {
      sourceId,
      targetId,
      properties
    });

    return result[0]?.r;
  }

  /**
   * Busca componentes no Neo4j com filtros opcionais
   * @param filters Filtros para a busca
   * @returns Lista de componentes
   */
  async findComponents(filters: any = {}): Promise<any[]> {
    let whereClause = '';
    const params: any = {};

    // Constrói a cláusula WHERE com base nos filtros
    if (Object.keys(filters).length > 0) {
      const conditions: string[] = [];

      if (filters.name) {
        conditions.push('c.name CONTAINS $name');
        params.name = filters.name;
      }

      if (filters.validAt) {
        conditions.push('datetime($validAt) >= c.valid_from AND datetime($validAt) <= c.valid_to');
        params.validAt = filters.validAt;
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }
    }

    const query = `
      MATCH (c:Component)
      ${whereClause}
      RETURN c
      ORDER BY c.name
    `;

    return this.run(query, params);
  }

  /**
   * Exclui um nó e todas as suas relações do banco de dados
   * @param label Rótulo do nó (ex: Component)
   * @param id ID do nó a ser excluído
   * @returns Resultado da operação
   */
  async deleteNode(label: string, id: number): Promise<any> {
    const query = `
      MATCH (n:${label} {id: $id})
      OPTIONAL MATCH (n)-[r]-()
      DELETE r, n
    `;

    return this.run(query, { id });
  }
} 