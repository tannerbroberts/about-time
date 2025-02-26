export class Item {
  id: string;
  name: string;
  duration: number;
  children: Child[];
  parents: Parent[];
  showChildren: boolean;

  constructor(
    id: string,
    name: string,
    duration: number,
    children: Child[],
    showChildren: boolean,
  ) {
    this.id = id;
    this.name = name;
    this.duration = duration;
    this.children = children;
    this.parents = [];
    this.showChildren = showChildren;
  }
}

export class Child {
  id: string;
  relationshipId: string;
  start: number;

  constructor(id: string, relationshipId: string, start: number) {
    this.id = id;
    this.relationshipId = relationshipId;
    this.start = start;
  }
}

export class Parent {
  id: string;
  relationshipId: string;

  constructor(id: string, relationshipId: string) {
    this.id = id;
    this.relationshipId = relationshipId;
  }
}

export function getItemById(items: Item[], id: string | null): Item | null {
  if (!id) return null;

  let low = 0;
  let high = items.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midId = items[mid].id;

    if (midId === id) {
      return items[mid];
    } else if (midId < id) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return null;
}

export function getIndexById(items: Item[], id: string | null): number {
  if (!id) return -1;

  let low = 0;
  let high = items.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midId = items[mid].id;

    if (midId === id) {
      return mid;
    } else if (midId < id) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}
