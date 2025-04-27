"use client";

import React from 'react';
import Link from 'next/link';
import { Github, Home, FileText, Heart } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center rounded-md bg-primary p-1 w-8 h-8 mr-2">
                <span className="font-bold text-lg text-primary-foreground">B</span>
              </div>
              <span className="font-semibold text-lg">Beaver</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Support Platform for Architecture and Engineering
            </p>
            <p className="text-xs text-muted-foreground">
              © {year} Beaver. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Developed by Alexandre Nascimento | alecatuae@gmail.com
            </p>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Links Rápidos
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  <Home size={16} className="mr-2" />
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/arch-overview" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  <FileText size={16} className="mr-2" />
                  Explorer
                </Link>
              </li>
              <li>
                <Link 
                  href="/documentation" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  <FileText size={16} className="mr-2" />
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="https://github.com" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  <Github size={16} className="mr-2" />
                  GitHub
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  <Heart size={16} className="mr-2" />
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
} 