import React, { useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

type GraphType = 'undirected' | 'directed';
type Node = { id: string };
type Link = { source: string; target: string };
type Clique = string[]; // Array of node IDs in a clique

const GraphAnalyzer: React.FC = () => {
    const [graphType, setGraphType] = useState<GraphType>('undirected');
    const [undirectedInput, setUndirectedInput] = useState<string>('');
    const [inDegreesInput, setInDegreesInput] = useState<string>('');
    const [outDegreesInput, setOutDegreesInput] = useState<string>('');
    const [isGraphic, setIsGraphic] = useState<boolean | null>(null);
    const [originalGraph, setOriginalGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
    const [lineGraph, setLineGraph] = useState<{ nodes: Node[]; links: Link[] } | null>(null);
    const [connectivity, setConnectivity] = useState<{
        strongly: boolean;
        weakly: boolean;
        unilaterally: boolean;
    } | null>(null);
    const [allCliques, setAllCliques] = useState<Clique[] | null>(null);
    const [maximalCliques, setMaximalCliques] = useState<Clique[] | null>(null);

    // Helper to generate random color for clique visualization
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    // Convert graph to adjacency matrix
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

    // All Clique Algorithm (Backtracking)
    const findAllCliques = (graph: { nodes: Node[]; links: Link[] }): Clique[] => {
        const adj = getAdjacencyMatrix(graph, false);
        const n = graph.nodes.length;
        const result: Clique[] = [];

        const nextClique = (C: string[], P: string[]) => {
            // Report non-empty cliques
            if (C.length > 0) {
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

    // Simple All Maximal Clique Algorithm (Bron-Kerbosch)
    const findMaximalCliques = (graph: { nodes: Node[]; links: Link[] }): Clique[] => {
        const adj = getAdjacencyMatrix(graph, false);
        const n = graph.nodes.length;
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
    
            // Modified eligibility check: allow reverse edges but prevent parallel edges
            const eligibleTargets = nodeIndices
                .filter(node =>
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
        const adjacency = Array(n).fill(null).map(() => Array(n).fill(false));
        const nodeIndices = Array.from({ length: n }, (_, i) => i);

        while (true) {
            nodeIndices.sort((a, b) => remainingOut[b] - remainingOut[a]);
            const current = nodeIndices.find(node => remainingOut[node] > 0);
            if (current === undefined) break;

            const required = remainingOut[current];
            remainingOut[current] = 0;
            const eligibleTargets = nodeIndices
                .filter(node =>
                    node !== current &&
                    !adjacency[current][node] &&  // Only check current->node direction
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

        if (graphType === 'undirected') {
            const sequence = undirectedInput.split(',').map(Number);
            const valid = isUndirectedGraphic(sequence);
            setIsGraphic(valid);

            if (valid) {
                const graph = constructUndirectedGraph(sequence);
                setOriginalGraph(graph!);
                setConnectivity(checkConnectivity(graph!, false));
                setLineGraph(generateLineGraph(graph!, false));
                setAllCliques(findAllCliques(graph!));
                setMaximalCliques(findMaximalCliques(graph!));
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

        // Assign color based on cliques
        let color = '#4287f5'; // Default color
        if (cliques) {
            const cliqueIndex = cliques.findIndex(clique => clique.includes(node.id));
            if (cliqueIndex !== -1) {
                // Cache color per clique to ensure consistency
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

    const calculateCurvature = (link: Link, allLinks: Link[]) => {
        const reverseExists = allLinks.some(l => 
            l.source === link.target && l.target === link.source
        );
        return reverseExists ? 0.3 : 0;
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
                </div>
            )}
        </div>
    );
};

export default GraphAnalyzer;