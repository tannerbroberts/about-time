interface ItemListItemProps {
  id: string;
  intent: string;
  estimatedDuration: number;
  version: string;
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) {
    return `~${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `~${hours}h ${remainingMinutes}m` : `~${hours}h`;
}

export function ItemListItem({
  intent,
  estimatedDuration,
  version,
}: ItemListItemProps) {
  return (
    <div style={styles.container}>
      <span style={styles.intent}>{intent}</span>
      <span style={styles.duration}>{formatDuration(estimatedDuration)}</span>
      <span style={styles.version}>v{version}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
  },
  intent: {
    flex: 1,
    fontWeight: 500,
  },
  duration: {
    color: '#666',
    fontSize: '0.875rem',
  },
  version: {
    fontSize: '0.75rem',
    color: '#888',
    backgroundColor: '#f0f0f0',
    padding: '2px 6px',
    borderRadius: '4px',
  },
};
