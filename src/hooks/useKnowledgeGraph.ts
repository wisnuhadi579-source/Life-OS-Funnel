/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Note, NoteCategory, NoteLink, GraphNode, GraphLink, KnowledgeGraphData } from '../types/secondBrain';

export interface UseKnowledgeGraphOptions {
  notes: Note[];
  categories: NoteCategory[];
  links: NoteLink[];
  selectedCategoryId?: string | 'all';
  searchQuery?: string;
  showOrphans?: boolean;
  centerNoteId?: string | null;
  depth?: number; // 1, 2, or 3 for Local Graph
}

export function useKnowledgeGraph({
  notes,
  categories,
  links,
  selectedCategoryId = 'all',
  searchQuery = '',
  showOrphans = true,
  centerNoteId = null,
  depth = 1,
}: UseKnowledgeGraphOptions) {
  // Mapping categories for fast lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, NoteCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Notes map (only non-archived notes unless searching archives)
  const activeNotesMap = useMemo(() => {
    const map = new Map<string, Note>();
    notes.forEach((n) => {
      if (!n.is_archived) {
        map.set(n.id, n);
      }
    });
    return map;
  }, [notes]);

  // Hitung jumlah relasi per note_id
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    links.forEach((l) => {
      if (l.target_note_id && activeNotesMap.has(l.source_note_id) && activeNotesMap.has(l.target_note_id)) {
        counts.set(l.source_note_id, (counts.get(l.source_note_id) || 0) + 1);
        counts.set(l.target_note_id, (counts.get(l.target_note_id) || 0) + 1);
      }
    });
    return counts;
  }, [links, activeNotesMap]);

  // LOCAL GRAPH CALCULATION: BFS traversal from centerNoteId up to `depth` levels
  const localGraphNodeIds = useMemo(() => {
    if (!centerNoteId || !activeNotesMap.has(centerNoteId)) return null;

    const visited = new Set<string>([centerNoteId]);
    let currentLevel = new Set<string>([centerNoteId]);

    // Build undirected adjacency list for fast BFS
    const adj = new Map<string, Set<string>>();
    links.forEach((l) => {
      if (l.target_note_id && activeNotesMap.has(l.source_note_id) && activeNotesMap.has(l.target_note_id)) {
        if (!adj.has(l.source_note_id)) adj.set(l.source_note_id, new Set());
        if (!adj.has(l.target_note_id)) adj.set(l.target_note_id, new Set());
        adj.get(l.source_note_id)!.add(l.target_note_id);
        adj.get(l.target_note_id)!.add(l.source_note_id);
      }
    });

    for (let d = 0; d < depth; d++) {
      const nextLevel = new Set<string>();
      currentLevel.forEach((nodeId) => {
        const neighbors = adj.get(nodeId);
        if (neighbors) {
          neighbors.forEach((nbr) => {
            if (!visited.has(nbr)) {
              visited.add(nbr);
              nextLevel.add(nbr);
            }
          });
        }
      });
      currentLevel = nextLevel;
      if (currentLevel.size === 0) break;
    }

    return visited;
  }, [centerNoteId, depth, links, activeNotesMap]);

  // Construct Final Graph Data
  const graphData: KnowledgeGraphData = useMemo(() => {
    // Determine which notes are included
    let includedNotes = Array.from(activeNotesMap.values());

    // Local graph filter
    if (localGraphNodeIds) {
      includedNotes = includedNotes.filter((n) => localGraphNodeIds.has(n.id));
    } else {
      // Global graph category filter
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        includedNotes = includedNotes.filter((n) => n.category_id === selectedCategoryId);
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        includedNotes = includedNotes.filter(
          (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
      }

      // Filter orphan notes if toggled off
      if (!showOrphans) {
        includedNotes = includedNotes.filter((n) => (connectionCounts.get(n.id) || 0) > 0);
      }
    }

    const includedIds = new Set(includedNotes.map((n) => n.id));

    // Construct Nodes
    const nodes: GraphNode[] = includedNotes.map((n) => {
      const cat = n.category_id ? categoryMap.get(n.category_id) : undefined;
      return {
        id: n.id,
        title: n.title,
        category_id: n.category_id,
        category_name: cat?.name || 'Tanpa Kategori',
        category_color: cat?.color || '#0EA5E9',
        is_pinned: n.is_pinned,
        is_favorite: n.is_favorite,
        connection_count: connectionCounts.get(n.id) || 0,
      };
    });

    // Construct Links: only include links where both source and target are in includedIds
    const validLinks: GraphLink[] = [];
    const linkKeys = new Set<string>();

    links.forEach((l) => {
      if (
        l.target_note_id &&
        includedIds.has(l.source_note_id) &&
        includedIds.has(l.target_note_id)
      ) {
        // Prevent duplicate parallel visual edges between the same two nodes
        const [a, b] = [l.source_note_id, l.target_note_id].sort();
        const key = `${a}_${b}`;
        if (!linkKeys.has(key)) {
          linkKeys.add(key);
          validLinks.push({
            id: l.id,
            source: l.source_note_id,
            target: l.target_note_id,
          });
        }
      }
    });

    return { nodes, links: validLinks };
  }, [
    activeNotesMap,
    categoryMap,
    connectionCounts,
    localGraphNodeIds,
    selectedCategoryId,
    searchQuery,
    showOrphans,
    links,
  ]);

  // Metrics
  const stats = useMemo(() => {
    let orphans = 0;
    graphData.nodes.forEach((n) => {
      if (n.connection_count === 0) orphans++;
    });

    return {
      totalNodes: graphData.nodes.length,
      totalConnections: graphData.links.length,
      orphanNotes: orphans,
    };
  }, [graphData]);

  return {
    graphData,
    stats,
  };
}
