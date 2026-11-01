/**
 * Type declarations for react-force-graph-2d
 */
declare module 'react-force-graph-2d' {
  import { ComponentType } from 'react';

  export interface ForceGraphMethods {
    zoom: (k?: number, durationMs?: number) => number | ForceGraphMethods;
    zoomToFit: (durationMs?: number, padding?: number, nodeFilter?: (node: any) => boolean) => ForceGraphMethods;
    centerAt: (x?: number, y?: number, durationMs?: number) => ForceGraphMethods;
    d3Force: (forceName: string, forceFn?: any) => any;
    d3ReheatSimulation: () => ForceGraphMethods;
  }

  export interface ForceGraphProps {
    ref?: any;
    width?: number;
    height?: number;
    graphData: {
      nodes: any[];
      links: any[];
    };
    nodeId?: string;
    nodeLabel?: string | ((node: any) => string);
    nodeVal?: number | string | ((node: any) => number);
    nodeColor?: string | ((node: any) => string);
    nodeRelSize?: number;
    nodeAutoColorBy?: string | ((node: any) => any);
    nodeCanvasObject?: (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    nodeCanvasObjectMode?: (node: any) => 'replace' | 'before' | 'after';
    linkColor?: string | ((link: any) => string);
    linkWidth?: number | string | ((link: any) => number);
    linkDirectionalArrowLength?: number | ((link: any) => number);
    linkDirectionalArrowRelPos?: number | ((link: any) => number);
    linkCurvature?: number | string | ((link: any) => number);
    backgroundColor?: string;
    onNodeClick?: (node: any, event: MouseEvent) => void;
    onNodeHover?: (node: any, prevNode: any) => void;
    onLinkClick?: (link: any, event: MouseEvent) => void;
    onBackgroundClick?: (event: MouseEvent) => void;
    cooldownTicks?: number;
    cooldownTime?: number;
    onEngineStop?: () => void;
    enableNodeDrag?: boolean;
    enableZoomInteraction?: boolean;
    enablePanInteraction?: boolean;
    d3AlphaDecay?: number;
    d3VelocityDecay?: number;
    warmupTicks?: number;
  }

  const ForceGraph2D: ComponentType<ForceGraphProps>;
  export default ForceGraph2D;
}
