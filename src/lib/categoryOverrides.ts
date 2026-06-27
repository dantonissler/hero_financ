import type { Category, Transaction } from '../types';
import { categorizeTransaction, extractDescription } from './categorizer';

export interface ContainsRule {
  id: string;
  contains: string;
  category: Category;
  label: string;
  createdAt: string;
}

export interface CategoryOverrides {
  version: number;
  byTransactionId: Record<string, Category>;
  byDescription: Record<string, Category>;
  containsRules: ContainsRule[];
}

const STORAGE_KEY = 'hero-financ-category-overrides';
const MEMORY_VERSION = 2;
const MIN_CONTAINS_LENGTH = 4;

export function normalizeMerchantKey(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/^(mp|ifd|pag|elo|getnet|cielo|rede|stone)\s*\*/i, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function loadCategoryOverrides(): CategoryOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverrides();
    const parsed = JSON.parse(raw) as Partial<CategoryOverrides>;
    return migrateCategoryOverrides(parsed);
  } catch {
    return emptyOverrides();
  }
}

function migrateCategoryOverrides(raw: Partial<CategoryOverrides>): CategoryOverrides {
  const byTransactionId = raw.byTransactionId ?? {};
  const containsRules = raw.containsRules ?? [];

  const byDescription: Record<string, Category> = {};
  for (const [description, category] of Object.entries(raw.byDescription ?? {})) {
    byDescription[normalizeMerchantKey(description)] = category;
  }

  if (raw.version === MEMORY_VERSION) {
    return {
      version: MEMORY_VERSION,
      byTransactionId,
      byDescription,
      containsRules,
    };
  }

  const migratedRules = [...containsRules];
  for (const [description, category] of Object.entries(byDescription)) {
    if (description.length < MIN_CONTAINS_LENGTH) continue;
    if (migratedRules.some((rule) => rule.contains === description)) continue;
    migratedRules.push({
      id: `migrated-${description}`,
      contains: description,
      category,
      label: description,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    version: MEMORY_VERSION,
    byTransactionId,
    byDescription,
    containsRules: migratedRules,
  };
}

export function saveCategoryOverrides(overrides: CategoryOverrides): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...overrides, version: MEMORY_VERSION }),
  );
}

export function emptyOverrides(): CategoryOverrides {
  return {
    version: MEMORY_VERSION,
    byTransactionId: {},
    byDescription: {},
    containsRules: [],
  };
}

function sortedContainsRules(rules: ContainsRule[]): ContainsRule[] {
  return [...rules].sort((a, b) => b.contains.length - a.contains.length);
}

function matchContainsRule(
  transaction: Pick<Transaction, 'memo' | 'description'>,
  rules: ContainsRule[],
): Category | null {
  const texts = [
    normalizeMerchantKey(transaction.description),
    normalizeMerchantKey(transaction.memo),
    normalizeMerchantKey(extractDescription(transaction.memo)),
  ].filter((text, index, list) => text.length > 0 && list.indexOf(text) === index);

  for (const rule of sortedContainsRules(rules)) {
    if (texts.some((text) => text.includes(rule.contains) || rule.contains.includes(text))) {
      return rule.category;
    }
  }

  return null;
}

export function resolveCategory(
  transaction: Pick<Transaction, 'id' | 'memo' | 'description' | 'type' | 'category'>,
  overrides: CategoryOverrides,
): Category {
  const byId = overrides.byTransactionId[transaction.id];
  if (byId) return byId;

  const descriptionKey = normalizeMerchantKey(transaction.description);
  const byDescription = overrides.byDescription[descriptionKey];
  if (byDescription) return byDescription;

  const learned = matchContainsRule(transaction, overrides.containsRules);
  if (learned) return learned;

  return categorizeTransaction(transaction.memo, transaction.type, transaction.description);
}

export function applyCategoryOverrides(
  transactions: Transaction[],
  overrides: CategoryOverrides,
): Transaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    category: resolveCategory(transaction, overrides),
  }));
}

function upsertContainsRule(
  rules: ContainsRule[],
  contains: string,
  category: Category,
  label: string,
): ContainsRule[] {
  if (contains.length < MIN_CONTAINS_LENGTH) return rules;

  const existing = rules.find((rule) => rule.contains === contains);
  if (existing) {
    return rules.map((rule) =>
      rule.contains === contains ? { ...rule, category, label } : rule,
    );
  }

  return [
    ...rules,
    {
      id: `rule-${crypto.randomUUID()}`,
      contains,
      category,
      label,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function setCategoryOverride(
  overrides: CategoryOverrides,
  transaction: Transaction,
  category: Category,
): CategoryOverrides {
  const descriptionKey = normalizeMerchantKey(transaction.description);
  const autoCategory = categorizeTransaction(
    transaction.memo,
    transaction.type,
    transaction.description,
  );

  const next: CategoryOverrides = {
    ...overrides,
    byTransactionId: { ...overrides.byTransactionId, [transaction.id]: category },
    byDescription: { ...overrides.byDescription, [descriptionKey]: category },
  };

  if (category !== autoCategory) {
    next.containsRules = upsertContainsRule(
      overrides.containsRules,
      descriptionKey,
      category,
      transaction.description,
    );
  }

  return next;
}

export function removeContainsRule(
  overrides: CategoryOverrides,
  ruleId: string,
): CategoryOverrides {
  return {
    ...overrides,
    containsRules: overrides.containsRules.filter((rule) => rule.id !== ruleId),
  };
}
