import React from 'react';

import { Expander } from '../../Shared';

import { LibraryFilters } from './LibraryFilters';
import { MemoItemListItem } from './MemoItemListItem';
import { MemoVariableListItem } from './MemoVariableListItem';
import { useLibraryState } from './useLibraryState';

export function Library(): React.ReactElement {
  const {
    templates,
    variables,
    filters,
    minDurationInput,
    maxDurationInput,
    setMinDurationInput,
    setMaxDurationInput,
    setVariablesQuery,
    setIntentQuery,
    clearFilters,
  } = useLibraryState();

  return (
    <Expander title="Library" defaultExpanded>
      <LibraryFilters
        minDuration={minDurationInput}
        maxDuration={maxDurationInput}
        variablesQuery={filters.variablesQuery}
        intentQuery={filters.intentQuery}
        onMinDurationChange={setMinDurationInput}
        onMaxDurationChange={setMaxDurationInput}
        onVariablesQueryChange={setVariablesQuery}
        onIntentQueryChange={setIntentQuery}
        onClear={clearFilters}
      />
      <div style={styles.listsContainer}>
        <div style={styles.listSection}>
          <h3 style={styles.listHeader}>Variables ({variables.length})</h3>
          <div style={styles.list}>
            {variables.map((variable) => (
              <MemoVariableListItem
                key={variable.name}
                name={variable.name}
                type={variable.type}
                usageCount={variable.templateIds.length}
              />
            ))}
          </div>
        </div>
        <div style={styles.listSection}>
          <h3 style={styles.listHeader}>Templates ({templates.length})</h3>
          <div style={styles.list}>
            {templates.map((template) => (
              <MemoItemListItem
                key={template.id}
                id={template.id}
                intent={template.intent}
                estimatedDuration={template.estimatedDuration}
                version={template.version}
              />
            ))}
          </div>
        </div>
      </div>
    </Expander>
  );
}

const styles: Record<string, React.CSSProperties> = {
  listsContainer: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
  },
  listSection: {
    flex: 1,
    minWidth: 0,
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  listHeader: {
    margin: 0,
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '1rem',
    fontWeight: 600,
  },
  list: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
};
