'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EmployeeKnowledge } from '../types';
import { getKnowledge } from '../api/employees';

export function useKnowledge(employeeId: string | null) {
  const [knowledge, setKnowledge] = useState<EmployeeKnowledge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!employeeId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getKnowledge(employeeId);
      setKnowledge(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load knowledge';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { knowledge, loading, error, refresh };
}
