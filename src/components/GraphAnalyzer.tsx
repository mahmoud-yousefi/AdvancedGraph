import React, { useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

type Node = { id: string };
type Link = { source: string; target: string };

const GraphAnalyzer: React.FC = () => {
  const [sequenceInput, setSequenceInput] = useState<string>('');
  const [isGraphic, setIsGraphic] = useState<boolean | null>(null);
  const [originalGraph, setOriginalGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
  const [lineGraph, setLineGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
  const [originalConnected, setOriginalConnected] = useState<boolean | null>(null);
  const [lineConnected, setLineConnected] = useState<boolean | null>(null);

  const isGraphicSequence = (sequence: number[]): boolean => {
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

  const constructGraph = (sequence: number[]): { nodes: Node[]; links: Link[] } | null => {
    if (!isGraphicSequence(sequence)) return null;

    const n = sequence.length;
    const adj: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
    const nodes: Node[] = Array.from({ length: n }, (_, i) => ({ id: `v${i + 1}` }));
    const links: Link[] = [];
    let degrees = sequence.map((degree, index) => ({ index, degree }));

    while (degrees.some(n => n.degree > 0)) {
      degrees.sort((a, b) => b.degree - a.degree);
      const current = degrees[0];
      degrees = degrees.slice(1);

      for (let i = 0; i < current.degree; i++) {
        const neighbor = degrees[i];
        adj[current.index][neighbor.index] = true;
        adj[neighbor.index][current.index] = true;
        links.push({ source: `v${current.index + 1}`, target: `v${neighbor.index + 1}` });
        neighbor.degree--;
      }
    }

    return { nodes, links };
  };

  const generateLineGraph = (adj: boolean[][]): { nodes: Node[]; links: Link[] } => {
    const edges: [string, string][] = [];
    const n = adj.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (adj[i][j]) edges.push([`v${i + 1}`, `v${j + 1}`]);
      }
    }

    const nodes: Node[] = edges.map(([u, v], idx) => ({ id: `e${idx + 1}(${u},${v})` }));
    const links: Link[] = [];

    for (let i = 0; i < edges.length; i++) {
      const [u1, v1] = edges[i];
      for (let j = i + 1; j < edges.length; j++) {
        const [u2, v2] = edges[j];
        if (new Set([u1, v1, u2, v2]).size < 4) {
          links.push({ source: `e${i + 1}(${u1},${v1})`, target: `e${j + 1}(${u2},${v2})` });
        }
      }
    }

    return { nodes, links };
  };

  const isConnected = (adj: boolean[][]): boolean => {
    if (adj.length === 0) return true;
    const visited: boolean[] = Array(adj.length).fill(false);
    const queue: number[] = [0];
    visited[0] = true;

    while (queue.length > 0) {
      const node = queue.shift()!;
      for (let neighbor = 0; neighbor < adj.length; neighbor++) {
        if (adj[node][neighbor] && !visited[neighbor]) {
          visited[neighbor] = true;
          queue.push(neighbor);
        }
      }
    }
    return visited.every(v => v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sequence = sequenceInput.split(',').map(Number);
    const valid = isGraphicSequence(sequence);
    setIsGraphic(valid);

    if (valid) {
      // Construct original graph
      const constructedGraph = constructGraph(sequence);
      setOriginalGraph(constructedGraph);
      const adj = Array.from({ length: sequence.length }, () => Array(sequence.length).fill(false));
      constructedGraph?.links.forEach(({ source, target }) => {
        const s = parseInt((source as string).slice(1)) - 1;
        const t = parseInt((target as string).slice(1)) - 1;
        adj[s][t] = true;
        adj[t][s] = true;
      });
      setOriginalConnected(isConnected(adj));

      // Generate line graph
      if (constructedGraph) {
        const lineAdj = generateLineGraph(adj);
        setLineGraph(lineAdj);
        setLineConnected(isConnected(
          Array.from({ length: lineAdj.nodes.length }, () => Array(lineAdj.nodes.length).fill(false)).map((row, i) =>
            row.map((_, j) => lineAdj.links.some(({ source, target }) => 
              (source === lineAdj.nodes[i].id && target === lineAdj.nodes[j].id) ||
              (source === lineAdj.nodes[j].id && target === lineAdj.nodes[i].id)
            ))
          )
        ));
      }
    } else {
      setOriginalGraph(null);
      setLineGraph(null);
      setOriginalConnected(null);
      setLineConnected(null);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Graph Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={sequenceInput}
          onChange={(e) => setSequenceInput(e.target.value)}
          placeholder="Enter degree sequence (e.g., 3,3,2,2)"
          style={{ width: '300px', padding: '8px' }}
        />
        <button type="submit" style={{ padding: '8px 16px', marginLeft: '10px' }}>
          Analyze
        </button>
      </form>

      {isGraphic !== null && (
        <div style={{ marginTop: '20px' }}>
          <h2>Results</h2>
          <p><strong>Graphic Sequence:</strong> {isGraphic ? 'Yes' : 'No'}</p>

          {isGraphic && originalGraph && (
            <>
              <h3>Original Graph</h3>
              <ForceGraph2D
                graphData={originalGraph}
                width={400}
                height={300}
                nodeLabel="id"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
              />
              <p><strong>Connected:</strong> {originalConnected ? 'Yes' : 'No'}</p>
            </>
          )}

          {isGraphic && lineGraph && (
            <>
              <h3>Line Graph</h3>
              <ForceGraph2D
                graphData={lineGraph}
                width={400}
                height={300}
                nodeLabel="id"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
              />
              <p><strong>Connected:</strong> {lineConnected ? 'Yes' : 'No'}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GraphAnalyzer;