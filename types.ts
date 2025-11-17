export interface Point {
  x: number;
  y: number;
}

export type AnnotationType = 'point' | 'polygon';

export interface PointAnnotation {
  type: 'point';
  label: string;
  point: Point;
  color: string;
  labelPosition?: Point;
}

export interface PolygonAnnotation {
  type: 'polygon';
  label: string;
  points: Point[];
  color: string;
  labelPosition?: Point;
}

export type Annotation = PointAnnotation | PolygonAnnotation;
