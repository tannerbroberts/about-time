import { MemoItemListItem } from './MemoItemListItem';
import { useItemsList } from './useItemsList';

export function Library() {
  const items = useItemsList();
  return (
    <div>
      {items.map((item) => (
        <MemoItemListItem
          key={item.id}
          id={item.id}
          intent={item.intent}
          estimatedDuration={item.estimatedDuration}
          version={item.version}
        />
      ))}
    </div>
  );
}
