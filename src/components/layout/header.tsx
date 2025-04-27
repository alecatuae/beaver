"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, Bell, Search, Settings, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Definição dos tipos
type Environment = 'Production' | 'Staging' | 'Development' | 'Test';

export function Header() {
  const pathname = usePathname();
  const [environment, setEnvironment] = useState<Environment>('Production');
  const [showSearch, setShowSearch] = useState(false);
  
  // Mapeamento de cores para ambientes
  const environmentColors = {
    Production: 'bg-success',
    Staging: 'bg-warning',
    Development: 'bg-secondary',
    Test: 'bg-accent',
  };

  // Função para obter o título da página atual
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (!lastSegment) return 'Home';
    
    // Converter kebab-case para Title Case
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="h-16 bg-card shadow-sm sticky top-0 z-30 px-4 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
        
        {/* Breadcrumbs para navegação */}
        {pathname !== '/' && (
          <nav className="hidden md:flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="mx-2 text-border">/</span>
            <span className="text-foreground font-medium">{getPageTitle()}</span>
          </nav>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Campo de busca expandível */}
        <div className={cn(
          "relative transition-all duration-300 ease-in-out overflow-hidden",
          showSearch ? "w-64" : "w-9"
        )}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 absolute right-0 top-0 z-10"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search size={18} />
          </Button>
          <input 
            type="text"
            placeholder="Buscar..." 
            className={cn(
              "h-9 pl-3 pr-10 rounded-full border-0 bg-muted text-sm focus-visible:ring-1 focus-visible:ring-ring w-full transition-all",
              showSearch ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {/* Seletor de ambiente */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center h-9 bg-white border-gray-200">
              <div className={cn("w-2 h-2 rounded-full mr-2", environmentColors[environment])} />
              <span className="text-sm">{environment}</span>
              <ChevronDown size={14} className="ml-2 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs font-medium">Selecionar Ambiente</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['Production', 'Staging', 'Development', 'Test'] as Environment[]).map((env) => (
              <DropdownMenuItem 
                key={env}
                onClick={() => setEnvironment(env)}
                className="flex items-center cursor-pointer text-sm"
              >
                <div className={cn("w-2 h-2 rounded-full mr-2", environmentColors[env])} />
                {env}
                {environment === env && (
                  <svg className="ml-auto h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
            2
          </span>
        </Button>

        {/* Usuário */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8 border border-muted">
                <AvatarImage src="/avatar.png" alt="Usuário" />
                <AvatarFallback className="bg-primary/10 text-primary">AN</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Alexandre Nascimento</p>
                <p className="text-xs text-muted-foreground">alecatuae@gmail.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer flex items-center">
              <User size={16} className="mr-2" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer flex items-center">
              <Settings size={16} className="mr-2" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer flex items-center">
              <LogOut size={16} className="mr-2" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 