import { Driver, Session, Record as Neo4jRecord } from 'neo4j-driver';
import { logger } from '../utils/logger';

// Interface dos relacionamentos
export interface IRelation {
  id: number | string;
  sourceId: number;
  targetId: number;
  type: string;
  properties?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class Neo4jClient {
  private driver: Driver;
  public mockMode: boolean = false;

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

  async getGraphData(depth: number = 2): Promise<any> {
    const query = `
      MATCH path = (n)-[*0..${depth}]->(m)
      RETURN path
    `;
    return this.run(query);
  }

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

  // Obter todos os relacionamentos
  async getRelations(): Promise<IRelation[]> {
    if (this.mockMode) {
      return this.getMockRelations();
    }

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
        // Convertemos o id para string para evitar problemas com IDs grandes
        const idValue = record.get('id');
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

  // Obter um relacionamento pelo ID
  async getRelationById(id: number): Promise<IRelation | null> {
    if (this.mockMode) {
      return this.getMockRelationById(id);
    }

    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (source)-[r]->(target)
        WHERE id(r) = $id
        RETURN 
          toString(id(r)) AS id, 
          type(r) AS type, 
          source.id AS sourceId, 
          target.id AS targetId,
          r.properties AS properties,
          r.createdAt AS createdAt,
          r.updatedAt AS updatedAt
      `, { id });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const idValue = record.get('id');
      return {
        id: idValue,
        type: record.get('type'),
        sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
        targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
        properties: record.get('properties') || {},
        createdAt: record.get('createdAt') ? new Date(record.get('createdAt')) : new Date(),
        updatedAt: record.get('updatedAt') ? new Date(record.get('updatedAt')) : new Date()
      };
    } catch (error) {
      logger.error(`Erro ao obter relacionamento com ID ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // Criar um novo relacionamento
  async createRelation(
    sourceId: number,
    targetId: number,
    type: string,
    properties: any = {}
  ): Promise<IRelation> {
    if (this.mockMode) {
      return this.createMockRelation(sourceId, targetId, type, properties);
    }

    const session = this.driver.session();
    try {
      const now = new Date().toISOString();
      const result = await session.run(`
        MATCH (source:Component {id: $sourceId})
        MATCH (target:Component {id: $targetId})
        CREATE (source)-[r:${type} {properties: $properties, createdAt: $now, updatedAt: $now}]->(target)
        RETURN 
          toString(id(r)) AS id, 
          type(r) AS type, 
          source.id AS sourceId, 
          target.id AS targetId,
          r.properties AS properties,
          r.createdAt AS createdAt,
          r.updatedAt AS updatedAt
      `, { sourceId, targetId, properties, now });

      if (result.records.length === 0) {
        throw new Error('Falha ao criar relacionamento');
      }

      const record = result.records[0];
      const idValue = record.get('id');
      return {
        id: idValue,
        type: record.get('type'),
        sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
        targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
        properties,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    } catch (error) {
      logger.error('Erro ao criar relacionamento:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // Atualizar um relacionamento existente
  async updateRelation(
    id: number,
    sourceId: number,
    targetId: number,
    type: string,
    properties: any = {}
  ): Promise<IRelation> {
    if (this.mockMode) {
      return this.updateMockRelation(id, sourceId, targetId, type, properties);
    }

    const session = this.driver.session();
    try {
      // Primeiro, excluímos o relacionamento existente
      await session.run(`
        MATCH ()-[r]->()
        WHERE id(r) = $id
        DELETE r
      `, { id });

      // Em seguida, criamos um novo relacionamento com os mesmos dados
      const now = new Date().toISOString();
      const result = await session.run(`
        MATCH (source:Component {id: $sourceId})
        MATCH (target:Component {id: $targetId})
        CREATE (source)-[r:${type} {properties: $properties, createdAt: $createdAt, updatedAt: $now}]->(target)
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
        properties,
        // Preservamos a data de criação original se existir
        createdAt: (await this.getRelationById(id))?.createdAt.toISOString() || now,
        now 
      });

      if (result.records.length === 0) {
        throw new Error('Falha ao atualizar relacionamento');
      }

      const record = result.records[0];
      const idValue = record.get('id');
      return {
        id: idValue,
        type: record.get('type'),
        sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
        targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
        properties,
        createdAt: new Date(record.get('createdAt')),
        updatedAt: new Date(now)
      };
    } catch (error) {
      logger.error(`Erro ao atualizar relacionamento ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // Excluir um relacionamento
  async deleteRelation(id: number | string): Promise<boolean> {
    if (this.mockMode) {
      return this.deleteMockRelation(typeof id === 'string' ? parseInt(id) : id);
    }

    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH ()-[r]->()
        WHERE id(r) = $id
        DELETE r
        RETURN count(r) as count
      `, { id });

      return result.records[0].get('count').toNumber() > 0;
    } catch (error) {
      logger.error(`Erro ao excluir relacionamento ${id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // --- Mock methods para testes e desenvolvimento ---
  
  private mockRelations: IRelation[] = [
    {
      id: 1,
      sourceId: 1, // Frontend
      targetId: 2, // API
      type: 'CONNECTS_TO',
      properties: { description: 'Frontend se conecta à API' },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      sourceId: 2, // API
      targetId: 3, // Database
      type: 'DEPENDS_ON',
      properties: { description: 'API depende do Banco de Dados' },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private getMockRelations(): IRelation[] {
    return this.mockRelations;
  }

  private getMockRelationById(id: number): IRelation | null {
    return this.mockRelations.find(r => r.id === id) || null;
  }

  private createMockRelation(
    sourceId: number,
    targetId: number,
    type: string,
    properties: any = {}
  ): IRelation {
    const now = new Date();
    const newRelation: IRelation = {
      id: this.mockRelations.length + 1,
      sourceId,
      targetId,
      type,
      properties,
      createdAt: now,
      updatedAt: now
    };

    this.mockRelations.push(newRelation);
    return newRelation;
  }

  private updateMockRelation(
    id: number,
    sourceId: number,
    targetId: number,
    type: string,
    properties: any = {}
  ): IRelation {
    const index = this.mockRelations.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Relacionamento com ID ${id} não encontrado`);
    }

    const now = new Date();
    const updatedRelation: IRelation = {
      ...this.mockRelations[index],
      sourceId,
      targetId,
      type,
      properties,
      updatedAt: now
    };

    this.mockRelations[index] = updatedRelation;
    return updatedRelation;
  }

  private deleteMockRelation(id: number): boolean {
    const initialLength = this.mockRelations.length;
    this.mockRelations = this.mockRelations.filter(r => r.id !== id);
    return initialLength > this.mockRelations.length;
  }
}

// Exportando a classe Neo4jClient
export default Neo4jClient; 