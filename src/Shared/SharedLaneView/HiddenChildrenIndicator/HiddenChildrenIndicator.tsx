import React from 'react';

interface HiddenChildrenIndicatorProps {
  count: number;
  leftPercent: number;
  widthPercent: number;
}

const INDICATOR_SIZE = 24;

/**
 * HiddenChildrenIndicator - Renders a circle with +## count for hidden segments.
 * Positioned within a time slot to show hidden children that are too small to render.
 */
export function HiddenChildrenIndicator(
  { count, leftPercent, widthPercent }: HiddenChildrenIndicatorProps,
): React.ReactElement {
  const displayCount = count > 99 ? '99+' : `+${count}`;

  return (
    <div
      style={{
        ...styles.container,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
      }}
    >
      <div style={styles.circle}>
        <span style={styles.count}>{displayCount}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: INDICATOR_SIZE,
    pointerEvents: 'none',
  },
  circle: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: '50%',
    backgroundColor: '#9e9e9e',
    border: '2px solid #616161',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  count: {
    fontSize: 9,
    fontWeight: 700,
    color: '#fff',
    textShadow: '0 1px 1px rgba(0,0,0,0.3)',
  },
};
