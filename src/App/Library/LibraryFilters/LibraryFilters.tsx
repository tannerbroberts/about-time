import React from 'react';

interface LibraryFiltersProps {
  minDuration: string;
  maxDuration: string;
  inputsQuery: string;
  outputsQuery: string;
  intentQuery: string;
  onMinDurationChange: (value: string) => void;
  onMaxDurationChange: (value: string) => void;
  onInputsQueryChange: (value: string) => void;
  onOutputsQueryChange: (value: string) => void;
  onIntentQueryChange: (value: string) => void;
  onClear: () => void;
}

export function LibraryFilters({
  minDuration,
  maxDuration,
  inputsQuery,
  outputsQuery,
  intentQuery,
  onMinDurationChange,
  onMaxDurationChange,
  onInputsQueryChange,
  onOutputsQueryChange,
  onIntentQueryChange,
  onClear,
}: LibraryFiltersProps): React.ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="min-duration">
            Min Duration (min)
          </label>
          <input
            id="min-duration"
            type="number"
            style={styles.input}
            value={minDuration}
            onChange={(e): void => onMinDurationChange(e.target.value)}
            placeholder="0"
            min="0"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="max-duration">
            Max Duration (min)
          </label>
          <input
            id="max-duration"
            type="number"
            style={styles.input}
            value={maxDuration}
            onChange={(e): void => onMaxDurationChange(e.target.value)}
            placeholder="∞"
            min="0"
          />
        </div>
      </div>
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="intent-filter">
            Intent
          </label>
          <input
            id="intent-filter"
            type="text"
            style={styles.input}
            value={intentQuery}
            onChange={(e): void => onIntentQueryChange(e.target.value)}
            placeholder="Fuzzy search intent..."
          />
        </div>
      </div>
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="inputs-filter">
            Inputs (willConsume)
          </label>
          <input
            id="inputs-filter"
            type="text"
            style={styles.input}
            value={inputsQuery}
            onChange={(e): void => onInputsQueryChange(e.target.value)}
            placeholder="Fuzzy search inputs..."
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="outputs-filter">
            Outputs (willProduce)
          </label>
          <input
            id="outputs-filter"
            type="text"
            style={styles.input}
            value={outputsQuery}
            onChange={(e): void => onOutputsQueryChange(e.target.value)}
            placeholder="Fuzzy search outputs..."
          />
        </div>
      </div>
      <button type="button" style={styles.clearButton} onClick={onClear}>
        Clear Filters
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
  },
  row: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1 1 200px',
    minWidth: '150px',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.875rem',
  },
  clearButton: {
    alignSelf: 'flex-start',
    padding: '8px 16px',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
};
