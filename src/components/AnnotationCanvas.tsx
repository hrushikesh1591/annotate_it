
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Annotation, Point } from '../types';

interface AnnotationCanvasProps {
  containerRef: React.RefObject<HTMLDivElement>;
  image: HTMLImageElement;
  annotations: Annotation[];
  currentPoints: Point[];
  activeLabelColor: string;
  onCanvasClick: (point: Point) => void;
  onComplete: () => void;
  onUpdateAnnotation: (index: number, annotation: Annotation) => void;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  containerRef,
  image,
  annotations,
  currentPoints,
  activeLabelColor,
  onCanvasClick,
  onComplete,
  onUpdateAnnotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [draggingInfo, setDraggingInfo] = useState<{index: number, dragTarget: 'label' | 'shape'} | null>(null);
  const [lastDragPoint, setLastDragPoint] = useState<Point | null>(null);
  const [didDrag, setDidDrag] = useState(false);

  const getPointFromEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e.nativeEvent) { // Touch event
        const touchList = e.nativeEvent.touches.length > 0 ? e.nativeEvent.touches : e.nativeEvent.changedTouches;
        if (touchList.length > 0) {
            clientX = touchList[0].clientX;
            clientY = touchList[0].clientY;
        } else {
            return null;
        }
    } else { // Mouse event
        clientX = e.nativeEvent.clientX;
        clientY = e.nativeEvent.clientY;
    }

    if (clientX === undefined || clientY === undefined) return null;

    return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale,
    };
  }, [scale]);
  
  const getDefaultLabelPosition = useCallback((ann: Annotation): Point => {
    let anchorPoint: Point;
    if (ann.type === 'point') {
        anchorPoint = ann.point;
    } else {
        anchorPoint = ann.points[0];
    }
    return { x: anchorPoint.x + 20, y: anchorPoint.y - 20 };
  }, []);

  const getLabelBoundingBox = useCallback((ann: Annotation, ctx: CanvasRenderingContext2D): {x: number, y: number, width: number, height: number} => {
      const labelPos = ann.labelPosition || getDefaultLabelPosition(ann);

      ctx.font = `${14 / scale}px sans-serif`;
      const textMetrics = ctx.measureText(ann.label);
      const boxWidth = textMetrics.width + (16 / scale);
      const boxHeight = (20 / scale);
      const boxX = labelPos.x;
      const boxY = labelPos.y - boxHeight;
      
      return { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
  }, [scale, getDefaultLabelPosition]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

    // Draw completed annotations
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
        const pointRadius = 6 / scale;
        const solidColor = ann.color.replace(/, [\d.]+\)/, ', 1)');
        
        ctx.fillStyle = ann.color;
        ctx.strokeStyle = solidColor;
        ctx.lineWidth = 2 / scale;

        ctx.beginPath();
        ctx.arc(ann.point.x, ann.point.y, pointRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      // Draw label and arrow
      const box = getLabelBoundingBox(ann, ctx);
      
      // Label box
      ctx.fillStyle = 'rgba(40, 40, 40, 0.9)';
      ctx.strokeStyle = 'rgba(10, 10, 10, 1)';
      ctx.lineWidth = 1 / scale;
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.fill();
      ctx.stroke();

      // Label text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ann.label, box.x + (8 / scale), box.y + box.height / 2);

      // Arrow
      let anchorPoint = ann.type === 'point' ? ann.point : ann.points[0];
      const lineStart = { x: box.x + box.width / 2, y: box.y + box.height };
      const lineEnd = anchorPoint;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.moveTo(lineStart.x, lineStart.y);
      ctx.lineTo(lineEnd.x, lineEnd.y);
      ctx.stroke();

      // Arrow head
      const arrowHeadSize = 8 / scale;
      const angle = Math.atan2(lineEnd.y - lineStart.y, lineEnd.x - lineStart.x);
      ctx.beginPath();
      ctx.moveTo(lineEnd.x, lineEnd.y);
      ctx.lineTo(lineEnd.x - arrowHeadSize * Math.cos(angle - Math.PI / 6), lineEnd.y - arrowHeadSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(lineEnd.x - arrowHeadSize * Math.cos(angle + Math.PI / 6), lineEnd.y - arrowHeadSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = 'black';
      ctx.fill();
    });

    // Draw current polygon being created
    if (currentPoints.length > 0) {
      const color = activeLabelColor;
      ctx.strokeStyle = color.replace(/, [\d.]+\)/, ', 1)');
      ctx.lineWidth = 2 / scale;

      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      
      if (mousePosition) {
        ctx.lineTo(mousePosition.x, mousePosition.y);
      }
      ctx.stroke();

      ctx.fillStyle = color.replace(/, [\d.]+\)/, ', 1)');
      currentPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 / scale, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [image, annotations, currentPoints, scale, mousePosition, activeLabelColor, getLabelBoundingBox, getDefaultLabelPosition]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && image) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
    }
    
    const calculateScale = () => {
      if (!image || !containerRef.current) return;
      const { naturalWidth, naturalHeight } = image;
      const { clientWidth, clientHeight } = containerRef.current;
      
      const padding = 16; // from p-2 on parent
      const availableWidth = clientWidth - padding;
      const availableHeight = clientHeight - padding;

      const scaleX = availableWidth / naturalWidth;
      const scaleY = availableHeight / naturalHeight;
      setScale(Math.min(scaleX, scaleY, 1));
    };

    calculateScale();
    
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);

  }, [image, containerRef]);

  useEffect(() => {
    draw();
  }, [draw]);
  
  const handleInteractionStart = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e.nativeEvent) {
      e.preventDefault();
    }
    setDidDrag(false);
    const point = getPointFromEvent(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!point || !ctx) return;

    // Check for label drag first (they are on top)
    for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        const box = getLabelBoundingBox(ann, ctx);
        if (point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
            setDraggingInfo({
                index: i,
                dragTarget: 'label',
            });
            setLastDragPoint(point);
            return;
        }
    }

    // Check for shape drag
    for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        const hitRadius = 12 / scale; // A larger radius for easier touching/clicking
        if (ann.type === 'polygon') {
            ctx.beginPath();
            ctx.moveTo(ann.points[0].x, ann.points[0].y);
            for (let j = 1; j < ann.points.length; j++) {
                ctx.lineTo(ann.points[j].x, ann.points[j].y);
            }
            ctx.closePath();
            if (ctx.isPointInPath(point.x, point.y)) {
                setDraggingInfo({
                    index: i,
                    dragTarget: 'shape',
                });
                setLastDragPoint(point);
                return;
            }
        } else { // 'point'
            const distance = Math.sqrt(Math.pow(point.x - ann.point.x, 2) + Math.pow(point.y - ann.point.y, 2));
            if (distance <= hitRadius) {
                 setDraggingInfo({
                    index: i,
                    dragTarget: 'shape',
                });
                setLastDragPoint(point);
                return;
            }
        }
    }
  }, [annotations, scale, getPointFromEvent, getLabelBoundingBox]);
  
  const handleInteractionMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
     if ('touches' in e.nativeEvent) {
        e.preventDefault();
     }
     const point = getPointFromEvent(e);
     if (!point) return;
     setMousePosition(point);

     if (draggingInfo && lastDragPoint) {
        setDidDrag(true);
        const dx = point.x - lastDragPoint.x;
        const dy = point.y - lastDragPoint.y;

        const ann = annotations[draggingInfo.index];
        let updatedAnnotation: Annotation;

        if (draggingInfo.dragTarget === 'label') {
            const currentLabelPos = ann.labelPosition || getDefaultLabelPosition(ann);
            updatedAnnotation = {
                ...ann,
                labelPosition: {
                    x: currentLabelPos.x + dx,
                    y: currentLabelPos.y + dy,
                }
            };
        } else { // 'shape'
            const currentLabelPos = ann.labelPosition || getDefaultLabelPosition(ann);
            const newLabelPosition = {
                x: currentLabelPos.x + dx,
                y: currentLabelPos.y + dy
            };

            if (ann.type === 'point') {
                updatedAnnotation = {
                    ...ann,
                    point: { x: ann.point.x + dx, y: ann.point.y + dy },
                    labelPosition: newLabelPosition
                };
            } else { // polygon
                updatedAnnotation = {
                    ...ann,
                    points: ann.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
                    labelPosition: newLabelPosition
                };
            }
        }
        onUpdateAnnotation(draggingInfo.index, updatedAnnotation);
        setLastDragPoint(point);
     } else if (!('touches' in e.nativeEvent)) { // Mouse hover logic
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        let onDraggable = false;
        // Reverse loop to check top-most elements first
        for (let i = annotations.length - 1; i >= 0; i--) {
            const ann = annotations[i];
            
            // Check label
            const box = getLabelBoundingBox(ann, ctx);
            if (point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height) {
                onDraggable = true;
                break;
            }

            // Check shape
            const hitRadius = 12 / scale;
            if (ann.type === 'polygon') {
                ctx.beginPath();
                ctx.moveTo(ann.points[0].x, ann.points[0].y);
                for (let j = 1; j < ann.points.length; j++) {
                    ctx.lineTo(ann.points[j].x, ann.points[j].y);
                }
                ctx.closePath();
                if (ctx.isPointInPath(point.x, point.y)) {
                    onDraggable = true;
                    break;
                }
            } else { // 'point'
                const distance = Math.sqrt(Math.pow(point.x - ann.point.x, 2) + Math.pow(point.y - ann.point.y, 2));
                if (distance <= hitRadius) {
                    onDraggable = true;
                    break;
                }
            }
        }
        canvas.style.cursor = onDraggable ? 'move' : 'crosshair';
     }
  }, [draggingInfo, lastDragPoint, annotations, onUpdateAnnotation, getPointFromEvent, getDefaultLabelPosition, getLabelBoundingBox, scale]);
  
  const handleInteractionEnd = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e.nativeEvent) {
      e.preventDefault();
    }
    if (!didDrag && !draggingInfo) {
      const point = getPointFromEvent(e);
      if (point) {
        onCanvasClick(point);
      }
    }
    setDraggingInfo(null);
    setLastDragPoint(null);
  }, [didDrag, draggingInfo, getPointFromEvent, onCanvasClick]);
  
  const handleInteractionLeave = useCallback(() => {
     setMousePosition(null);
     setDraggingInfo(null);
     setLastDragPoint(null);
     if (canvasRef.current) {
        canvasRef.current.style.cursor = 'crosshair';
     }
  }, []);
  
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!draggingInfo) {
      onComplete();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: image ? image.naturalWidth * scale : 0,
        height: image ? image.naturalHeight * scale : 0,
        touchAction: 'none',
      }}
      onMouseDown={handleInteractionStart}
      onMouseMove={handleInteractionMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionLeave}
      onTouchStart={handleInteractionStart}
      onTouchMove={handleInteractionMove}
      onTouchEnd={handleInteractionEnd}
      onTouchCancel={handleInteractionLeave}
      onDoubleClick={handleDoubleClick}
    />
  );
};

export default AnnotationCanvas;