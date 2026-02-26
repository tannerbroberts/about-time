import { motion } from 'framer-motion';
import React from 'react';

import type { Position } from './utils/positioning';
import { calculateBezierControlPoint } from './utils/positioning';

export interface ConnectionLineProps {
  from: Position;
  to: Position;
  color: string;
  animate?: boolean;
}

export function ConnectionLine({ from, to, color, animate = true }: ConnectionLineProps): React.ReactElement {
  const controlPoint = calculateBezierControlPoint(from, to, 40);
  const path = `M ${from.x} ${from.y} Q ${controlPoint.x} ${controlPoint.y} ${to.x} ${to.y}`;

  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth={2}
      fill="none"
      opacity={0.7}
      initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />
  );
}
