import { Node, Link, GraphData, Connectivity } from '../types/graph';

// Checks if a degree sequence forms a valid undirected graph
export const isUndirectedGraphic = (sequence: number[]): boolean => {
  let seq = [...sequence].sort((a, b) => b - a);
  while (true) {
    seq = seq.filter(d => d > 0);
    if (seq.length === 0) return true;
    const d = seq[0];
    if (d < 0 || d > seq.length - 1) return false;
    seq = seq.slice(1);
    for (let i = 0; i < d; i++) {
      if (i >= seq.length) return false;
      seq[i]--;
      if (seq[i] < 0) return false;
    }
    seq.sort((a, b) => b - a);
  }
};

// Checks if in/out-degree sequences form a valid directed graph
export const isDirectedGraphic = (inDegrees: number[], outDegrees: number[]): boolean => {
  if (inDegrees.length !== outDegrees.length) return false;
  const sumIn = inDegrees.reduce((a, b) => a + b, 0);
  const sumOut = outDegrees.reduce((a, b) => a + b, 0);
  if (sumIn !== sumOut) return false;

  const n = inDegrees.length;
  const remainingIn = [...inDegrees];
  const remainingOut = [...outDegrees];
  const adjacency = Array(n).fill(null).map(() => Array(n).fill(false));
  const nodeIndices = Array.from({ length: n }, (_, i) => i);

  while (true) {
    nodeIndices.sort((a, b) => remainingOut[b] - remainingOut[a]);
    const current = nodeIndices.find(node => remainingOut[node] > 0);
    if (current === undefined) break;

    const required = remainingOut[current];
    remainingOut[current] = 0;

    if (required < 0 || required > n - 1) return false;

    const eligibleTargets = nodeIndices
      .filter(
        node =>
          node !== current &&
          !adjacency[current][node] &&
          !adjacency[node][current] &&
          remainingIn[node] > 0
      )
      .sort((a, b) => remainingIn[b] - remainingIn[a]);

    if (eligibleTargets.length < required) return false;

    for (let i = 0; i < required; i++) {
      const target = eligibleTargets[i];
      adjacency[current][target] = true;
      remainingIn[target]--;
      if (remainingIn[target] < 0) return false;
    }
  }

  return remainingIn.every(d => d === 0);
};

// Constructs an undirected graph from a degree sequence
export const constructUndirectedGraph = (sequence: number[]): GraphData | null => {
  if (!isUndirectedGraphic(sequence)) return null;

  const n = sequence.length;
  const nodes: Node[] = Array.from({ length: n }, (_, i) => ({ id: `v${i + 1}` }));
  const links: Link[] = [];
  let degrees = sequence.map((d, i) => ({ index: i, degree: d }));

  while (degrees.some(d => d.degree > 0)) {
    degrees.sort((a, b) => b.degree - a.degree);
    const current = degrees[0];
    degrees = degrees.slice(1);

    for (let i = 0; i < current.degree; i++) {
      const neighbor = degrees[i];
      links.push({
        source: `v${current.index + 1}`,
        target: `v${neighbor.index + 1}`,
      });
      neighbor.degree--;
    }
  }

  return { nodes, links };
};

