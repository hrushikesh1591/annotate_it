
import React, { useState } from 'react';
import type { Annotation, AnnotationType, Point } from '../types';

interface ControlsProps {
  onUndo: () => void;
  onClearCurrent: () => void;
  onClearAll: () => void;
  onComplete: () => void;
  image: HTMLImageElement | null;
  annotations: Annotation[];
  isDrawing: boolean;
  annotationMode: AnnotationType;
  onUndoAnnotation: () => void;
  onRedoAnnotation: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  onUndo, 
  onClearCurrent, 
  onClearAll, 
  onComplete, 
  image, 
  annotations, 
  isDrawing, 
  annotationMode,
  onUndoAnnotation,
  onRedoAnnotation,
  canUndo,
  canRedo,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormat, setSaveFormat] = useState<'png' | 'jpeg'>('png');

  const handleSaveImage = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    // Scale annotation elements based on image resolution for better visibility
    const scaleFactor = Math.max(1, image.naturalHeight / 720);

    annotations.forEach((ann) => {
       // Draw shape
       if (ann.type === 'polygon') {
        ctx.fillStyle = ann.color;
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
      } else { // 'point'
        const pointRadius = 7 * scaleFactor;
        const solidColor = ann.color.replace(/, [\d.]+\)/, ', 1)');
        
        ctx.fillStyle = ann.color;
        ctx.strokeStyle = solidColor;
        ctx.lineWidth = 2 * scaleFactor;

        ctx.beginPath();
        ctx.arc(ann.point.x, ann.point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
      
      // Draw label and arrow
      let anchorPoint: Point = ann.type === 'point' ? ann.point : ann.points[0];
      const labelPos = ann.labelPosition || { x: anchorPoint.x + 20, y: anchorPoint.y - 20 };
      
      // Label box
      const fontSize = 18 * scaleFactor;
      const horizontalPadding = 10 * scaleFactor;
      const boxHeight = 24 * scaleFactor;

      ctx.font = `bold ${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(ann.label);
      const boxWidth = textMetrics.width + (horizontalPadding * 2);
      const boxX = labelPos.x;
      const boxY = labelPos.y - boxHeight;
      
      ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
      ctx.strokeStyle = 'rgba(10, 10, 10, 1)';
      ctx.lineWidth = 1 * scaleFactor;
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxWidth, boxHeight);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ann.label, boxX + horizontalPadding, boxY + boxHeight / 2);

      // Arrow
      const lineStart = { x: boxX + boxWidth / 2, y: boxY + boxHeight };
      const lineEnd = anchorPoint;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2 * scaleFactor;
      ctx.beginPath();
      ctx.moveTo(lineStart.x, lineStart.y);
      ctx.lineTo(lineEnd.x, lineEnd.y);
      ctx.stroke();

      // Arrow head
      const arrowHeadSize = 9 * scaleFactor;
      const angle = Math.atan2(lineEnd.y - lineStart.y, lineEnd.x - lineStart.x);
      ctx.beginPath();
      ctx.moveTo(lineEnd.x, lineEnd.y);
      ctx.lineTo(lineEnd.x - arrowHeadSize * Math.cos(angle - Math.PI / 6), lineEnd.y - arrowHeadSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(lineEnd.x - arrowHeadSize * Math.cos(angle + Math.PI / 6), lineEnd.y - arrowHeadSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = 'black';
      ctx.fill();
    });

    const mimeType = `image/${saveFormat}`;
    const link = document.createElement('a');
    link.download = `annotated-image.${saveFormat}`;
    link.href = canvas.toDataURL(mimeType, saveFormat === 'jpeg' ? 0.92 : undefined);
    link.click();
    setShowSaveModal(false);
  };

  const saveAnnotationData = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = 'annotations.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-gray-800 p-4 rounded-lg shadow-md space-y-3">
        <h2 className="text-lg font-semibold text-gray-200">Actions</h2>
        
        {annotationMode === 'polygon' && isDrawing && (
          <button
            onClick={onComplete}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center"
          >
            Complete Polygon
          </button>
        )}

        {annotationMode === 'polygon' && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onUndo} disabled={!isDrawing} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed">Undo Point</button>
            <button onClick={onClearCurrent} disabled={!isDrawing} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed">Clear Current</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onUndoAnnotation}
            disabled={!canUndo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Undo Annotation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Undo
          </button>
          <button
            onClick={onRedoAnnotation}
            disabled={!canRedo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Redo Annotation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Redo
          </button>
        </div>

        <button onClick={onClearAll} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Clear All</button>

        <div className="pt-3 border-t border-gray-700">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Export</h3>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!image || annotations.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Save Annotated Image
            </button>
            <button
              onClick={saveAnnotationData}
              disabled={annotations.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Save Annotation Data (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Save Format Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-white">Save Image</h3>
            <fieldset className="mb-6">
              <legend className="mb-2 text-gray-300">Choose a format:</legend>
              <div className="flex flex-col space-y-2 text-gray-200">
                <label className="flex items-center space-x-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 cursor-pointer">
                  <input type="radio" name="format" value="png" checked={saveFormat === 'png'} onChange={() => setSaveFormat('png')} className="form-radio text-blue-500 bg-gray-900"/>
                  <span>PNG (Lossless, best quality)</span>
                </label>
                <label className="flex items-center space-x-3 p-2 rounded-md bg-gray-700 hover:bg-gray-600 cursor-pointer">
                  <input type="radio" name="format" value="jpeg" checked={saveFormat === 'jpeg'} onChange={() => setSaveFormat('jpeg')} className="form-radio text-blue-500 bg-gray-900"/>
                  <span>JPEG (Smaller file size)</span>
                </label>
              </div>
            </fieldset>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowSaveModal(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition duration-300">Cancel</button>
              <button onClick={handleSaveImage} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">Download</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Controls;