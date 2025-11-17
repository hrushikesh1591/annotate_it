import React, { useState, useCallback, useRef } from 'react';
import type { Annotation, Point, AnnotationType } from './types';
import { INITIAL_LABELS, DEFAULT_ANNOTATION_COLOR } from './constants';
import Header from './components/Header';
import ImageLoader from './components/ImageLoader';
import LabelTabs from './components/LabelTabs';
import AnnotationCanvas from './components/AnnotationCanvas';
import Controls from './components/Controls';
import Instructions from './components/Instructions';
import AnnotationModeSwitcher from './components/AnnotationModeSwitcher';

const initialLabelState = INITIAL_LABELS.map(label => ({
  name: label,
  color: DEFAULT_ANNOTATION_COLOR,
}));

const useHistory = <T extends any>(initialState: T) => {
  const [history, setHistory] = useState({
    past: [] as T[],
    present: initialState,
    future: [] as T[],
  });

  const setState = useCallback((action: T | ((prevState: T) => T)) => {
    setHistory(currentHistory => {
      const newPresent = typeof action === 'function' ? (action as (prevState: T) => T)(currentHistory.present) : action;

      if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
        return currentHistory;
      }
      
      const newPast = [...currentHistory.past, currentHistory.present];
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    });
  }, []);
  
  const undo = useCallback(() => {
    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      if (past.length === 0) {
        return currentHistory;
      }
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      const { past, present, future } = currentHistory;
      if (future.length === 0) {
        return currentHistory;
      }
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);
  
  const reset = useCallback((newInitialState: T) => {
     setHistory({
         past: [],
         present: newInitialState,
         future: [],
     });
  }, []);

  return { 
    state: history.present, 
    setState, 
    undo, 
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
};

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const {
    state: annotations,
    setState: setAnnotations,
    undo: undoAnnotation,
    redo: redoAnnotation,
    reset: resetAnnotations,
    canUndo,
    canRedo,
  } = useHistory<Annotation[]>([]);
  const [labels, setLabels] = useState(initialLabelState);
  const [activeLabelName, setActiveLabelName] = useState<string>(labels[0].name);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [annotationMode, setAnnotationMode] = useState<AnnotationType>('point');

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        resetAnnotations([]);
        setCurrentPoints([]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [resetAnnotations]);

  const completePolygon = useCallback(() => {
    if (currentPoints.length < 3) return;
    const activeLabel = labels.find(l => l.name === activeLabelName);
    if (!activeLabel) return;
    
    const anchorPoint = currentPoints[0];
    setAnnotations(prev => [...prev, {
      type: 'polygon',
      label: activeLabel.name,
      points: [...currentPoints],
      color: activeLabel.color,
      labelPosition: { x: anchorPoint.x + 20, y: anchorPoint.y - 20 },
    }]);
    setCurrentPoints([]);
  }, [currentPoints, activeLabelName, labels, setAnnotations]);

  const handleCanvasClick = useCallback((point: Point) => {
    if (annotationMode === 'point') {
      const activeLabel = labels.find(l => l.name === activeLabelName);
      if (!activeLabel) return;
      
      setAnnotations(prev => [...prev, {
        type: 'point',
        label: activeLabel.name,
        point: point,
        color: activeLabel.color,
        labelPosition: { x: point.x + 20, y: point.y - 20 },
      }]);
    } else { // polygon mode
      setCurrentPoints(prev => [...prev, point]);
    }
  }, [annotationMode, activeLabelName, labels, setAnnotations]);

  const handleUndoLastPoint = useCallback(() => {
    setCurrentPoints(prev => prev.slice(0, -1));
  }, []);
  
  const handleClearCurrent = useCallback(() => {
    setCurrentPoints([]);
  }, []);

  const handleClearAll = useCallback(() => {
    setAnnotations([]);
    setCurrentPoints([]);
  }, [setAnnotations]);
  
  const handleUpdateAnnotation = useCallback((index: number, updatedAnnotation: Annotation) => {
    setAnnotations(prevAnns => {
        const newAnns = [...prevAnns];
        if (newAnns[index]) {
            newAnns[index] = updatedAnnotation;
        }
        return newAnns;
    });
  }, [setAnnotations]);

  const handleRenameLabel = useCallback((oldName: string, newName: string) => {
    if (!newName || labels.some(l => l.name === newName && l.name !== oldName)) {
        return; // Prevent empty or duplicate names
    }
    
    setLabels(prev => prev.map(l => l.name === oldName ? { ...l, name: newName } : l));
    
    setAnnotations(prev => prev.map(ann => 
        ann.label === oldName ? { ...ann, label: newName } : ann
    ));
    
    if (activeLabelName === oldName) {
        setActiveLabelName(newName);
    }
  }, [labels, activeLabelName, setAnnotations]);
  
  const activeLabel = labels.find(l => l.name === activeLabelName);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
          <ImageLoader onImageUpload={handleImageUpload} />
          {image && (
            <>
              <AnnotationModeSwitcher mode={annotationMode} setMode={setAnnotationMode} />
              <LabelTabs 
                labels={labels}
                activeLabel={activeLabelName} 
                onLabelChange={setActiveLabelName}
                onRenameLabel={handleRenameLabel}
              />
              <Controls 
                onUndo={handleUndoLastPoint}
                onClearCurrent={handleClearCurrent}
                onClearAll={handleClearAll}
                image={image}
                annotations={annotations}
                isDrawing={currentPoints.length > 0}
                onComplete={completePolygon}
                annotationMode={annotationMode}
                onUndoAnnotation={undoAnnotation}
                onRedoAnnotation={redoAnnotation}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </>
          )}
        </div>

        {/* Main Canvas Area */}
        <div ref={canvasContainerRef} className="flex-grow bg-gray-800 rounded-lg shadow-lg flex items-center justify-center overflow-auto p-2 relative">
           {!image ? (
            <Instructions />
           ) : (
            <AnnotationCanvas
              containerRef={canvasContainerRef}
              image={image}
              annotations={annotations}
              currentPoints={currentPoints}
              activeLabelColor={activeLabel?.color || 'rgba(255,255,255,0.7)'}
              onCanvasClick={handleCanvasClick}
              onComplete={completePolygon}
              onUpdateAnnotation={handleUpdateAnnotation}
            />
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
