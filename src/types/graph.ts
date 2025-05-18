export type GraphType = 'undirected' | 'directed';

export type Node = { id: string };

export type Link = { source: string; target: string };

export type GraphData = { nodes: Node[]; links: Link[] };

export type Connectivity = {
  strongly: boolean;
  weakly: boolean;
  unilaterally: boolean;
};