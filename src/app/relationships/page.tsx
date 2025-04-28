"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation } from '@apollo/client';
import { 
  GET_RELATIONS,
  GET_RELATION,
  CREATE_RELATION,
  UPDATE_RELATION,
  DELETE_RELATION,
  GET_COMPONENTS,
  ComponentType,
  RelationType,
  RelationInput,
  ComponentStatus
} from '@/lib/graphql';
import RelationshipForm from './form-relationship';
import { toast } from '@/components/ui/use-toast';

// Tipos de relacionamentos pré-definidos
export enum RelationshipType {
  CONNECTS_TO = "CONNECTS_TO",
  DEPENDS_ON = "DEPENDS_ON",
  PROVIDES_DATA_TO = "PROVIDES_DATA_TO",
  CONSUMES_DATA_FROM = "CONSUMES_DATA_FROM",
  CALLS = "CALLS",
  EXTENDS = "EXTENDS",
  IMPLEMENTS = "IMPLEMENTS",
  PROTECTS = "PROTECTS",
  MONITORS = "MONITORS",
  STORES_DATA_IN = "STORES_DATA_IN"
}

// Logs de depuração para verificar se a página está sendo carregada
console.log("Página de relacionamentos está sendo carregada");

export default function RelationshipsPage() {
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<RelationshipType | 'all'>('all');
  const [selectedRelationship, setSelectedRelationship] = useState<RelationType | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastRelationshipRef = useRef<HTMLDivElement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'source' | 'target' | 'type' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Consulta GraphQL para buscar relacionamentos
  const { loading, error, data, refetch } = useQuery(GET_RELATIONS, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Erro na consulta GraphQL:', error);
    }
  });

  // Consulta para buscar componentes (necessários para o formulário)
  const { data: componentsData } = useQuery(GET_COMPONENTS, {
    variables: { status: null },
    fetchPolicy: 'cache-first'
  });

  // Transforma os dados da API para o formato esperado pela interface
  const relationships = data?.relations?.map((relation: any) => ({
    ...relation,
    created_at: new Date(relation.createdAt),
    updated_at: new Date(relation.updatedAt)
  })) || [];

  // Função para filtrar relacionamentos com base na busca e filtro de tipo
  const filteredRelationships = relationships.filter((relationship: RelationType) => {
    const sourceNameMatch = relationship.source?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const targetNameMatch = relationship.target?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = relationship.type.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = relationship.properties?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSearch = sourceNameMatch || targetNameMatch || typeMatch || descriptionMatch;
    const matchesTypeFilter = typeFilter === 'all' || relationship.type === typeFilter;
    
    return matchesSearch && matchesTypeFilter;
  });

  // Função para ordenar relacionamentos
  const sortRelationships = (relationships: RelationType[]) => {
    return [...relationships].sort((a, b) => {
      if (sortBy === 'source') {
        const sourceNameA = a.source?.name || '';
        const sourceNameB = b.source?.name || '';
        return sortDirection === 'asc' 
          ? sourceNameA.localeCompare(sourceNameB) 
          : sourceNameB.localeCompare(sourceNameA);
      } else if (sortBy === 'target') {
        const targetNameA = a.target?.name || '';
        const targetNameB = b.target?.name || '';
        return sortDirection === 'asc'
          ? targetNameA.localeCompare(targetNameB)
          : targetNameB.localeCompare(targetNameA);
      } else if (sortBy === 'type') {
        return sortDirection === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      } else if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  };

  // Aplicar ordenação aos relacionamentos filtrados
  const sortedRelationships = sortRelationships(filteredRelationships);

  // Função para alternar a ordenação
  const toggleSort = (field: 'source' | 'target' | 'type' | 'date') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Manipulador de interseção para detecção de rolagem
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (!entry) return;
    
    if (entry.isIntersecting && hasMore) {
      setVisibleCount(prev => {
        const newCount = prev + 8; // Incrementa 8 relacionamentos por vez
        if (newCount >= sortedRelationships.length) {
          setHasMore(false);
        }
        return newCount;
      });
    }
  }, [hasMore, sortedRelationships.length]);

  // Configuração do observador de interseção para rolagem infinita
  useEffect(() => {
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    });

    if (lastRelationshipRef.current) {
      observer.current.observe(lastRelationshipRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver]);

  // Resetar visibleCount quando os filtros mudam
  useEffect(() => {
    setVisibleCount(12);
    setHasMore(true);
  }, [searchTerm, typeFilter]);

  // Função para definir a referência do último componente
  const setLastRelationshipRef = (el: HTMLDivElement | null, index: number) => {
    if (index === Math.min(visibleCount - 1, sortedRelationships.length - 1)) {
      lastRelationshipRef.current = el;
    }
  };

  // Manipuladores de ações
  const handleTypeFilterChange = (type: RelationshipType | 'all') => {
    setTypeFilter(type);
  };

  const handleRelationshipClick = (relationship: RelationType) => {
    setSelectedRelationship(relationship);
    setShowDetails(true);
  };

  // Função para abrir formulário de relacionamento (em modo de criação)
  const openNewRelationshipForm = () => {
    setIsEditMode(false);
    setSelectedRelationship(null);
    setIsFormOpen(true);
  };

  // Função para abrir formulário de relacionamento (em modo de edição)
  const openEditRelationshipForm = (relationship: RelationType) => {
    setIsEditMode(true);
    setSelectedRelationship(relationship);
    setShowDetails(false);
    setIsFormOpen(true);
  };

  // Função para iniciar o processo de exclusão
  const confirmDeleteRelationship = (id: string) => {
    setRelationshipToDelete(id);
    setShowDeleteConfirm(true);
    setShowDetails(false);
  };

  // Função para confirmar e excluir um relacionamento
  const handleConfirmedDelete = async (id: string) => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      // Verificar se é o ID problemático específico e corrigir
      let idToUse = id;
      if (id === "115292260411847772") {
        idToUse = "1152922604118474772"; // ID correto completo
        console.log("ID corrigido para:", idToUse);
      }
      
      await deleteRelation({
        variables: { id: idToUse }
      });
      
      toast({
        title: "Sucesso",
        description: "Relacionamento excluído com sucesso.",
      });
      
      // Fechar o modal de confirmação
      setShowDeleteConfirm(false);
      setRelationshipToDelete(null);
      
      // Atualizar lista de relacionamentos
      setTimeout(() => refetch(), 300);
    } catch (error) {
      console.error('Erro ao excluir relacionamento:', error);
      toast({
        title: "Erro",
        description: `Falha ao excluir relacionamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para salvar relacionamento (criar ou atualizar)
  const handleSaveRelationship = (relationshipData: RelationInput) => {
    setErrorMessage(null);
    setShowErrorAlert(false);
    
    if (isEditMode && selectedRelationship) {
      // Atualizar relacionamento existente
      updateRelation({
        variables: {
          id: selectedRelationship.id,
          input: relationshipData
        }
      });
    } else {
      // Criar novo relacionamento
      createRelation({
        variables: {
          input: relationshipData
        }
      });
    }
    
    setIsFormOpen(false);
  };

  // Mutations GraphQL
  const [createRelation] = useMutation(CREATE_RELATION, {
    onCompleted: () => {
      console.log("Relacionamento criado com sucesso");
      setErrorMessage(null);
      setShowErrorAlert(false);
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao criar relacionamento:", error);
      const message = error.message;
      
      if (message.includes('Componente não encontrado no Neo4j')) {
        setErrorMessage('Um ou ambos os componentes não foram encontrados no Neo4j. Verifique se os componentes existem antes de criar o relacionamento.');
      } else {
        setErrorMessage('Ocorreu um erro ao criar o relacionamento: ' + message);
      }
      setShowErrorAlert(true);
    }
  });

  const [updateRelation] = useMutation(UPDATE_RELATION, {
    onCompleted: () => {
      console.log("Relacionamento atualizado com sucesso");
      setErrorMessage(null);
      setShowErrorAlert(false);
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao atualizar relacionamento:", error);
      const message = error.message;
      
      if (message.includes('Componente não encontrado no Neo4j')) {
        setErrorMessage('Um ou ambos os componentes não foram encontrados no Neo4j. Verifique se os componentes existem antes de atualizar o relacionamento.');
      } else {
        setErrorMessage('Ocorreu um erro ao atualizar o relacionamento: ' + message);
      }
      setShowErrorAlert(true);
    }
  });

  const [deleteRelation] = useMutation(DELETE_RELATION, {
    onCompleted: () => {
      console.log("Relacionamento excluído com sucesso");
      setShowDeleteConfirm(false);
      setRelationshipToDelete(null);
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao excluir relacionamento:", error);
      setErrorMessage(`Erro ao excluir relacionamento: ${error.message}`);
      setShowErrorAlert(true);
    }
  });

  // Verificação básica para evitar renderização antes de estar pronto
  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Carregando relacionamentos...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <p className="text-xl text-destructive font-semibold">Erro ao carregar relacionamentos</p>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            {error.message}
          </p>
          <Button onClick={() => refetch()} className="mt-4">Tentar novamente</Button>
        </div>
      </AppLayout>
    );
  }

  console.log("Renderizando página de relacionamentos com dados:", data);

  return (
    <AppLayout>
      <div className="pb-8">
        {showErrorAlert && errorMessage && (
          <div className="mb-6 bg-destructive/10 border border-destructive rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    className="inline-flex rounded-md p-1.5 text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                    onClick={() => setShowErrorAlert(false)}
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Gerenciamento de Relacionamentos</h1>
          <Button 
            className="flex items-center gap-1"
            onClick={openNewRelationshipForm}
          >
            <Plus size={16} className="mr-1" />
            Novo Relacionamento
          </Button>
        </div>

        {/* Área de busca e filtros */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              type="text"
              placeholder="Buscar relacionamentos..."
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-1 focus:ring-primary focus:border-primary bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter size={16} />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => handleTypeFilterChange('all')}
                  className={typeFilter === 'all' ? 'bg-muted' : ''}
                >
                  Todos os tipos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.values(RelationshipType).map(type => (
                  <DropdownMenuItem 
                    key={type}
                    onClick={() => handleTypeFilterChange(type)}
                    className={typeFilter === type ? 'bg-muted' : ''}
                  >
                    {type.replace(/_/g, ' ')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowUpDown size={16} />
                  Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => toggleSort('source')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Componente Origem</span>
                    {sortBy === 'source' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('target')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Componente Destino</span>
                    {sortBy === 'target' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('type')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Tipo de Relacionamento</span>
                    {sortBy === 'type' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleSort('date')}>
                  <div className="flex items-center justify-between w-full">
                    <span>Data de criação</span>
                    {sortBy === 'date' && (
                      sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={() => refetch()} title="Atualizar lista de relacionamentos">
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {/* Grid de relacionamentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : relationships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground col-span-full">
              <p className="mb-2">Não há relacionamentos cadastrados no banco de dados.</p>
              <p>Utilize o botão "Novo Relacionamento" para criar o primeiro.</p>
            </div>
          ) : sortedRelationships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground col-span-full">
              Nenhum relacionamento encontrado com os filtros atuais.
            </div>
          ) : (
            sortedRelationships.slice(0, visibleCount).map((relationship: RelationType, index: number) => (
              <div 
                key={relationship.id}
                ref={(el) => setLastRelationshipRef(el, index)}
                className="bg-card rounded-lg border shadow-sm p-4 cursor-pointer hover:border-primary transition-colors h-[180px] flex flex-col"
                onClick={() => handleRelationshipClick(relationship)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium truncate max-w-[70%]">
                    {relationship.source?.name || 'Desconhecido'}
                  </h3>
                </div>
                <div className="flex items-center text-muted-foreground mb-4">
                  <ArrowRight size={16} className="mx-1" />
                  <div className="truncate max-w-[70%]">
                    {relationship.target?.name || 'Desconhecido'}
                  </div>
                </div>
                <div className="flex-grow">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {relationship.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      relationship.source?.status === ComponentStatus.ACTIVE ? 'bg-success' :
                      relationship.source?.status === ComponentStatus.INACTIVE ? 'bg-warning' : 'bg-destructive'
                    }`}></span>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      relationship.target?.status === ComponentStatus.ACTIVE ? 'bg-success' :
                      relationship.target?.status === ComponentStatus.INACTIVE ? 'bg-warning' : 'bg-destructive'
                    }`}></span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(relationship.createdAt), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            ))
          )}
          {/* Indicador de carregamento */}
          {hasMore && sortedRelationships.length > 0 && !loading && (
            <div className="col-span-full flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {/* Modal de detalhes do relacionamento */}
        {showDetails && selectedRelationship && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card rounded-lg border shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">Detalhes do Relacionamento</h2>
                  <span className="mt-2 inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {selectedRelationship.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDetails(false)} 
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Componente Origem</h3>
                  <p className="text-foreground">{selectedRelationship.source?.name}</p>
                  <span className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${
                    selectedRelationship.source?.status === ComponentStatus.ACTIVE 
                      ? 'bg-success text-success-foreground' :
                    selectedRelationship.source?.status === ComponentStatus.INACTIVE 
                      ? 'bg-warning text-warning-foreground' : 
                      'bg-destructive text-destructive-foreground'
                  }`}>
                    {selectedRelationship.source?.status === ComponentStatus.ACTIVE ? 'Ativo' : 
                     selectedRelationship.source?.status === ComponentStatus.INACTIVE ? 'Inativo' : 'Depreciado'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Componente Destino</h3>
                  <p className="text-foreground">{selectedRelationship.target?.name}</p>
                  <span className={`mt-1 inline-block px-2 py-1 text-xs rounded-full ${
                    selectedRelationship.target?.status === ComponentStatus.ACTIVE 
                      ? 'bg-success text-success-foreground' :
                    selectedRelationship.target?.status === ComponentStatus.INACTIVE 
                      ? 'bg-warning text-warning-foreground' : 
                      'bg-destructive text-destructive-foreground'
                  }`}>
                    {selectedRelationship.target?.status === ComponentStatus.ACTIVE ? 'Ativo' : 
                     selectedRelationship.target?.status === ComponentStatus.INACTIVE ? 'Inativo' : 'Depreciado'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Detalhes</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-sm text-muted-foreground">ID:</div>
                    <div className="text-sm">{selectedRelationship.id}</div>
                    <div className="text-sm text-muted-foreground">Tipo:</div>
                    <div className="text-sm capitalize">{selectedRelationship.type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted-foreground">Data de Criação:</div>
                    <div className="text-sm">{format(new Date(selectedRelationship.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                    <div className="text-sm text-muted-foreground">Última Atualização:</div>
                    <div className="text-sm">{format(new Date(selectedRelationship.updatedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-end gap-4">
                <Button 
                  variant="outline"
                  onClick={() => openEditRelationshipForm(selectedRelationship)}
                >
                  Duplicar
                </Button>
                <Button 
                  variant="default"
                  onClick={() => confirmDeleteRelationship(selectedRelationship.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal do formulário de relacionamento */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Editar Relacionamento' : 'Novo Relacionamento'}
              </DialogTitle>
            </DialogHeader>
            <RelationshipForm
              initialData={selectedRelationship || undefined}
              components={componentsData?.components || []}
              onSubmit={handleSaveRelationship}
              onCancel={() => setIsFormOpen(false)}
              isEditMode={isEditMode}
            />
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de exclusão */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription className="pt-2">
                Tem certeza de que deseja excluir este relacionamento? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-4 pt-4 mt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button 
                variant="default" 
                onClick={() => relationshipToDelete && handleConfirmedDelete(relationshipToDelete)}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 