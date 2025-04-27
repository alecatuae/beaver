import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { ArrowRight, BookOpen, PanelTop, FileText, CloudLightning } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Tipo para os cartões de recursos
type FeatureCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  gradient: string;
};

export default function Home() {
  // Lista de recursos principais
  const features: FeatureCard[] = [
    {
      title: 'Arch Overview',
      description: 'Visualize sua arquitetura empresarial de maneira clara e organizada',
      icon: <PanelTop className="h-5 w-5" />,
      href: '/arch-overview',
      color: 'text-secondary',
      gradient: 'from-secondary/10 to-transparent',
    },
    {
      title: 'ADR Management',
      description: 'Gerencie registros de decisão arquitetural com eficiência',
      icon: <FileText className="h-5 w-5" />,
      href: '/adr-management',
      color: 'text-primary',
      gradient: 'from-primary/10 to-transparent',
    },
    {
      title: 'Impact Workflow',
      description: 'Controle o fluxo de trabalho de impacto de forma estruturada',
      icon: <CloudLightning className="h-5 w-5" />,
      href: '/impact-workflow',
      color: 'text-accent',
      gradient: 'from-accent/10 to-transparent',
    },
    {
      title: 'Glossário',
      description: 'Consulte termos técnicos em um glossário abrangente',
      icon: <BookOpen className="h-5 w-5" />,
      href: '/glossary',
      color: 'text-secondary',
      gradient: 'from-secondary/10 to-transparent',
    },
  ];

  return (
    <AppLayout>
      <div className="py-8 animate-in">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Bem-vindo ao Beaver
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma de Suporte para Arquitetura e Engenharia
          </p>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-medium mb-1">Componentes</h3>
            <p className="text-3xl font-bold text-primary">128</p>
            <p className="text-sm text-muted-foreground mt-2">
              Componentes registrados e documentados
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-medium mb-1">ADRs</h3>
            <p className="text-3xl font-bold text-primary">47</p>
            <p className="text-sm text-muted-foreground mt-2">
              Decisões arquiteturais documentadas
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <h3 className="text-lg font-medium mb-1">Integrações</h3>
            <p className="text-3xl font-bold text-primary">56</p>
            <p className="text-sm text-muted-foreground mt-2">
              Integrações entre sistemas
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-6 text-center">Recursos Principais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link 
                key={feature.title} 
                href={feature.href}
                className="group block"
              >
                <div className={cn(
                  "bg-card border border-gray-200 rounded-lg p-6 h-full shadow-sm hover:shadow-md transition-all",
                  "hover:border-blue-500/50 hover:translate-y-[-2px]"
                )}>
                  <div className={cn(
                    "rounded-full w-10 h-10 flex items-center justify-center mb-4",
                    `bg-gradient-to-br ${feature.gradient}`,
                    feature.color
                  )}>
                    {feature.icon}
                  </div>
                  <h3 className={cn("text-lg font-semibold mb-2", feature.color)}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-primary invisible group-hover:visible">
                    Acessar
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Seção de destaques */}
        <section className="mt-16 bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-6 text-center">Gestão Eficiente de Arquitetura</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            O Beaver oferece as ferramentas necessárias para que arquitetos e times de engenharia 
            possam documentar, gerenciar e visualizar a arquitetura de sistemas de forma eficiente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex space-x-4 items-start">
              <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Documentação Centralizada</h3>
                <p className="text-sm text-muted-foreground">
                  Mantenha toda a documentação de arquitetura em um único lugar, 
                  facilitando o acesso e a manutenção das informações.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4 items-start">
              <div className="mt-1 bg-primary/10 p-2 rounded-full text-primary">
                <CloudLightning className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium mb-2">Análise de Impacto</h3>
                <p className="text-sm text-muted-foreground">
                  Avalie o impacto de mudanças na arquitetura antes de implementá-las,
                  reduzindo riscos e aumentando a previsibilidade.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
} 