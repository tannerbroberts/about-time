import React from 'react';

import { Expander, ListItemLaneView } from '../../Shared';

import { useListItemLaneViewPanelState } from './useListItemLaneViewPanelState';

export function ListItemLaneViewPanel(): React.ReactElement {
  const {
    query,
    setQuery,
    suggestions,
    selectedLane,
    selectLane,
    allTemplates,
    showSuggestions,
    setShowSuggestions,
  } = useListItemLaneViewPanelState();

  return (
    <Expander title="List Item Lane View" defaultExpanded>
      <div style={styles.inputContainer}>
        <label htmlFor="list-lane-select" style={styles.label}>
          Select Lane:
        </label>
        <div style={styles.autosuggestWrapper}>
          <input
            id="list-lane-select"
            type="text"
            value={query}
            onChange={(e): void => setQuery(e.target.value)}
            onFocus={(): void => setShowSuggestions(true)}
            onBlur={(): void => {
              setTimeout((): void => setShowSuggestions(false), 150);
            }}
            placeholder="Search for a lane..."
            style={styles.input}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div style={styles.suggestionsDropdown}>
              {suggestions.map((lane) => (
                <button
                  key={lane.id}
                  type="button"
                  onClick={(): void => selectLane(lane)}
                  style={styles.suggestionItem}
                >
                  <span style={styles.suggestionIntent}>{lane.intent}</span>
                  <span style={styles.suggestionId}>{lane.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedLane ? (
        <div style={styles.laneViewContainer}>
          <ListItemLaneView lane={selectedLane} allTemplates={allTemplates} />
        </div>
      ) : (
        <div style={styles.placeholder}>
          Select a lane template to view its list breakdown
        </div>
      )}
    </Expander>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  label: {
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  autosuggestWrapper: {
    position: 'relative',
    flex: 1,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: '#fff',
    border: '1px solid #e0e0e0',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    zIndex: 100,
  },
  suggestionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  suggestionIntent: {
    fontWeight: 500,
  },
  suggestionId: {
    fontSize: '0.75rem',
    color: '#888',
  },
  laneViewContainer: {
    marginTop: '16px',
  },
  placeholder: {
    padding: '24px',
    textAlign: 'center',
    color: '#888',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
};
