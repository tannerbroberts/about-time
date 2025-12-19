import React, { memo } from 'react';

function getTypeIndicator(type: 'input' | 'output' | 'both'): string {
  switch (type) {
    case 'input':
      return '→';
    case 'output':
      return '←';
    case 'both':
      return '↔';
  }
}

interface MemoVariableListItemProps {
  name: string;
  type: 'input' | 'output' | 'both';
  usageCount: number;
}

export const MemoVariableListItem = memo(({
  name,
  type,
  usageCount,
}: MemoVariableListItemProps): React.ReactElement => {
  return (
    <div style={styles.container}>
      <span style={styles.typeIndicator}>{getTypeIndicator(type)}</span>
      <span style={styles.name}>{name}</span>
      <span style={styles.usageCount}>{usageCount} template{usageCount !== 1 ? 's' : ''}</span>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderBottom: '1px solid #e0e0e0',
  },
  typeIndicator: {
    fontSize: '1rem',
    color: '#888',
  },
  name: {
    flex: 1,
    fontWeight: 500,
    fontFamily: 'monospace',
  },
  usageCount: {
    color: '#666',
    fontSize: '0.75rem',
  },
};
