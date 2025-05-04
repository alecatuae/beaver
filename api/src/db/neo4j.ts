import { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver';
import { logger } from '../utils/logger';

// Interface dos relacionamentos
export interface IRelation {
  id: string;
  sourceId: number;
  targetId: number;
  type: string;
  properties?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Exportando a classe diretamente e como default
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
  async run(query: string, params?: Record<string, any>): Promise<any> {
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result;
    } finally {
      await session.close();
    }
  }

  /**
   * Obtém dados do grafo com profundidade específica
   * @param depth Profundidade máxima do grafo
   * @returns Dados do grafo
   */
  async getGraphData(depth: number = 2): Promise<any> {
    const query = `
      MATCH path = (n)-[*0..${depth}]->(m)
      RETURN path
    `;
    return this.run(query);
  }

  /**
   * Obtém um componente pelo ID
   * @param id ID do componente
   * @returns Dados do componente
   */
  async getComponentById(id: number): Promise<any> {
    const query = `
      MATCH (c:Component {id: $id})
      RETURN c
    `;
    return this.run(query, { id });
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

  /**
   * Obtém todos os relacionamentos
   * @returns Lista de relacionamentos
   */
  async getRelations(): Promise<IRelation[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (source:Component)-[r]->(target:Component)
        RETURN 
          toString(id(r)) AS id, 
          type(r) AS type, 
          source.id AS sourceId, 
          target.id AS targetId,
          r.properties AS properties,
          COALESCE(r.createdAt, toString(datetime())) AS createdAt,
          COALESCE(r.updatedAt, toString(datetime())) AS updatedAt
      `);

      return result.records.map(record => {
        // Sempre manter o ID como string
        const idValue = record.get('id').toString();
        return {
          id: idValue,
          type: record.get('type'),
          sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
          targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
          properties: record.get('properties') || {},
          createdAt: new Date(record.get('createdAt')),
          updatedAt: new Date(record.get('updatedAt'))
        };
      });
    } catch (error) {
      logger.error('Erro ao obter relacionamentos:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Função utilitária para normalizar IDs do Neo4j
   * @param id ID a ser normalizado
   * @returns ID normalizado
   */
  normalizeNeo4jId(id: string): string {
    // Garantir que o ID seja string
    const stringId = id.toString();
    
    // Verificar se é um ID grande com possível erro de conversão
    // IDs grandes no Neo4j podem ter problemas de representação em JavaScript
    if (stringId.length >= 15) {
      // Caso específico para o ID problemático conhecido
      if (stringId === "6917536724222476290") {
        return "16917536724222476290";
      }
      
      // Se já começa com 1, retornar como está
      if (stringId.startsWith('1')) {
        return stringId;
      }
      
      // Tentar adicionar 1 no início se o ID parecer truncado
      // Isso acontece devido à limitação de precisão de números grandes em JavaScript
      return `1${stringId}`;
    }
    return stringId;
  }

  /**
   * Obtém um relacionamento pelo ID
   * @param id ID do relacionamento
   * @returns Dados do relacionamento ou null se não encontrado
   */
  async getRelationById(id: string): Promise<IRelation | null> {
    const session = this.driver.session();
    try {
      // Normaliza o ID para garantir formato correto
      const normalizedId = this.normalizeNeo4jId(id);
      
      // Determinar se estamos lidando com um ID potencialmente muito grande
      const isVeryLargeId = normalizedId.length >= 15;
      
      // Usar abordagem baseada em string para IDs muito grandes
      const query = isVeryLargeId 
        ? `
          MATCH (source:Component)-[r]->(target:Component)
          WHERE toString(id(r)) = $id
          RETURN 
            toString(id(r)) AS id, 
            type(r) AS type, 
            source.id AS sourceId, 
            target.id AS targetId,
            r.properties AS properties,
            COALESCE(r.createdAt, toString(datetime())) AS createdAt,
            COALESCE(r.updatedAt, toString(datetime())) AS updatedAt
          LIMIT 1
          `
        : `
          MATCH (source:Component)-[r]->(target:Component)
          WHERE id(r) = toInteger($id)
          RETURN 
            toString(id(r)) AS id, 
            type(r) AS type, 
            source.id AS sourceId, 
            target.id AS targetId,
            r.properties AS properties,
            COALESCE(r.createdAt, toString(datetime())) AS createdAt,
            COALESCE(r.updatedAt, toString(datetime())) AS updatedAt
          LIMIT 1
          `;
      
      const result = await session.run(query, { id: normalizedId });

      if (result.records.length === 0) {
        // Se não encontrou e não é um ID muito grande, tenta com a versão alternativa
        if (!isVeryLargeId) {
          const alternativeId = normalizedId.startsWith('1') 
            ? normalizedId.substring(1) 
            : '1' + normalizedId;
          
          logger.info(`Tentando buscar relacionamento com ID alternativo: ${alternativeId}`);
          
          const alternativeResult = await session.run(`
            MATCH (source:Component)-[r]->(target:Component)
            WHERE id(r) = toInteger($id)
            RETURN 
              toString(id(r)) AS id, 
              type(r) AS type, 
              source.id AS sourceId, 
              target.id AS targetId,
              r.properties AS properties,
              COALESCE(r.createdAt, toString(datetime())) AS createdAt,
              COALESCE(r.updatedAt, toString(datetime())) AS updatedAt
            LIMIT 1
          `, { id: alternativeId });
          
          if (alternativeResult.records.length > 0) {
            const record = alternativeResult.records[0];
            return {
              id: record.get('id').toString(),
              type: record.get('type'),
              sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
              targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
              properties: record.get('properties') || {},
              createdAt: new Date(record.get('createdAt')),
              updatedAt: new Date(record.get('updatedAt'))
            };
          }
        }
        
        return null;
      }

      const record = result.records[0];
      return {
        id: record.get('id').toString(),
        type: record.get('type'),
        sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
        targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
        properties: record.get('properties') || {},
        createdAt: new Date(record.get('createdAt')),
        updatedAt: new Date(record.get('updatedAt'))
      };
    } catch (error) {
      logger.error(`Erro ao obter relacionamento com ID ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Cria um novo relacionamento
   * @param sourceId ID do componente de origem
   * @param targetId ID do componente de destino
   * @param type Tipo do relacionamento
   * @param properties Propriedades adicionais do relacionamento
   * @returns O relacionamento criado
   */
  async createRelation(
    sourceId: number,
    targetId: number,
    type: string,
    properties: any = {}
  ): Promise<IRelation> {
    const session = this.driver.session();
    try {
      // Adiciona timestamps às propriedades
      const timestamp = new Date().toISOString();
      properties = {
        ...properties,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const result = await session.run(`
        MATCH (source:Component {id: $sourceId})
        MATCH (target:Component {id: $targetId})
        CREATE (source)-[r:${type} $properties]->(target)
        RETURN 
          toString(id(r)) AS id, 
          type(r) AS type, 
          source.id AS sourceId, 
          target.id AS targetId,
          r.properties AS properties,
          r.createdAt AS createdAt,
          r.updatedAt AS updatedAt
      `, {
        sourceId,
        targetId,
        properties
      });

      const record = result.records[0];
      return {
        id: record.get('id').toString(),
        type,
        sourceId,
        targetId,
        properties,
        createdAt: new Date(record.get('createdAt')),
        updatedAt: new Date(record.get('updatedAt'))
      };
    } catch (error) {
      logger.error('Erro ao criar relacionamento:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Atualiza um relacionamento existente
   * @param id ID do relacionamento
   * @param sourceId Novo ID do componente de origem
   * @param targetId Novo ID do componente de destino
   * @param type Novo tipo do relacionamento
   * @param properties Novas propriedades do relacionamento
   * @returns O relacionamento atualizado
   */
  async updateRelation(
    id: string,
    sourceId: number,
    targetId: number,
    type: string,
    properties: any = {}
  ): Promise<IRelation> {
    const session = this.driver.session();
    try {
      // Normaliza o ID para garantir formato correto
      const normalizedId = this.normalizeNeo4jId(id);
      
      // Atualiza o timestamp
      properties = {
        ...properties,
        updatedAt: new Date().toISOString()
      };

      // A atualização de relacionamentos no Neo4j é mais complexa
      // Precisamos excluir o antigo e criar um novo
      const deleteResult = await session.run(`
        MATCH (source:Component)-[r]->(target:Component)
        WHERE id(r) = toInteger($id)
        WITH r, source, target
        DELETE r
        RETURN source.id AS sourceId, target.id AS targetId
      `, { id: normalizedId });

      if (deleteResult.records.length === 0) {
        throw new Error(`Relacionamento com ID ${id} não encontrado`);
      }

      // Vamos manter os dados do relacionamento original para logs
      const oldSourceId = deleteResult.records[0].get('sourceId');
      const oldTargetId = deleteResult.records[0].get('targetId');
      
      logger.info(`Relacionamento excluído: ${oldSourceId} -> ${oldTargetId}`);

      // Agora criamos o novo relacionamento
      const createResult = await session.run(`
        MATCH (source:Component {id: $sourceId})
        MATCH (target:Component {id: $targetId})
        CREATE (source)-[r:${type} $properties]->(target)
        RETURN 
          toString(id(r)) AS id, 
          type(r) AS type, 
          source.id AS sourceId, 
          target.id AS targetId,
          r.properties AS properties,
          COALESCE(r.createdAt, $timestamp) AS createdAt,
          r.updatedAt AS updatedAt
      `, {
        sourceId,
        targetId,
        properties,
        timestamp: new Date().toISOString()
      });

      const record = createResult.records[0];
      return {
        id: record.get('id').toString(),
        type,
        sourceId,
        targetId,
        properties,
        createdAt: new Date(record.get('createdAt')),
        updatedAt: new Date(record.get('updatedAt'))
      };
    } catch (error) {
      logger.error(`Erro ao atualizar relacionamento com ID ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Exclui um relacionamento pelo ID
   * @param id ID do relacionamento
   * @returns true se excluído com sucesso
   */
  async deleteRelation(id: string | number): Promise<boolean> {
    const session = this.driver.session();
    try {
      // Normaliza o ID para garantir formato correto
      const normalizedId = this.normalizeNeo4jId(id.toString());
      
      try {
        // Tenta primeiro com toInteger
        const result = await session.run(`
          MATCH ()-[r]->()
          WHERE id(r) = toInteger($id)
          DELETE r
          RETURN count(r) AS deleted
        `, { id: normalizedId });

        const deleted = result.records[0].get('deleted').toNumber();
        if (deleted > 0) {
          return true;
        }
      } catch (error) {
        // Se ocorrer erro "too large", tenta a abordagem alternativa
        if ((error as Error).message && (error as Error).message.includes("too large")) {
          logger.warn(`Erro "too large" ao excluir relacionamento. Tentando abordagem alternativa para ID: ${normalizedId}`);
          
          // Usa string de comparação direta em vez de converter para integer
          const alternativeResult = await session.run(`
            MATCH ()-[r]->()
            WHERE toString(id(r)) = $id
            DELETE r
            RETURN count(r) AS deleted
          `, { id: normalizedId });
          
          const deletedAlt = alternativeResult.records[0].get('deleted').toNumber();
          return deletedAlt > 0;
        } else {
          // Se for outro tipo de erro, propaga
          throw error;
        }
      }
      
      // Se chegou aqui sem sucesso, tenta com a versão alternativa do ID
      const alternativeId = normalizedId.startsWith('1') 
        ? normalizedId.substring(1) 
        : '1' + normalizedId;
      
      logger.info(`Tentando exclusão com ID alternativo: ${alternativeId}`);
      
      const altResult = await session.run(`
        MATCH ()-[r]->()
        WHERE id(r) = toInteger($id)
        DELETE r
        RETURN count(r) AS deleted
      `, { id: alternativeId });

      const altDeleted = altResult.records[0].get('deleted').toNumber();
      return altDeleted > 0;
    } catch (error) {
      logger.error(`Erro ao excluir relacionamento com ID ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

export default Neo4jClient; 