import React from 'react';

import { SharedLaneView } from '../../Shared';

import { useLaneViewPanelState } from './useLaneViewPanelState';

export function LaneViewPanel(): React.ReactElement {
  const {
    isExpanded,
    toggle,
    query,
    setQuery,
    suggestions,
    selectedLane,
    selectLane,
    allTemplates,
    showSuggestions,
    setShowSuggestions,
  } = useLaneViewPanelState();

  return (
    <details open={isExpanded} style={styles.details}>
      <summary onClick={toggle} style={styles.summary}>
        Lane View
      </summary>
      <div style={styles.content}>
        <div style={styles.inputContainer}>
          <label htmlFor="lane-select" style={styles.label}>
            Select Lane:
          </label>
          <div style={styles.autosuggestWrapper}>
            <input
              id="lane-select"
              type="text"
              value={query}
              onChange={(e): void => setQuery(e.target.value)}
              onFocus={(): void => setShowSuggestions(true)}
              onBlur={(): void => {
                // Delay to allow click on suggestion
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
            <SharedLaneView lane={selectedLane} allTemplates={allTemplates} />
          </div>
        ) : (
          <div style={styles.placeholder}>
            Select a lane template to view its structure
          </div>
        )}
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
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  label: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  autosuggestWrapper: {
    position: 'relative',
    flex: 1,
    maxWidth: '400px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
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
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
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
    fontSize: '14px',
  },
  suggestionIntent: {
    fontWeight: 500,
  },
  suggestionId: {
    fontSize: '12px',
    color: '#666',
  },
  laneViewContainer: {
    marginTop: '8px',
  },
  placeholder: {
    padding: '32px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px dashed #ccc',
  },
};
