/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NoteCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color: string; // Hex color e.g. '#0EA5E9'
  icon?: string | null; // e.g. 'briefcase', 'lightbulb', 'book-open'
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  user_id: string;
  category_id?: string | null;
  title: string;
  content: string;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteLink {
  id: string;
  user_id: string;
  source_note_id: string;
  target_note_id?: string | null;
  target_title: string;
  target_key: string;
  created_at: string;
}

export interface ExtractedWikiLink {
  target_title: string;
}

export interface BacklinkItem {
  id: string;
  source_note_id: string;
  source_title: string;
  source_category_id?: string | null;
  created_at: string;
}

export interface OutgoingLinkItem {
  target_title: string;
  target_note_id?: string | null;
  is_resolved: boolean;
}

export interface GraphNode {
  id: string;
  title: string;
  category_id?: string | null;
  category_name?: string;
  category_color?: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  connection_count: number;
  // force-graph runtime coordinates
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  id?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export type SecondBrainSubView = 'all' | 'categories' | 'favorites' | 'graph' | 'archive';
