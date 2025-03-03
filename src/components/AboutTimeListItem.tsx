import { ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppState } from "../context/App";
import { Item } from "../store/utils/item";

export default function PaginatedItemListItem({ item }: { item: Item }) {
  const { focusedListItemId } = useAppState()
  const dispatch = useAppDispatch()

  const lengthString = useMemo(() => {
    const hours = Math.floor(item.duration / 3600000);
    const minutes = Math.floor((item.duration % 3600000) / 60000);
    const seconds = Math.floor((item.duration % 60000) / 1000);
    const milliseconds = item.duration % 1000;

    return `${hours ? `${hours}h` : ''} ${minutes ? `${minutes}m` : ''} ${seconds ? `${seconds}` : ''}${milliseconds ? `.${milliseconds}s` : 's'}`
  }, [item.duration])

  const setFocusedListItem = useCallback(() => {
    dispatch({ type: 'SET_FOCUSED_LIST_ITEM_BY_ID', payload: { focusedListItemId: item.id } })
  }, [dispatch, item.id])

  const isFocused = useMemo(() => focusedListItemId === item.id, [focusedListItemId, item.id])

  return (
    <ListItem>
      <ListItemButton selected={isFocused} onClick={setFocusedListItem}>
        <ListItemText primary={item.name} secondary={`length: ${lengthString}`} />
      </ListItemButton>
    </ListItem >
  )
}
