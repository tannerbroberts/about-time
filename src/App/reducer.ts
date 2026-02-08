export const DefaultAppState = {
  sidePanelOpen: false,
};

export type AppActionType = 'TOGGLE_SIDE_PANEL';

export type AppAction = {
  type: AppActionType;
};

export type AppContextValue = {
  state: typeof DefaultAppState;
  dispatch: React.Dispatch<AppAction>;
};

export const reducer = (state: typeof DefaultAppState, action: AppAction): typeof DefaultAppState => {
  if (action.type === 'TOGGLE_SIDE_PANEL') {
    return {
      ...state,
      sidePanelOpen: !state.sidePanelOpen,
    };
  }

  // Return the current state for unhandled actions
  throw new Error(`Unhandled action type: ${action.type}`);
};
