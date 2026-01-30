import { KeyResult, Objective } from "@/hooks/useOKRs";

/**
 * Get all ancestor KR IDs for a given KR, including the KR itself.
 * Walks up the parent_kr_id chain until reaching a KR with no parent.
 */
export function getKRAncestors(krId: string, allKRs: KeyResult[]): string[] {
  const result: string[] = [krId];
  let currentKR = allKRs.find((kr) => kr.id === krId);

  while (currentKR?.parent_kr_id) {
    result.push(currentKR.parent_kr_id);
    currentKR = allKRs.find((kr) => kr.id === currentKR?.parent_kr_id);
  }

  return result;
}

/**
 * Get all descendant KR IDs for a given KR (children, grandchildren, etc.)
 */
export function getKRDescendants(krId: string, allKRs: KeyResult[]): string[] {
  const result: string[] = [];
  const children = allKRs.filter((kr) => kr.parent_kr_id === krId);

  for (const child of children) {
    result.push(child.id);
    result.push(...getKRDescendants(child.id, allKRs));
  }

  return result;
}

/**
 * Check if a KR has any selected descendants
 */
export function hasSelectedDescendants(
  krId: string,
  allKRs: KeyResult[],
  selectedIds: Set<string>
): boolean {
  const descendants = getKRDescendants(krId, allKRs);
  return descendants.some((id) => selectedIds.has(id));
}

/**
 * Get the nesting level of a KR (0 = direct child of objective, 1 = grandchild, etc.)
 */
export function getKRNestingLevel(krId: string, allKRs: KeyResult[]): number {
  let level = 0;
  let currentKR = allKRs.find((kr) => kr.id === krId);

  while (currentKR?.parent_kr_id) {
    level++;
    currentKR = allKRs.find((kr) => kr.id === currentKR?.parent_kr_id);
  }

  return level;
}

/**
 * Get the root objective ID for a KR (walks up the tree)
 */
export function getKRObjectiveId(krId: string, allKRs: KeyResult[]): string | null {
  let currentKR = allKRs.find((kr) => kr.id === krId);

  while (currentKR) {
    if (currentKR.objective_id) {
      return currentKR.objective_id;
    }
    if (!currentKR.parent_kr_id) break;
    currentKR = allKRs.find((kr) => kr.id === currentKR?.parent_kr_id);
  }

  return null;
}

export interface KRTreeNode {
  kr: KeyResult;
  level: number;
  children: KRTreeNode[];
}

/**
 * Build a hierarchical tree structure from flat KR list, grouped by objective
 */
export function buildKRTree(
  allKRs: KeyResult[],
  objectives: Objective[]
): Map<string, KRTreeNode[]> {
  const result = new Map<string, KRTreeNode[]>();

  // Initialize with empty arrays for each objective
  for (const obj of objectives) {
    result.set(obj.id, []);
  }

  // Get L1 KRs (direct children of objectives)
  const l1KRs = allKRs.filter((kr) => kr.objective_id !== null);

  function buildChildren(parentId: string, level: number): KRTreeNode[] {
    const children = allKRs.filter((kr) => kr.parent_kr_id === parentId);
    return children.map((kr) => ({
      kr,
      level,
      children: buildChildren(kr.id, level + 1),
    }));
  }

  for (const kr of l1KRs) {
    const node: KRTreeNode = {
      kr,
      level: 0,
      children: buildChildren(kr.id, 1),
    };
    const objKRs = result.get(kr.objective_id!) || [];
    objKRs.push(node);
    result.set(kr.objective_id!, objKRs);
  }

  return result;
}

/**
 * Flatten KR tree into a list with level information for display
 */
export interface FlatKRItem {
  kr: KeyResult;
  level: number;
  objectiveId: string;
}

export function flattenKRTree(
  tree: Map<string, KRTreeNode[]>,
  objectives: Objective[]
): FlatKRItem[] {
  const result: FlatKRItem[] = [];

  function flattenNode(node: KRTreeNode, objectiveId: string) {
    result.push({ kr: node.kr, level: node.level, objectiveId });
    for (const child of node.children) {
      flattenNode(child, objectiveId);
    }
  }

  for (const obj of objectives) {
    const nodes = tree.get(obj.id) || [];
    for (const node of nodes) {
      flattenNode(node, obj.id);
    }
  }

  return result;
}
