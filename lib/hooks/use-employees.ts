'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Employee } from '../types';
import { listEmployees } from '../api/employees';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await listEmployees();
      setEmployees(data.employees);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load employees';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { employees, loading, error, refresh };
}
