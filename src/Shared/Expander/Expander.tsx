import React from 'react';

import { useExpanderState } from './useExpanderState';

interface ExpanderProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function Expander({
  title,
  children,
  defaultExpanded = true,
}: ExpanderProps): React.ReactElement {
  const { isExpanded, toggle } = useExpanderState(defaultExpanded);

  return (
    <details open={isExpanded} style={styles.details}>
      <summary onClick={toggle} style={styles.summary}>
        {title}
      </summary>
      <div style={styles.content}>
        {children}
      </div>
    </details>
  );
}

const styles: Record<string, React.CSSProperties> = {
  details: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    margin: '16px',
  },
  summary: {
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '1.25rem',
    fontWeight: 600,
    userSelect: 'none',
  },
  content: {
    padding: '16px',
  },
};
