import React, { useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

type GraphType = 'undirected' | 'directed';
type Node = { id: string };
type Link = { source: string; target: string };
interface Clique extends Array<string> {
    color?: string;
}

const GraphAnalyzer: React.FC = () => {
    const [graphType, setGraphType] = useState<GraphType>('undirected');
    const [undirectedInput, setUndirectedInput] = useState<string>('');
    const [inDegreesInput, setInDegreesInput] = useState<string>('');
    const [outDegreesInput, setOutDegreesInput] = useState<string>('');
    const [isGraphic, setIsGraphic] = useState<boolean | null>(null);
    const [originalGraph, setOriginalGraph] = useState<{ nodes: Node[]; links: Link[] } | null | any>(null);
    const [lineGraph, setLineGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
    const [connectivity, setConnectivity] = useState<{
        strongly: boolean;
        weakly: boolean;
        unilaterally: boolean;
    } | null>(null);
    const [allCliques, setAllCliques] = useState<Clique[] | null>(null);
    const [maximalCliques, setMaximalCliques] = useState<Clique[] | null>(null);
    const [maxIndependentSets, setMaxIndependentSets] = useState<Clique[] | null>(null);
    const [minVertexCover, setMinVertexCover] = useState<Clique | null>(null);

    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const getAdjacencyMatrix = (graph: { nodes: Node[]; links: Link[] }, directed: boolean): boolean[][] => {
        const n = graph.nodes.length;
        const adj = Array.from({ length: n }, () => Array(n).fill(false));
        graph.links.forEach(({ source, target }) => {
            const s = parseInt((source as string).slice(1)) - 1;
            const t = parseInt((target as string).slice(1)) - 1;
            adj[s][t] = true;
            if (!directed) adj[t][s] = true;
        });
        return adj;
    };

    const getComplementGraph = (graph: { nodes: Node[]; links: Link[] }): { nodes: Node[]; links: Link[] } => {
        const nodes = [...graph.nodes];
        const adj = getAdjacencyMatrix(graph, false);
        const n = nodes.length;
        const links: Link[] = [];

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (!adj[i][j]) {
                    links.push({ source: nodes[i].id, target: nodes[j].id });
                }
            }
        }

        return { nodes, links };
    };

    const findAllCliques = (graph: { nodes: Node[]; links: Link[] }): Clique[] => {
        const adj = getAdjacencyMatrix(graph, false);
        const result: Clique[] = [];

        const nextClique = (C: string[], P: string[]) => {
            if (C.length > 2) {
                result.push([...C]);
            }

            if (P.length === 0) return;

            for (let i = 0; i < P.length; i++) {
                const v = P[i];
                const newP = P.slice(i + 1).filter(w =>
                    adj[parseInt(v.slice(1)) - 1][parseInt(w.slice(1)) - 1]
                );
                C.push(v);
                nextClique(C, newP);
                C.pop();
            }
        };

        const C: string[] = [];
        const P = graph.nodes.map(node => node.id);
        nextClique(C, P);
        return result;
    };

    const findMaximalCliques = (graph: { nodes: Node[]; links: Link[] }): Clique[] => {
        const adj = getAdjacencyMatrix(graph, false);
        const result: Clique[] = [];

        const simpleNextMaximalClique = (C: string[], P: string[], S: string[]) => {
            if (P.length === 0 && S.length === 0) {
                if (C.length > 0) result.push([...C]);
                return;
            }

            for (let i = 0; i < P.length; i++) {
                const v = P[i];
                const newP = P.slice(i + 1).filter(w =>
                    adj[parseInt(v.slice(1)) - 1][parseInt(w.slice(1)) - 1]
                );
                const newS = S.filter(w =>
                    adj[parseInt(v.slice(1)) - 1][parseInt(w.slice(1)) - 1]
                );
                C.push(v);
                simpleNextMaximalClique(C, newP, newS);
                C.pop();
                S.push(v);
            }
        };

        const C: string[] = [];
        const P = graph.nodes.map(node => node.id);
        const S: string[] = [];
        simpleNextMaximalClique(C, P, S);
        return result;
    };

    const findMaxIndependentSets = (graph: { nodes: Node[]; links: Link[] }): Clique[] => {
        const complementGraph = getComplementGraph(graph);
        const maximalCliques = findMaximalCliques(complementGraph);
        if (maximalCliques.length === 0) return [];
        const maxSize = Math.max(...maximalCliques.map(clique => clique.length));
        return maximalCliques.filter(clique => clique.length === maxSize);
    };

    const findMinVertexCover = (graph: { nodes: Node[]; links: Link[] }): Clique => {
        const cover: string[] = [];
        const edges = [...graph.links];
        const nodes = graph.nodes.map(node => node.id);

        while (edges.length > 0) {
            // Count uncovered edges incident to each vertex
            const edgeCount = nodes.map(node => ({
                node,
                count: edges.filter(link =>
                    (link.source === node || link.target === node) &&
                    !cover.includes(link.source) &&
                    !cover.includes(link.target)
                ).length
            }));

            // Select vertex with maximum uncovered edges
            const maxNode = edgeCount.reduce((max, curr) =>
                curr.count > max.count ? curr : max,
                { node: '', count: -1 }
            );

            if (maxNode.count === 0) break;

            cover.push(maxNode.node);

            // Remove covered edges
            const newEdges = edges.filter(link =>
                link.source !== maxNode.node && link.target !== maxNode.node
            );
            edges.length = 0;
            edges.push(...newEdges);
        }

        return cover;
    };

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

    type DNode = { id: number; out: number; in: number };

    const isDirectedGraphic = (inDeg: number[], outDeg: number[]): boolean => {
        if (inDeg.length !== outDeg.length) return false;

        const n = inDeg.length;
        const sumIn = inDeg.reduce((a, b) => a + b, 0);
        const sumOut = outDeg.reduce((a, b) => a + b, 0);
        if (sumIn !== sumOut) return false;

        const nodes: DNode[] = Array.from({ length: n }, (_, i) => ({
            id: i,
            out: outDeg[i],
            in: inDeg[i],
        }));

        while (true) {
            // remove finished vertices
            const active = nodes.filter(v => v.out > 0 || v.in > 0);
            if (active.length === 0) return true;

            // pick source with max out
            active.sort((a, b) => b.out - a.out || a.id - b.id);
            const src = active[0];
            if (src.out === 0) return false;

            const k = src.out;
            if (k > active.length - 1) return false;

            // choose k targets with max in, excluding src
            const targets = active
                .filter(v => v.id !== src.id && v.in > 0)
                .sort((a, b) => b.in - a.in || a.id - b.id)
                .slice(0, k);

            if (targets.length < k) return false;

            for (const t of targets) {
                t.in -= 1;
                if (t.in < 0) return false;
                nodes[t.id].in = t.in;
            }

            nodes[src.id].out = 0;
        }
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

    const constructDirectedGraph = (
        inDeg: number[],
        outDeg: number[]
    ): { nodes: Node[]; links: Link[] } | null => {
        if (!isDirectedGraphic(inDeg, outDeg)) return null;

        const n = inDeg.length;
        const resultNodes: Node[] = Array.from({ length: n }, (_, i) => ({ id: `v${i + 1}` }));
        const links: Link[] = [];

        const nodes: DNode[] = Array.from({ length: n }, (_, i) => ({
            id: i,
            out: outDeg[i],
            in: inDeg[i],
        }));

        while (nodes.some(v => v.out > 0)) {
            const active = nodes.filter(v => v.out > 0 || v.in > 0);
            active.sort((a, b) => b.out - a.out || a.id - b.id);
            const src = active[0];
            const k = src.out;

            const targets = active
                .filter(v => v.id !== src.id && v.in > 0)
                .sort((a, b) => b.in - a.in || a.id - b.id)
                .slice(0, k);

            for (const t of targets) {
                t.in -= 1;
                nodes[t.id].in = t.in;
                links.push({ source: `v${src.id + 1}`, target: `v${t.id + 1}` });
            }

            nodes[src.id].out = 0;
        }

        return { nodes: resultNodes, links };
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

    const checkConnectivity = (
        graph: { nodes: Node[]; links: Link[] },
        directed: boolean
    ): { strongly: boolean; weakly: boolean; unilaterally: boolean } => {
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
            unilaterally: directed ? unilaterallyConnected : false
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsGraphic(null);
        setOriginalGraph(null);
        setLineGraph(null);
        setAllCliques(null);
        setMaximalCliques(null);
        setMaxIndependentSets(null);
        setMinVertexCover(null);
        setEulerianTrail(null);
        setConnectivity(null);

        if (graphType === 'undirected') {
            const sequence = undirectedInput.split(',').map(Number);
            const valid = isUndirectedGraphic(sequence);
            setIsGraphic(valid);

            if (valid) {
                const graph = constructUndirectedGraph(sequence);
                if (graph) {
                    setOriginalGraph(graph);
                    setConnectivity(checkConnectivity(graph, false));
                    setLineGraph(generateLineGraph(graph, false));
                    setAllCliques(findAllCliques(graph));
                    setMaximalCliques(findMaximalCliques(graph));
                    setMaxIndependentSets(findMaxIndependentSets(graph));
                    setMinVertexCover(findMinVertexCover(graph));

                    const trail = findEulerianTrail(graph, false);
                    setEulerianTrail(trail);
                }
            }
        } else {
            const inDegrees = inDegreesInput.split(',').map(Number);
            const outDegrees = outDegreesInput.split(',').map(Number);
            const valid = isDirectedGraphic(inDegrees, outDegrees);
            setIsGraphic(valid);

            if (valid) {
                const graph = constructDirectedGraph(inDegrees, outDegrees);
                if (graph) {
                    setOriginalGraph(graph);
                    setConnectivity(checkConnectivity(graph, true));
                    setLineGraph(generateLineGraph(graph, true));

                    const trail = findEulerianTrail(graph, true);
                    setEulerianTrail(trail);
                }
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
        ctx.fillStyle = node.color || (graphType === 'directed' ? '#69b3a2' : '#4287f5');
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, node.y);
    };

    const nodePaintWithCliques = (cliques: Clique[] | null) => (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.id;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const radius = 15 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

        let color = '#4287f5';
        if (cliques) {
            const cliqueIndex = cliques.findIndex(clique => clique.includes(node.id));
            if (cliqueIndex !== -1) {
                if (!cliques[cliqueIndex].color) {
                    cliques[cliqueIndex].color = getRandomColor();
                }
                color = cliques[cliqueIndex].color;
            }
        }

        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, node.y);
    };

    const nodePaintWithIndependentSets = (independentSets: Clique[] | null) => (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.id;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const radius = 15 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

        let color = '#4287f5';
        if (independentSets) {
            const setIndex = independentSets.findIndex(set => set.includes(node.id));
            if (setIndex !== -1) {
                if (!independentSets[setIndex].color) {
                    independentSets[setIndex].color = getRandomColor();
                }
                color = independentSets[setIndex].color;
            }
        }

        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, node.y);
    };

    const nodePaintWithVertexCover = (vertexCover: Clique | null) => (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.id;
        const fontSize = 12 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const radius = 15 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

        const color = vertexCover && vertexCover.includes(node.id) ? '#ff4500' : '#4287f5';
        ctx.fillStyle = color;
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.fillText(label, node.x, node.y);
    };

    const calculateCurvature = (link: Link | any, allLinks: Link[]) => {
        const reverseExists = allLinks.some(l =>
            l.source === link.target && l.target === link.source
        );
        return reverseExists ? 0.3 : 0;
    };

    const [eulerianTrail, setEulerianTrail] = useState<string[] | null>(null);

    const findEulerianTrail = (graph: { nodes: Node[], links: Link[] }, directed: boolean): string[] | null => {
        const adj: Map<string, string[]> = new Map();
        graph.nodes.forEach(node => adj.set(node.id, []));
        graph.links.forEach(({ source, target }) => {
            adj.get(source as string)!.push(target as string);
            if (!directed) adj.get(target as string)!.push(source as string);
        });

        // degree helpers
        const indeg = new Map<string, number>();
        const outdeg = new Map<string, number>();
        graph.nodes.forEach(n => { indeg.set(n.id, 0); outdeg.set(n.id, 0); });
        graph.links.forEach(({ source, target }) => {
            outdeg.set(source as string, (outdeg.get(source as string) ?? 0) + 1);
            indeg.set(target as string, (indeg.get(target as string) ?? 0) + 1);
            if (!directed) {
                outdeg.set(target as string, (outdeg.get(target as string) ?? 0) + 1);
                indeg.set(source as string, (indeg.get(source as string) ?? 0) + 1);
            }
        });

        // choose start
        let start = graph.nodes[0].id;
        if (!directed) {
            const odds = graph.nodes.filter(n => (outdeg.get(n.id) ?? 0) % 2 === 1).map(n => n.id);
            if (odds.length > 2) return null;
            if (odds.length === 2 || odds.length === 1) start = odds[0];
        } else {
            const startCandidates = graph.nodes.filter(n => (outdeg.get(n.id) ?? 0) === (indeg.get(n.id) ?? 0) + 1);
            const endCandidates = graph.nodes.filter(n => (indeg.get(n.id) ?? 0) === (outdeg.get(n.id) ?? 0) + 1);
            if (startCandidates.length > 1 || endCandidates.length > 1) return null;
            if (startCandidates.length === 1) start = startCandidates[0].id;
        }

        const trail: string[] = [];

        const iter = (u: string) => {
            while (adj.get(u)!.length > 0) {
                const v = adj.get(u)!.pop()!;
                if (!directed) {
                    const neighbors = adj.get(v)!;
                    const index = neighbors.indexOf(u);
                    if (index !== -1) {
                        neighbors.splice(index, 1);
                    }
                }
                iter(v);
            }
            trail.push(u);
        };

        iter(start);
        trail.reverse();

        // Check if all edges were traversed
        if (trail.length !== graph.links.length + 1) {
            return null;
        }

        return trail;
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
                            <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
                                <ForceGraph2D
                                    graphData={originalGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaint}
                                    linkDirectionalArrowLength={graphType === 'directed' ? 3.5 : 0}
                                    linkDirectionalArrowRelPos={1}
                                    linkCurvature={link => calculateCurvature(link, originalGraph?.links || [])}
                                    cooldownTicks={100}
                                    cooldownTime={2000}
                                />
                            </div>
                            <div>
                                <p><strong>Connectivity:</strong></p>
                                {graphType === 'directed' ? (
                                    <>
                                        <p>Strongly Connected: {connectivity?.strongly ? 'Yes' : 'No'}</p>
                                        <p>Weakly Connected: {connectivity?.weakly ? 'Yes' : 'No'}</p>
                                        <p>One-Way Connected: {connectivity?.unilaterally ? 'Yes' : 'No'}</p>
                                    </>
                                ) : (
                                    <p>Connected: {connectivity?.strongly ? 'Yes' : 'No'}</p>
                                )}
                            </div>
                        </>
                    )}

                    {isGraphic && lineGraph && graphType === 'undirected' && (
                        <>
                            <h3>Line Graph</h3>
                            <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
                                <ForceGraph2D
                                    graphData={lineGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaint}
                                    linkDirectionalArrowLength={0}
                                    linkDirectionalArrowRelPos={1}
                                    cooldownTicks={100}
                                    cooldownTime={2000}
                                />
                            </div>
                        </>
                    )}

                    {isGraphic && graphType === 'undirected' && allCliques && (
                        <>
                            <h3>All Cliques</h3>
                            <p>Found {allCliques.length} cliques: {allCliques.map(clique => `[${clique.join(', ')}]`).join(', ')}</p>
                            <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
                                <ForceGraph2D
                                    graphData={originalGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaintWithCliques(allCliques)}
                                    linkDirectionalArrowLength={0}
                                    linkDirectionalArrowRelPos={1}
                                    cooldownTicks={100}
                                    cooldownTime={2000}
                                />
                            </div>
                        </>
                    )}

                    {isGraphic && graphType === 'undirected' && maximalCliques && (
                        <>
                            <h3>Maximal Cliques</h3>
                            <p>Found {maximalCliques.length} maximal cliques: {maximalCliques.map(clique => `[${clique.join(', ')}]`).join(', ')}</p>
                            <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
                                <ForceGraph2D
                                    graphData={originalGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaintWithCliques(maximalCliques)}
                                    linkDirectionalArrowLength={0}
                                    linkDirectionalArrowRelPos={1}
                                    cooldownTicks={100}
                                    cooldownTime={2000}
                                />
                            </div>
                        </>
                    )}

                    {isGraphic && graphType === 'undirected' && maxIndependentSets && (
                        <>
                            <h3>Maximum Independent Sets</h3>
                            <p>Found {maxIndependentSets.length} maximum independent sets: {maxIndependentSets.map(set => `[${set.join(', ')}]`).join(', ')}</p>
                            <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
                                <ForceGraph2D
                                    graphData={originalGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaintWithIndependentSets(maxIndependentSets)}
                                    linkDirectionalArrowLength={0}
                                    linkDirectionalArrowRelPos={1}
                                    cooldownTicks={100}
                                    cooldownTime={2000}
                                />
                            </div>
                        </>
                    )}

                    {isGraphic && graphType === 'undirected' && minVertexCover && (
                        <>
                            <h3>Minimum Vertex Cover</h3>
                            <p>Vertex Cover: [{minVertexCover.join(', ')}]</p>
                            <div style={{ width: '600px', height: '400px', border: '1px solid #ccc' }}>
                                <ForceGraph2D
                                    graphData={originalGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaintWithVertexCover(minVertexCover)}
                                    linkDirectionalArrowLength={0}
                                    linkDirectionalArrowRelPos={1}
                                    cooldownTicks={100}
                                    cooldownTime={2000}
                                />
                            </div>
                        </>
                    )}

                    {isGraphic && originalGraph && eulerianTrail === null && (
                        <div
                            style={{
                                padding: "20px",
                                marginTop: "20px",
                                backgroundColor: "#ffe6e6",
                                border: "2px solid #ff4d4f",
                                borderRadius: "8px",
                                color: "#a8071a",
                                fontWeight: "bold",
                                fontSize: "16px",
                                textAlign: "center"
                            }}
                        >
                            ⚠️ No Eulerian path or cycle exists in this graph.
                        </div>
                    )}

                    {eulerianTrail && originalGraph && (
                        <div>
                            <h3>Eulerian {eulerianTrail[0] === eulerianTrail[eulerianTrail.length - 1] ? "Cycle" : "Path"}</h3>
                            <p>{eulerianTrail.join(" → ")}</p>
                            <div style={{ width: "600px", height: "400px", border: "1px solid #ccc" }}>
                                <ForceGraph2D
                                    graphData={originalGraph}
                                    width={600}
                                    height={400}
                                    nodeCanvasObject={nodePaint}
                                    linkDirectionalArrowLength={graphType === 'directed' ? 3.5 : 0}
                                    linkDirectionalArrowRelPos={1}
                                    linkCurvature={link => calculateCurvature(link, originalGraph?.links || [])}
                                    linkColor={(link: Link) => {
                                        // highlight if part of trail
                                        for (let i = 0; i < eulerianTrail.length - 1; i++) {
                                            if (link.source === eulerianTrail[i] && link.target === eulerianTrail[i + 1]) return "red";
                                            if (graphType === 'undirected' && link.target === eulerianTrail[i] && link.source === eulerianTrail[i + 1]) return "red";
                                        }
                                        return "#999";
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GraphAnalyzer;