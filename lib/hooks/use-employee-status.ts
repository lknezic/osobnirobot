'use client';

import { useState, useEffect, useRef } from 'react';
import type { ContainerStatus } from '../types';
import { getEmployee } from '../api/employees';

export function useEmployeeStatus(employeeId: string | null, pollInterval = 10000) {
  const [status, setStatus] = useState<ContainerStatus>('none');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const emp = await getEmployee(employeeId!);
        if (!cancelled) {
          setStatus(emp.container_status);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    intervalRef.current = setInterval(poll, pollInterval);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [employeeId, pollInterval]);

  return { status, loading };
}
