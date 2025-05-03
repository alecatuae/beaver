'use client';

import React from 'react';
import { ErrorExamples } from '@/components/examples/error-examples';

export default function ErrorSystemPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-2">Sistema de Mensagens de Erro</h1>
      <p className="text-muted-foreground mb-6">
        Demonstração do sistema padronizado de mensagens de erro da aplicação Beaver v2.0
      </p>
      
      <ErrorExamples />
      
      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="text-xl font-medium mb-2">Documentação do Sistema de Erros</h2>
        <p className="mb-3">
          O sistema de mensagens de erro da aplicação Beaver v2.0 segue um formato padronizado para facilitar o diagnóstico e resolução de problemas.
        </p>
        
        <h3 className="text-lg font-medium mt-4 mb-2">Formato do Código de Erro</h3>
        <p className="mb-2">Os códigos de erro seguem o formato <code className="bg-background px-1 py-0.5 rounded-sm">ERR-XXXX-YY-ZZ</code>:</p>
        <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
          <li><strong>XXXX</strong>: Código do módulo (ex.: 4000-4999 para Componentes)</li>
          <li><strong>YY</strong>: Tipo de erro (01: validação, 02: permissão, 03: não encontrado...)</li>
          <li><strong>ZZ</strong>: Origem (UI, API, DB)</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-4 mb-2">Estrutura da Mensagem</h3>
        <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
          <li>Título claro e conciso começando com "Erro:"</li>
          <li>Descrição do problema em linguagem simples</li>
          <li>Sugestão específica de resolução quando possível</li>
          <li>Código de erro técnico de referência no formato padronizado</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-4 mb-2">Categorias de Erro</h3>
        <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
          <li><strong>Validação</strong>: Entrada do usuário inválida (formulários)</li>
          <li><strong>Autenticação</strong>: Problemas de login/permissão</li>
          <li><strong>Conexão</strong>: Problemas de rede/API</li>
          <li><strong>Operação</strong>: Falha em ações do sistema (salvar, excluir, etc.)</li>
          <li><strong>Sistema</strong>: Erros internos não esperados</li>
        </ul>
      </div>
    </div>
  );
} 