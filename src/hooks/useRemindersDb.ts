import { useCallback, useEffect, useState } from 'react';
import type { ExpenseReminder } from '../types';
import type { RemindersDatabase } from '../lib/remindersDb';
import {
  createMonth,
  createReminder,
  deleteReminder,
  duplicateMonthReminders,
  importDatabase,
  loadDatabase,
  resetDatabase,
  saveDatabase,
  updateReminderField,
} from '../lib/remindersDb';

export function useRemindersDb() {
  const [db, setDb] = useState<RemindersDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadDatabase();
      setDb(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lembretes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const commit = useCallback((updater: (current: RemindersDatabase) => RemindersDatabase) => {
    setDb((current) => {
      if (!current) return current;
      return updater(current);
    });
  }, []);

  return {
    db,
    loading,
    error,
    refresh,
    createMonth: (monthKey: string, options?: { copyFrom?: string }) => {
      let created = false;
      commit((current) => {
        const result = createMonth(current, monthKey, options);
        created = result.created;
        return result.db;
      });
      return created;
    },
    createReminder: (monthKey: string) => commit((current) => createReminder(current, monthKey)),
    duplicateMonthReminders: (from: string, to: string) =>
      commit((current) => duplicateMonthReminders(current, from, to)),
    updateReminder: <K extends keyof ExpenseReminder>(
      id: string,
      field: K,
      value: ExpenseReminder[K],
    ) => commit((current) => updateReminderField(current, id, field, value)),
    deleteReminder: (id: string) => commit((current) => deleteReminder(current, id)),
    importDb: (raw: RemindersDatabase) => setDb(importDatabase(raw)),
    resetDb: async () => {
      const response = await fetch('/data/reminders-seed.json');
      const seed = (await response.json()) as RemindersDatabase;
      setDb(resetDatabase(seed));
    },
    replaceDb: (raw: RemindersDatabase) => setDb(saveDatabase(raw)),
  };
}
