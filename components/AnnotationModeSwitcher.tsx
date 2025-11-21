import React from 'react';
import type { AnnotationType } from '../types';

interface AnnotationModeSwitcherProps {
  mode: AnnotationType;
  setMode: (mode: AnnotationType) => void;
}

const AnnotationModeSwitcher: React.FC<AnnotationModeSwitcherProps> = ({ mode, setMode }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-3 text-gray-200">Annotation Mode</h2>
      <div className="flex bg-gray-700 rounded-md p-1">
        <button
          onClick={() => setMode('point')}
          aria-pressed={mode === 'point'}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-200 ${
            mode === 'point' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          Point
        </button>
        <button
          onClick={() => setMode('polygon')}
          aria-pressed={mode === 'polygon'}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-200 ${
            mode === 'polygon' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-600'
          }`}
        >
          Polygon
        </button>
      </div>
    </div>
  );
};

export default AnnotationModeSwitcher;