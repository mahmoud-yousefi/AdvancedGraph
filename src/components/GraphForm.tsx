import React, { useState } from 'react';
import { GraphType } from '../types/graph';

interface GraphFormProps {
  onSubmit: (
    graphType: GraphType,
    undirectedInput: string,
    inDegreesInput: string,
    outDegreesInput: string
  ) => void;
}

export const GraphForm: React.FC<GraphFormProps> = ({ onSubmit }) => {
  const [graphType, setGraphType] = useState<GraphType>('undirected');
  const [undirectedInput, setUndirectedInput] = useState('');
  const [inDegreesInput, setInDegreesInput] = useState('');
  const [outDegreesInput, setOutDegreesInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(graphType, undirectedInput, inDegreesInput, outDegreesInput);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="undirected"
            checked={graphType === 'undirected'}
            onChange={() => setGraphType('undirected')}
            className="mr-2"
          />
          Undirected Graph
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="directed"
            checked={graphType === 'directed'}
            onChange={() => setGraphType('directed')}
            className="mr-2"
          />
          Directed Graph
        </label>
      </div>

      {graphType === 'undirected' ? (
        <input
          type="text"
          value={undirectedInput}
          onChange={e => setUndirectedInput(e.target.value)}
          placeholder="Enter degree sequence (e.g., 3,3,2,2)"
          className="w-full p-2 border rounded-md"
        />
      ) : (
        <div className="flex space-x-2">
          <input
            type="text"
            value={inDegreesInput}
            onChange={e => setInDegreesInput(e.target.value)}
            placeholder="Enter in-degrees (e.g., 2,1,1)"
            className="w-1/2 p-2 border rounded-md"
          />
          <input
            type="text"
            value={outDegreesInput}
            onChange={e => setOutDegreesInput(e.target.value)}
            placeholder="Enter out-degrees (e.g., 1,2,1)"
            className="w-1/2 p-2 border rounded-md"
          />
        </div>
      )}

      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Analyze
      </button>
    </form>
  );
};