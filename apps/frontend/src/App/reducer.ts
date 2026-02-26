export const DefaultAppState = {
  sidePanelOpen: false,
  activeTab: 'build' as 'build' | 'schedule' | 'track',
};

export type AppActionType = 'TOGGLE_SIDE_PANEL' | 'SET_ACTIVE_TAB';

export type AppAction = | {
  type: 'TOGGLE_SIDE_PANEL';
}
| {
  type: 'SET_ACTIVE_TAB';
  tab: 'build' | 'schedule' | 'track';
};

export type AppContextValue = {
  state: typeof DefaultAppState;
  dispatch: React.Dispatch<AppAction>;
};

export const reducer = (state: typeof DefaultAppState, action: AppAction): typeof DefaultAppState => {
  switch (action.type) {
    case 'TOGGLE_SIDE_PANEL':
      return {
        ...state,
        sidePanelOpen: !state.sidePanelOpen,
      };

    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.tab,
      };

    default:
      throw new Error(`Unhandled action type: ${(action as AppAction).type}`);
  }
};
