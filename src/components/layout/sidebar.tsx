"use client";

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

// Definição de tipos para os itens de navegação
type NavSubItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavItem = {
  href?: string;
  label: string;
  icon: React.ReactNode;
  activeColor?: string;
  subItems?: NavSubItem[];
};

type SidebarProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState<{[key: string]: boolean}>({});

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

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
      label: 'Components Management',
      icon: <Box size={20} />,
      activeColor: 'text-primary',
      subItems: [
        {
          href: '/components',
          label: 'Components',
          icon: <Box size={16} />,
        },
        {
          href: '/relationships',
          label: 'Relationship',
          icon: <Network size={16} />,
        }
      ]
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
      <nav className="flex flex-col gap-1 px-2 py-4 overflow-y-auto max-h-[calc(100vh-120px)]">
        {navItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isParentActive = hasSubItems && item.subItems?.some(subItem => pathname === subItem.href);
          const isActive = pathname === item.href || isParentActive;
          const isSubmenuExpanded = expandedMenus[item.label];
          
          return (
            <div key={item.label}>
              {hasSubItems ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={cn(
                      "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      {
                        "bg-white/10 text-white": isParentActive,
                        "text-white/70 hover:bg-white/5 hover:text-white": !isParentActive,
                        "justify-center": !isExpanded,
                        "justify-between": isExpanded,
                      }
                    )}
                  >
                    <div className="flex items-center min-w-0">
                      <span className={cn(
                        "transition-all flex-shrink-0",
                        isParentActive ? item.activeColor : ""
                      )}>
                        {item.icon}
                      </span>
                      {isExpanded && (
                        <span className="ml-3 transition-opacity truncate">
                          {item.label}
                        </span>
                      )}
                    </div>
                    {isExpanded && (
                      <span className="flex-shrink-0 ml-2">
                        {isSubmenuExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    )}
                  </button>
                  
                  {isExpanded && isSubmenuExpanded && (
                    <div className="pl-5 mt-1 overflow-hidden transition-all duration-300 ease-in-out space-y-1">
                      {item.subItems?.map(subItem => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              {
                                "bg-white/10 text-white": isSubActive,
                                "text-white/70 hover:bg-white/5 hover:text-white": !isSubActive,
                                "justify-between": true,
                              }
                            )}
                          >
                            <div className="flex items-center min-w-0">
                              <span className={cn(
                                "transition-all flex-shrink-0",
                                isSubActive ? item.activeColor : ""
                              )}>
                                {subItem.icon}
                              </span>
                              <span className="ml-3 transition-opacity truncate">
                                {subItem.label}
                              </span>
                            </div>
                            {isSubActive && (
                              <div className="w-1 h-4 bg-primary rounded-full flex-shrink-0 ml-2" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
                  className={cn(
                    "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    {
                      "bg-white/10 text-white": isActive,
                      "text-white/70 hover:bg-white/5 hover:text-white": !isActive,
                      "justify-center": !isExpanded,
                      "justify-between": isExpanded,
                    }
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <span className={cn(
                      "transition-all flex-shrink-0",
                      isActive ? item.activeColor : ""
                    )}>
                      {item.icon}
                    </span>
                    {isExpanded && (
                      <span className="ml-3 transition-opacity truncate">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {isActive && isExpanded && (
                    <div className="w-1 h-4 bg-primary rounded-full flex-shrink-0 ml-2" />
                  )}
                </Link>
              )}
            </div>
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