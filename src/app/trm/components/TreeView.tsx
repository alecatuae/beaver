import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_CATEGORIES, GET_TRM_LAYERS, CategoryType, TRMLayerType } from '@/lib/graphql-trm';
import { ChevronRight, ChevronDown, FolderIcon, ServerIcon, LayersIcon, AppWindowIcon, Network, ComponentIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Interface para nós da árvore
interface TreeNode {
  id: string;
  name: string;
  type: 'layer' | 'category';
  children?: TreeNode[];
  parentId?: string;
  layerId?: string;
  data?: any; // Dados adicionais específicos do nó
  expanded?: boolean;
}

// Códigos de cores por nível TRM
const getTRMLayerColor = (layerName: string): string => {
  switch (layerName.toUpperCase()) {
    case 'INFRASTRUCTURE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PLATFORM':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'APPLICATION':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'SHARED SERVICES':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Ícones por nível TRM
const getTRMLayerIcon = (layerName: string) => {
  switch (layerName.toUpperCase()) {
    case 'INFRASTRUCTURE':
      return <ServerIcon className="h-4 w-4 mr-2" />;
    case 'PLATFORM':
      return <LayersIcon className="h-4 w-4 mr-2" />;
    case 'APPLICATION':
      return <AppWindowIcon className="h-4 w-4 mr-2" />;
    case 'SHARED SERVICES':
      return <Network className="h-4 w-4 mr-2" />;
    default:
      return <FolderIcon className="h-4 w-4 mr-2" />;
  }
};

// Função para converter categorias em estrutura de árvore
const buildCategoryTree = (categories: CategoryType[], layerId: string): TreeNode[] => {
  // Filtrar categorias por layerId
  const layerCategories = categories.filter(cat => cat.layer?.id === layerId);
  
  // Primeiro, encontrar categorias raiz (sem parentId)
  const rootCategories = layerCategories.filter(cat => !cat.parentId);
  
  // Função para construir recursivamente a árvore
  const buildTree = (category: CategoryType): TreeNode => {
    const children = layerCategories
      .filter(cat => cat.parentId === category.id)
      .map(child => buildTree(child));
    
    return {
      id: category.id,
      name: category.name,
      type: 'category',
      layerId,
      parentId: category.parentId,
      children: children.length > 0 ? children : undefined,
      data: category,
      expanded: false
    };
  };
  
  // Construir árvore a partir das categorias raiz
  return rootCategories.map(rootCat => buildTree(rootCat));
};

// Componente nó da árvore
interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  onToggle: (nodeId: string) => void;
  onSelect: (node: TreeNode) => void;
  selectedNodeId?: string;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ 
  node, 
  level, 
  onToggle, 
  onSelect,
  selectedNodeId 
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  };
  
  const handleSelect = () => {
    onSelect(node);
  };
  
  // Determinar classe de estilo com base no tipo de nó e nível
  let styleClass = '';
  
  if (node.type === 'layer') {
    styleClass = getTRMLayerColor(node.name);
  } else {
    // Para categorias, aplicar padding baseado no nível
    styleClass = 'hover:bg-gray-100 dark:hover:bg-gray-800';
  }
  
  return (
    <div>
      <div 
        className={cn(
          "flex items-center p-2 cursor-pointer rounded-md transition-colors",
          isSelected ? "bg-primary/10" : styleClass
        )}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={handleSelect}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="mr-1 h-4 w-4 flex items-center justify-center"
          >
            {node.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
        
        {!hasChildren && <div className="w-5" />}
        
        {node.type === 'layer' 
          ? getTRMLayerIcon(node.name)
          : <ComponentIcon className="h-4 w-4 mr-2" />
        }
        
        <span className="flex-1 truncate">{node.name}</span>
        
        {node.type === 'layer' && (
          <Badge variant="outline" className={cn("ml-2", getTRMLayerColor(node.name))}>
            {node.children?.length || 0}
          </Badge>
        )}
      </div>
      
      {hasChildren && node.expanded && (
        <div className="ml-2">
          {node.children!.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal da árvore TRM
export const TRMTreeView: React.FC<{
  onSelectNode?: (node: TreeNode) => void;
  expandAll?: boolean;
}> = ({ 
  onSelectNode = () => {}, 
  expandAll = false 
}) => {
  // Estados
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  
  // Queries para buscar dados
  const { data: layersData, loading: loadingLayers } = useQuery(GET_TRM_LAYERS);
  const { data: categoriesData, loading: loadingCategories } = useQuery(GET_ALL_CATEGORIES);
  
  // Indicador de carregamento
  const isLoading = loadingLayers || loadingCategories;
  
  // Construir árvore quando os dados estiverem disponíveis
  useEffect(() => {
    if (layersData?.trmLayers && categoriesData?.categories) {
      const layers = layersData.trmLayers;
      const categories = categoriesData.categories;
      
      // Construir estrutura em árvore
      const tree: TreeNode[] = layers.map((layer: TRMLayerType) => ({
        id: layer.id,
        name: layer.name,
        type: 'layer',
        children: buildCategoryTree(categories, layer.id),
        data: layer,
        expanded: expandAll
      }));
      
      setTreeData(tree);
      
      // Se expandAll estiver ativado, expandir todos os nós
      if (expandAll) {
        const allNodeIds = new Set<string>();
        
        const collectNodeIds = (nodes: TreeNode[]) => {
          for (const node of nodes) {
            allNodeIds.add(node.id);
            if (node.children) {
              collectNodeIds(node.children);
            }
          }
        };
        
        collectNodeIds(tree);
        setExpandedNodeIds(allNodeIds);
      }
    }
  }, [layersData, categoriesData, expandAll]);
  
  // Manipular expansão/colapso de nós
  const handleToggle = (nodeId: string) => {
    setExpandedNodeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
    
    // Atualizar estado expandido no treeData
    setTreeData(prev => {
      const updateExpanded = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, expanded: !node.expanded };
          }
          if (node.children) {
            return {
              ...node,
              children: updateExpanded(node.children)
            };
          }
          return node;
        });
      };
      
      return updateExpanded(prev);
    });
  };
  
  // Selecionar nó
  const handleSelectNode = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    onSelectNode(node);
  };
  
  // Renderizar skeletons durante carregamento
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="flex items-center space-x-2 pl-6">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
        <div className="flex items-center space-x-2 pl-12">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[160px]" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[190px]" />
        </div>
      </div>
    );
  }
  
  // Se não houver dados
  if (treeData.length === 0) {
    return <div className="p-4 text-muted-foreground">Nenhum dado TRM encontrado</div>;
  }
  
  return (
    <div className="border rounded-md max-h-[600px] overflow-y-auto">
      {treeData.map(node => (
        <TreeNodeComponent
          key={node.id}
          node={{
            ...node,
            expanded: expandedNodeIds.has(node.id)
          }}
          level={0}
          onToggle={handleToggle}
          onSelect={handleSelectNode}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </div>
  );
};

export default TRMTreeView; 