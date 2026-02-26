export interface Position {
  x: number;
  y: number;
}

export function calculateNodePosition(
  angleDegrees: number,
  distance: number,
  centerX: number = 300,
  centerY: number = 300,
): Position {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: centerX + distance * Math.cos(angleRadians),
    y: centerY - distance * Math.sin(angleRadians),
  };
}

export function distributeAngles(
  count: number,
  parentAngle: number,
  arcDegrees: number = 60,
): number[] {
  if (count === 1) {
    return [parentAngle];
  }
  const angleStep = arcDegrees / (count - 1);
  const startAngle = parentAngle - arcDegrees / 2;
  return Array.from({ length: count }, (_, i) => startAngle + i * angleStep);
}

export function calculateBezierControlPoint(
  from: Position,
  to: Position,
  offset: number = 40,
): Position {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  return {
    x: midX - (dy / length) * offset,
    y: midY + (dx / length) * offset,
  };
}
