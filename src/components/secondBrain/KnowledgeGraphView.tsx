/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  Eye,
  EyeOff,
  Network,
  X,
  Layers,
  ChevronRight,
  Info,
  Sliders,
} from 'lucide-react';
import { Note, NoteCategory, NoteLink, GraphNode } from '../../types/secondBrain';
import { useKnowledgeGraph } from '../../hooks/useKnowledgeGraph';

interface KnowledgeGraphViewProps {
  notes: Note[];
  categories: NoteCategory[];
  links: NoteLink[];
  centerNoteId?: string | null;
  onSelectNote: (note: Note) => void;
  onCloseLocalGraph?: () => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  notes,
  categories,
  links,
  centerNoteId = null,
  onSelectNote,
  onCloseLocalGraph,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrphans, setShowOrphans] = useState(true);
  const [depth, setDepth] = useState<number>(1);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Dimensions
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<ForceGraphMethods | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth > 100 ? clientWidth : 800,
          height: clientHeight > 100 ? clientHeight : 600,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const timeout = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, []);

  const { graphData, stats } = useKnowledgeGraph({
    notes,
    categories,
    links,
    selectedCategoryId,
    searchQuery,
    showOrphans,
    centerNoteId,
    depth,
  });

  // Zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      const current = Number(graphRef.current.zoom()) || 1;
      graphRef.current.zoom(current * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const current = Number(graphRef.current.zoom()) || 1;
      graphRef.current.zoom(current / 1.3, 400);
    }
  };

  const handleZoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(500, 40);
    }
  };

  const centerNote = useMemo(
    () => (centerNoteId ? notes.find((n) => n.id === centerNoteId) : null),
    [centerNoteId, notes]
  );

  // Custom Canvas Rendering for Nodes
  const handleNodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isCenter = node.id === centerNoteId;
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      const baseRadius = Math.max(4, 4 + Math.sqrt(node.connection_count || 1) * 2.5);
      const radius = isCenter ? baseRadius * 1.5 : isHovered ? baseRadius * 1.3 : baseRadius;

      // Glow effect for center or hovered node
      if (isCenter || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
        ctx.fillStyle = isCenter ? 'rgba(34, 211, 238, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.category_color || '#0EA5E9';
      ctx.fill();

      // Border ring
      ctx.lineWidth = isCenter ? 2.5 : 1.2;
      ctx.strokeStyle = isCenter ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();

      // Draw label if zoom level is high enough or hovered/center
      const shouldDrawLabel = globalScale > 0.8 || isCenter || isHovered || node.connection_count > 2;
      if (shouldDrawLabel) {
        const label = node.title || 'Untitled';
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${isCenter ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Background pill for label legibility
        const textWidth = ctx.measureText(label).width;
        const padding = 2;
        ctx.fillStyle = 'rgba(7, 27, 53, 0.85)';
        ctx.fillRect(
          node.x - textWidth / 2 - padding,
          node.y + radius + 2,
          textWidth + padding * 2,
          fontSize + padding
        );

        ctx.fillStyle = isCenter ? '#22D3EE' : isHovered ? '#FFFFFF' : '#E2E8F0';
        ctx.fillText(label, node.x, node.y + radius + 3);
      }
    },
    [centerNoteId, hoveredNode]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#071B35] border border-[#15385F] rounded-2xl overflow-hidden relative shadow-2xl min-h-[500px]"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Mode Title & Stats */}
        <div className="pointer-events-auto bg-[#061A32]/90 backdrop-blur-md border border-[#15385F] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-tight">
                {centerNote ? `Local Graph: ${centerNote.title}` : 'Knowledge Graph (Global)'}
              </h3>
              {centerNote && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Fokus
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
              <span>{stats.totalNodes} Nodes</span>
              <span>•</span>
              <span>{stats.totalConnections} Koneksi</span>
              <span>•</span>
              <span>{stats.orphanNotes} Terisolasi</span>
            </div>
          </div>

          {centerNote && onCloseLocalGraph && (
            <button
              onClick={onCloseLocalGraph}
              className="ml-2 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#102D50] transition"
              title="Kembali ke Global Graph"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Controls & Filters */}
        <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
          {/* Depth selector for Local Graph */}
          {centerNote && (
            <div className="bg-[#061A32]/90 backdrop-blur-md border border-[#15385F] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-[10px] font-mono text-slate-400">Kedalaman:</span>
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition ${
                    depth === d
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-[#0B2545]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {/* Category Filter for Global Graph */}
          {!centerNote && (
            <div className="bg-[#061A32]/90 backdrop-blur-md border border-[#15385F] px-2.5 py-1.5 rounded-xl flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-sans"
              >
                <option value="all" className="bg-[#061A32]">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#061A32]">
                    ● {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Orphan Notes */}
          {!centerNote && (
            <button
              onClick={() => setShowOrphans(!showOrphans)}
              className={`p-2 rounded-xl border backdrop-blur-md transition ${
                showOrphans
                  ? 'bg-[#061A32]/90 text-cyan-300 border-cyan-500/40'
                  : 'bg-[#061A32]/90 text-slate-400 border-[#15385F]'
              }`}
              title={showOrphans ? 'Sembunyikan Catatan Tanpa Hubungan' : 'Tampilkan Semua Catatan'}
            >
              {showOrphans ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Zoom controls */}
          <div className="bg-[#061A32]/90 backdrop-blur-md border border-[#15385F] p-1 rounded-xl flex items-center gap-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-[#102D50] transition"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-[#102D50] transition"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomToFit}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-[#102D50] transition"
              title="Pusatkan Graf"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Force Graph Canvas */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        {graphData.nodes.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-2 p-6 text-center">
            <Network className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">Belum ada node catatan pada graph</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Buat catatan dan hubungkan pemikiran Anda menggunakan tautan [[Judul Catatan]] untuk membentuk peta pengetahuan interaktif.
            </p>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            backgroundColor="#071B35"
            nodeRelSize={4}
            nodeCanvasObject={handleNodeCanvasObject}
            linkColor={() => '#1E4575'}
            linkWidth={1.2}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            onNodeClick={(node: any) => {
              const target = notes.find((n) => n.id === node.id);
              if (target) {
                onSelectNote(target);
              }
            }}
            onNodeHover={(node: any) => setHoveredNode(node || null)}
          />
        )}
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden md:block">
        <div className="bg-[#061A32]/90 backdrop-blur-md border border-[#15385F] px-3.5 py-2 rounded-xl shadow-lg pointer-events-auto flex items-center gap-3 text-[11px] text-slate-300">
          <span className="font-mono text-slate-500 text-[10px]">LEGENDA:</span>
          {categories.slice(0, 4).map((c) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="truncate max-w-[90px]">{c.name}</span>
            </div>
          ))}
          <span className="text-[10px] text-cyan-400 font-mono">Klik node untuk membuka</span>
        </div>
      </div>
    </div>
  );
};
