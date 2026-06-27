import { useCallback, useState } from 'react';
import type { Category, Transaction } from '../types';
import {
  applyCategoryOverrides,
  loadCategoryOverrides,
  removeContainsRule,
  saveCategoryOverrides,
  setCategoryOverride,
  type CategoryOverrides,
} from '../lib/categoryOverrides';

export function useCategoryOverrides() {
  const [overrides, setOverrides] = useState<CategoryOverrides>(loadCategoryOverrides);

  const setCategory = useCallback((transaction: Transaction, category: Category) => {
    setOverrides((current) => {
      const next = setCategoryOverride(current, transaction, category);
      saveCategoryOverrides(next);
      return next;
    });
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setOverrides((current) => {
      const next = removeContainsRule(current, ruleId);
      saveCategoryOverrides(next);
      return next;
    });
  }, []);

  const applyOverrides = useCallback(
    (transactions: Transaction[]) => applyCategoryOverrides(transactions, overrides),
    [overrides],
  );

  return { overrides, setCategory, deleteRule, applyOverrides };
}
