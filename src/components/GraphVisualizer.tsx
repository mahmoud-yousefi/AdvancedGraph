import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphType, GraphData, Connectivity } from '../types/graph';

interface GraphVisualizerProps {
  graphType: GraphType;
  isGraphic: boolean | null;
  originalGraph: GraphData | null;
  lineGraph: GraphData | null;
  connectivity: Connectivity | null;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  graphType,
  isGraphic,
  originalGraph,
  lineGraph,
  connectivity,
}) => {
  const nodePaint = (
    node: any,
    ctx: CanvasRenderingContext2D,
    globalScale: number
  ) => {
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

  if (isGraphic === null) return null;

  return (
    <div className="mt-6">
      <p className="font-semibold">
        Graphic Sequence: {isGraphic ? 'Yes' : 'No'}
      </p>

      {isGraphic && originalGraph && (
        <>
          <h3 className="text-lg font-semibold mt-4">Original Graph</h3>
          <div className="w-[600px] h-[400px] border border-gray-300">
            <ForceGraph2D
              graphData={originalGraph}
              width={600}
              height={400}
              nodeCanvasObject={nodePaint}
              linkDirectionalArrowLength={graphType === 'directed' ? 3.5 : 0}
              linkDirectionalArrowRelPos={1}
              cooldownTicks={100}
              cooldownTime={2000}
            />
          </div>
          <div className="mt-2">
            <p className="font-semibold">Connectivity:</p>
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
          <h3 className="text-lg font-semibold mt-4">Line Graph</h3>
          <div className="w-[600px] h-[400px] border border-gray-300">
            <ForceGraph2D
              graphData={lineGraph}
              width={600}
              height={400}
              nodeCanvasObject={nodePaint}
              linkDirectionalArrowLength={0} // Line graph is undirected
              linkDirectionalArrowRelPos={1}
              cooldownTicks={100}
              cooldownTime={2000}
            />
          </div>
        </>
      )}
    </div>
  );
};