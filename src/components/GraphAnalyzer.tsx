import React, { useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

type GraphType = 'undirected' | 'directed';
type Node = { id: string };
type Link = { source: string; target: string };

const GraphAnalyzer: React.FC = () => {
  const [graphType, setGraphType] = useState<GraphType>('undirected');
  const [undirectedInput, setUndirectedInput] = useState<string>('');
  const [inDegreesInput, setInDegreesInput] = useState<string>('');
  const [outDegreesInput, setOutDegreesInput] = useState<string>('');
  const [isGraphic, setIsGraphic] = useState<boolean | null>(null);
  const [originalGraph, setOriginalGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
  const [lineGraph, setLineGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
  const [connectivity, setConnectivity] = useState<string>('');

  const isUndirectedGraphic = (sequence: number[]): boolean => {
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

  const isDirectedGraphic = (inDegrees: number[], outDegrees: number[]): boolean => {
    if (inDegrees.length !== outDegrees.length) return false;
    if (inDegrees.reduce((a, b) => a + b) !== outDegrees.reduce((a, b) => a + b)) return false;

    const n = inDegrees.length;
    let remainingIn = [...inDegrees];
    let remainingOut = [...outDegrees];

    for (let i = 0; i < n; i++) {
      remainingOut.sort((a, b) => b - a);
      remainingIn.sort((a, b) => b - a);

      const currentOut = remainingOut[i];
      if (currentOut < 0 || currentOut > n - 1) return false;

      for (let j = 0; j < currentOut; j++) {
        if (remainingIn[j] <= 0) return false;
        remainingIn[j]--;
      }
    }
    return remainingIn.every(d => d === 0);
  };

  const constructUndirectedGraph = (sequence: number[]): { nodes: Node[]; links: Link[] } | null => {
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

  const constructDirectedGraph = (inDegrees: number[], outDegrees: number[]): { nodes: Node[]; links: Link[] } | null => {
    if (!isDirectedGraphic(inDegrees, outDegrees)) return null;

    const n = inDegrees.length;
    const nodes: Node[] = Array.from({ length: n }, (_, i) => ({ id: `v${i + 1}` }));
    const links: Link[] = [];
    const remainingIn = [...inDegrees];
    const remainingOut = [...outDegrees];

    for (let i = 0; i < n; i++) {
      const currentOut = remainingOut[i];
      for (let j = 0; j < currentOut; j++) {
        const targetIndex = remainingIn.findIndex(d => d > 0);
        if (targetIndex === -1) return null;
        links.push({ source: `v${i + 1}`, target: `v${targetIndex + 1}` });
        remainingIn[targetIndex]--;
      }
    }

    return { nodes, links };
  };

  const generateLineGraph = (graph: { nodes: Node[]; links: Link[] }, directed: boolean): { nodes: Node[]; links: Link[] } => {
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
          if (graph.links[i].source === graph.links[j].source ||
              graph.links[i].source === graph.links[j].target ||
              graph.links[i].target === graph.links[j].source ||
              graph.links[i].target === graph.links[j].target) {
            edgeLinks.push({ source: edgeNodes[i].id, target: edgeNodes[j].id });
          }
        }
      }
    }

    return { nodes: edgeNodes, links: edgeLinks };
  };

  const checkConnectivity = (graph: { nodes: Node[]; links: Link[] }, directed: boolean): string => {
    const n = graph.nodes.length;
    if (n === 0) return 'Connected';

    const adj: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
    graph.links.forEach(({ source, target }) => {
      const s = parseInt((source as string).slice(1)) - 1;
      const t = parseInt((target as string).slice(1)) - 1;
      adj[s][t] = true;
      if (!directed) adj[t][s] = true;
    });

    const visited = Array(n).fill(false);
    const dfs = (node: number) => {
      visited[node] = true;
      for (let neighbor = 0; neighbor < n; neighbor++) {
        if ((adj[node][neighbor] || (!directed && adj[neighbor][node])) && !visited[neighbor]) {
          dfs(neighbor);
        }
      }
    };

    dfs(0);
    const connected = visited.every(v => v);
    if (!directed) return connected ? 'Connected' : 'Disconnected';

    const visitedReverse = Array(n).fill(false);
    const reverseAdj: boolean[][] = Array.from({ length: n }, () => []);
    graph.links.forEach(({ source, target }) => {
      const s = parseInt((source as string).slice(1)) - 1;
      const t = parseInt((target as string).slice(1)) - 1;
      reverseAdj[t][s] = true;
    });

    const dfsReverse = (node: number) => {
      visitedReverse[node] = true;
      for (let neighbor = 0; neighbor < n; neighbor++) {
        if (reverseAdj[node][neighbor] && !visitedReverse[neighbor]) {
          dfsReverse(neighbor);
        }
      }
    };

    dfsReverse(0);
    const stronglyConnected = visited.every(v => v) && visitedReverse.every(v => v);

    return stronglyConnected ? 'Strongly Connected' : connected ? 'Weakly Connected' : 'Disconnected';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGraphic(null);
    setOriginalGraph(null);
    setLineGraph(null);

    if (graphType === 'undirected') {
      const sequence = undirectedInput.split(',').map(Number);
      const valid = isUndirectedGraphic(sequence);
      setIsGraphic(valid);

      if (valid) {
        const graph = constructUndirectedGraph(sequence);
        setOriginalGraph(graph!);
        setConnectivity(checkConnectivity(graph!, false));
        setLineGraph(generateLineGraph(graph!, false));
      }
    } else {
      const inDegrees = inDegreesInput.split(',').map(Number);
      const outDegrees = outDegreesInput.split(',').map(Number);
      const valid = isDirectedGraphic(inDegrees, outDegrees);
      setIsGraphic(valid);

      if (valid) {
        const graph = constructDirectedGraph(inDegrees, outDegrees);
        setOriginalGraph(graph!);
        setConnectivity(checkConnectivity(graph!, true));
        setLineGraph(generateLineGraph(graph!, true));
      }
    }
  };

  const nodePaint = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const radius = 15 / globalScale;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = graphType === 'directed' ? '#69b3a2' : '#4287f5';
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.fillText(label, node.x, node.y);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Graph Analyzer</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="radio"
              value="undirected"
              checked={graphType === 'undirected'}
              onChange={() => setGraphType('undirected')}
            />
            Undirected Graph
          </label>
          <label style={{ marginLeft: '20px' }}>
            <input
              type="radio"
              value="directed"
              checked={graphType === 'directed'}
              onChange={() => setGraphType('directed')}
            />
            Directed Graph
          </label>
        </div>

        {graphType === 'undirected' ? (
          <input
            type="text"
            value={undirectedInput}
            onChange={(e) => setUndirectedInput(e.target.value)}
            placeholder="Enter degree sequence (e.g., 3,3,2,2)"
            style={{ width: '300px', padding: '8px' }}
          />
        ) : (
          <>
            <input
              type="text"
              value={inDegreesInput}
              onChange={(e) => setInDegreesInput(e.target.value)}
              placeholder="Enter in-degrees (e.g., 2,1,1)"
              style={{ width: '300px', padding: '8px', marginRight: '10px' }}
            />
            <input
              type="text"
              value={outDegreesInput}
              onChange={(e) => setOutDegreesInput(e.target.value)}
              placeholder="Enter out-degrees (e.g., 1,2,1)"
              style={{ width: '300px', padding: '8px' }}
            />
          </>
        )}

        <button type="submit" style={{ padding: '8px 16px', marginLeft: '10px' }}>
          Analyze
        </button>
      </form>

      {isGraphic !== null && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Graphic Sequence:</strong> {isGraphic ? 'Yes' : 'No'}</p>

          {isGraphic && originalGraph && (
            <>
              <h3>Original Graph</h3>
              <ForceGraph2D
                graphData={originalGraph}
                width={400}
                height={300}
                nodeCanvasObject={nodePaint}
                linkDirectionalArrowLength={graphType === 'directed' ? 3.5 : 0}
                linkDirectionalArrowRelPos={1}
              />
              <p><strong>Connectivity:</strong> {connectivity}</p>
            </>
          )}

          {isGraphic && lineGraph && (
            <>
              <h3>Line Graph</h3>
              <ForceGraph2D
                graphData={lineGraph}
                width={400}
                height={300}
                nodeCanvasObject={nodePaint}
                linkDirectionalArrowLength={graphType === 'directed' ? 3.5 : 0}
                linkDirectionalArrowRelPos={1}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GraphAnalyzer;