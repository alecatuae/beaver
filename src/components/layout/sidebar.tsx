"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  LibraryBig,
  FileText,
  CloudLightning,
  BookOpen,
  Box,
  Users,
  Settings,
  BarChart,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

// Definição de tipos para os itens de navegação
type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  activeColor?: string;
};

type SidebarProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Itens de navegação do Beaver
  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      icon: <LayoutDashboard size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/arch-overview',
      label: 'Arch Overview',
      icon: <LibraryBig size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/adr-management',
      label: 'ADR Management',
      icon: <FileText size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/impact-workflow',
      label: 'Impact Workflow',
      icon: <CloudLightning size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/glossary',
      label: 'Glossário',
      icon: <BookOpen size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/components',
      label: 'Components',
      icon: <Box size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/team-management',
      label: 'Team Management',
      icon: <Users size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/system-settings',
      label: 'System Settings',
      icon: <Settings size={20} />,
      activeColor: 'text-primary',
    },
    {
      href: '/logs',
      label: 'Logs',
      icon: <BarChart size={20} />,
      activeColor: 'text-primary',
    },
  ];

  return (
    <div
      className={cn(
        "h-screen bg-gray-900 text-white fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
    >
      {/* Logo e nome do app */}
      <div className="flex items-center px-4 h-16 border-b border-white/10">
        <div className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          isExpanded ? "justify-start" : "justify-center w-full"
        )}>
          <div className="flex items-center justify-center rounded-md bg-primary p-1 w-8 h-8">
            <span className="font-bold text-lg text-primary-foreground">B</span>
          </div>
          {isExpanded && (
            <span className="ml-3 font-semibold text-lg">Beaver</span>
          )}
        </div>
      </div>

      {/* Controle de toggle para expandir/colapsar */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-gray-900 text-white border border-white/10 rounded-full h-6 w-6 flex items-center justify-center hover:bg-primary"
      >
        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </Button>

      {/* Itens de navegação */}
      <nav className="flex flex-col gap-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                {
                  "bg-white/10 text-white": isActive,
                  "text-white/70 hover:bg-white/5 hover:text-white": !isActive,
                  "justify-center": !isExpanded,
                  "justify-start": isExpanded,
                }
              )}
            >
              <span className={cn(
                "transition-all",
                isActive ? item.activeColor : ""
              )}>
                {item.icon}
              </span>
              {isExpanded && (
                <span className="ml-3 transition-opacity">
                  {item.label}
                </span>
              )}
              {isActive && isExpanded && (
                <div className="ml-auto w-1 h-4 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle de tema no rodapé */}
      <div className={cn(
        "absolute bottom-4 w-full px-4",
        !isExpanded ? "flex justify-center" : ""
      )}>
        <Button 
          variant="ghost" 
          size={!isExpanded ? "icon" : "default"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "w-full justify-center text-white/80 hover:text-white hover:bg-white/10",
            !isExpanded ? "px-0" : ""
          )}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {isExpanded && <span className="ml-2">Alternar tema</span>}
        </Button>
      </div>
    </div>
  );
} 