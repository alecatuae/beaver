// Script para migração do banco de dados para a versão 2.0
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Iniciando migração para Beaver v2.0...');
  
  try {
    // Fazer backup do banco antes de iniciar
    console.log('Fazendo backup do banco de dados...');
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    execSync(`docker exec mariadb sh -c "mariabackup --backup --user=root --password=root --target-dir=/var/lib/mysql/backup_${backupTimestamp}"`);
    console.log(`Backup criado em /var/lib/mysql/backup_${backupTimestamp}`);
    
    const prisma = new PrismaClient();
    
    try {
      // Gerar a primeira migração para criar as tabelas básicas
      console.log('Fase 1: Gerando migração inicial para novas tabelas...');
      execSync('cd api && npx prisma migrate dev --name add_environments_teams_roadmaptypes --create-only', { stdio: 'inherit' });
      
      // Executar migrações criadas pelo Prisma
      console.log('Aplicando migração inicial...');
      execSync('cd api && npx prisma migrate deploy', { stdio: 'inherit' });
      
      // Executar script manual de conversão
      console.log('Fase 2: Executando script de conversão de dados...');
      const sqlScript = fs.readFileSync(
        path.join(__dirname, '../prisma/migrations/manual/convert_enums_to_tables.sql'),
        'utf8'
      );
      
      // Executar statements individualmente
      const statements = sqlScript
        .split(';')
        .filter(stmt => stmt.trim())
        .map(stmt => stmt.trim() + ';');
      
      for (const stmt of statements) {
        console.log(`Executando: ${stmt.substring(0, 80)}...`);
        await prisma.$executeRawUnsafe(stmt);
      }
      
      // Criar segunda migração para relacionamentos
      console.log('Fase 3: Criando migração para relações entre entidades...');
      execSync('cd api && npx prisma migrate dev --name add_component_instance_and_adr_relations --create-only', { stdio: 'inherit' });
      
      // Executar segunda migração
      console.log('Aplicando migração de relações...');
      execSync('cd api && npx prisma migrate deploy', { stdio: 'inherit' });
      
      // Converter ADRs para o novo modelo de participantes
      // Só pode ser executado depois que a tabela ADR_Participant for criada
      console.log('Fase 4: Convertendo ADRs para o novo modelo de participantes...');
      
      // Verificar se existe a coluna owner_id na tabela ADR
      const checkOwnerIdResult = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'ADR' 
          AND COLUMN_NAME = 'owner_id'
        ) as exists_column;
      `;
      
      const ownerIdExists = checkOwnerIdResult[0].exists_column === 1;
      
      if (ownerIdExists) {
        console.log('Migrando donos de ADRs para o modelo de participantes...');
        await prisma.$executeRawUnsafe(`
          INSERT INTO ADR_Participant (adr_id, user_id, role, created_at)
          SELECT id, owner_id, 'OWNER', created_at FROM ADR WHERE owner_id IS NOT NULL;
        `);
      } else {
        console.log('Coluna owner_id não encontrada na tabela ADR, pulando esta etapa.');
      }
      
      // Gerar migração final para remover colunas obsoletas
      console.log('Fase 5: Gerando migração final para remover campos obsoletos...');
      execSync('cd api && npx prisma migrate dev --name remove_obsolete_fields --create-only', { stdio: 'inherit' });
      
      // Aplicar migração final
      console.log('Aplicando migração final...');
      execSync('cd api && npx prisma migrate deploy', { stdio: 'inherit' });
      
      // Criar triggers para garantir a integridade dos ADRs
      console.log('Fase 6: Criando triggers para validação de ADRs...');
      const triggerScript = fs.readFileSync(
        path.join(__dirname, '../prisma/migrations/manual/create_adr_owner_trigger.sql'),
        'utf8'
      );
      
      // Dividir o script por DELIMITER para executar corretamente
      const triggerBlocks = triggerScript.split('DELIMITER ;');
      for (let block of triggerBlocks) {
        if (!block.trim()) continue;
        
        // Adicionar o DELIMITER ; de volta
        block = block + 'DELIMITER ;';
        
        // Processar DELIMITER $$ corretamente
        const parts = block.split('DELIMITER $$');
        if (parts.length > 1) {
          // Executar a primeira parte (se houver)
          if (parts[0].trim()) {
            await prisma.$executeRawUnsafe(parts[0].trim());
          }
          
          // Executar a parte principal com DELIMITER $$ substituído
          const triggerDefinition = parts[1].split('$$')[0].trim();
          console.log(`Criando trigger: ${triggerDefinition.substring(0, 50)}...`);
          await prisma.$executeRawUnsafe(triggerDefinition);
        } else {
          // Não tem DELIMITER $$, executar normalmente
          await prisma.$executeRawUnsafe(block.trim());
        }
      }
      
      // Verificações finais
      console.log('Fase 7: Executando verificações finais...');
      
      const envCount = await prisma.environment.count();
      const typeCount = await prisma.roadmapType.count();
      const teamCount = await prisma.team.count();
      
      console.log(`\nVerificações após migração:`);
      console.log(`- ${envCount} ambientes criados`);
      console.log(`- ${typeCount} tipos de roadmap criados`);
      console.log(`- ${teamCount} times criados`);
      
      // Verificar triggers
      const checkTrigger = await prisma.$queryRaw`
        SHOW TRIGGERS WHERE \`Table\` = 'ADR_Participant';
      `;
      
      console.log(`- ${checkTrigger.length} triggers criados para validação de ADR_Participant`);
      
      console.log('\nMigração para versão 2.0 concluída com sucesso!');
      console.log('Recomendação: Execute "npm run prisma:seed" para adicionar dados iniciais');
      
    } catch (error) {
      console.error('Erro durante execução da migração:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Erro durante backup do banco:', error);
    console.log('Abortando migração por segurança. Corrija o erro e tente novamente.');
    process.exit(1);
  }
}

main(); 