// Constructs a directed graph from in/out-degree sequences
export const constructDirectedGraph = (
  inDegrees: number[],
  outDegrees: number[]
): GraphData | null => {
  if (!isDirectedGraphic(inDegrees, outDegrees)) return null;

  const n = inDegrees.length;
  const nodes: Node[] = Array.from({ length: n }, (_, i) => ({ id: `v${i + 1}` }));
  const links: Link[] = [];
  const remainingIn = [...inDegrees];
  const remainingOut = [...outDegrees];
  const adjacency = Array(n).fill(null).map(() => Array(n).fill(false));
  const nodeIndices = Array.from({ length: n }, (_, i) => i);

  while (true) {
    nodeIndices.sort((a, b) => remainingOut[b] - remainingOut[a]);
    const current = nodeIndices.find(node => remainingOut[node] > 0);
    if (current === undefined) break;

    const required = remainingOut[current];
    remainingOut[current] = 0;

    const eligibleTargets = nodeIndices
      .filter(
        node =>
          node !== current &&
          !adjacency[current][node] &&
          !adjacency[node][current] &&
          remainingIn[node] > 0
      )
      .sort((a, b) => remainingIn[b] - remainingIn[a]);

    for (let i = 0; i < required; i++) {
      const target = eligibleTargets[i];
      links.push({ source: `v${current + 1}`, target: `v${target + 1}` });
      adjacency[current][target] = true;
      remainingIn[target]--;
    }
  }

  return { nodes, links };
};

// Generates the line graph from a given graph
export const generateLineGraph = (graph: GraphData, directed: boolean): GraphData => {
  const edgeNodes: Node[] = graph.links.map((link, index) => ({
    id: `e${index + 1}[${link.source},${link.target}]`,
  }));

  const edgeLinks: Link[] = [];
  for (let i = 0; i < graph.links.length; i++) {
    for (let j = 0; j < graph.links.length; j++) {
      if (i === j) continue;

      if (directed) {
        if (graph.links[i].target === graph.links[j].source) {
          edgeLinks.push({ source: edgeNodes[i].id, target: edgeNodes[j].id });
        }
      } else {
        if (
          graph.links[i].source === graph.links[j].source ||
          graph.links[i].source === graph.links[j].target ||
          graph.links[i].target === graph.links[j].source ||
          graph.links[i].target === graph.links[j].target
        ) {
          edgeLinks.push({ source: edgeNodes[i].id, target: edgeNodes[j].id });
        }
      }
    }
  }

  return { nodes: edgeNodes, links: edgeLinks };
};

// Checks connectivity properties of a graph
export const checkConnectivity = (graph: GraphData, directed: boolean): Connectivity => {
  const n = graph.nodes.length;
  if (n === 0) return { strongly: true, weakly: true, unilaterally: true };

  const adj: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const reverseAdj: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  graph.links.forEach(({ source, target }) => {
    const s = parseInt((source as string).slice(1)) - 1;
    const t = parseInt((target as string).slice(1)) - 1;
    adj[s][t] = true;
    reverseAdj[t][s] = true;
    if (!directed) {
      adj[t][s] = true;
      reverseAdj[s][t] = true;
    }
  });

  const dfs = (start: number, adjacency: boolean[][]) => {
    const visited = Array(n).fill(false);
    const stack = [start];
    visited[start] = true;
    while (stack.length) {
      const node = stack.pop()!;
      for (let neighbor = 0; neighbor < n; neighbor++) {
        if (adjacency[node][neighbor] && !visited[neighbor]) {
          visited[neighbor] = true;
          stack.push(neighbor);
        }
      }
    }
    return visited;
  };

  const stronglyVisited = dfs(0, adj);
  const stronglyConnected = stronglyVisited.every(v => v) && dfs(0, reverseAdj).every(v => v);

  const undirectedAdj = adj.map((row, i) => row.map((val, j) => val || reverseAdj[i][j]));
  const weaklyVisited = dfs(0, undirectedAdj);
  const weaklyConnected = weaklyVisited.every(v => v);

  let unilaterallyConnected = true;
  if (!stronglyConnected && weaklyConnected) {
    const reachable = Array(n).fill(null).map((_, i) => dfs(i, adj));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && !reachable[i][j] && !reachable[j][i]) {
          unilaterallyConnected = false;
          break;
        }
      }
      if (!unilaterallyConnected) break;
    }
  } else {
    unilaterallyConnected = stronglyConnected;
  }

  return {
    strongly: directed ? stronglyConnected : weaklyConnected,
    weakly: weaklyConnected,
    unilaterally: directed ? unilaterallyConnected : false,
  };
};