"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';

export default function ArchOverviewPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-6">Visão Geral da Arquitetura</h1>
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground mb-4">
            Esta página está em desenvolvimento. Aqui será exibida a visualização interativa da arquitetura.
          </p>
        </div>
      </div>
    </AppLayout>
  );
} 