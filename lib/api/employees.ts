/**
 * Client-side API functions for employees.
 * Used by React components (browser-side fetch calls).
 */
import type { Employee, WorkerConfig, KnowledgeFile, EmployeeKnowledge } from '../types';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export interface EmployeeListResponse {
  employees: Employee[];
  maxEmployees: number;
  planStatus?: string;
  selectedPlan?: string;
  trialEndsAt?: string;
  hasSubscription: boolean;
}

/** List all employees + plan info for the current user */
export function listEmployees(): Promise<EmployeeListResponse> {
  return apiFetch('/api/employees');
}

/** Get a single employee */
export function getEmployee(id: string): Promise<Employee> {
  return apiFetch(`/api/employees/${id}`);
}

/** Hire a new employee */
export function hireEmployee(data: {
  name: string;
  personality: string;
  skills: string[];
  workerType: string;
  workerConfig: WorkerConfig;
}): Promise<Employee> {
  return apiFetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/** Fire (delete) an employee */
export function fireEmployee(id: string): Promise<void> {
  return apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
}

/** Update employee config */
export function updateEmployee(id: string, updates: {
  name?: string;
  personality?: string;
  skills?: string[];
  worker_config?: WorkerConfig;
}): Promise<Employee> {
  return apiFetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

/** Restart employee's container */
export function restartEmployee(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/api/employees/${id}/restart`, { method: 'POST' });
}

/** List reference files for an employee */
export function listFiles(id: string): Promise<KnowledgeFile[]> {
  return apiFetch(`/api/employees/${id}/files`);
}

/** Upload a reference file */
export async function uploadFile(id: string, file: File): Promise<{ success: boolean }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`/api/employees/${id}/files`, {
    method: 'POST',
    body: formData,
  });
}

/** Delete a reference file */
export function deleteFile(id: string, filename: string): Promise<void> {
  return apiFetch(`/api/employees/${id}/files?filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
}

/** Get employee knowledge (memory files) */
export function getKnowledge(id: string): Promise<EmployeeKnowledge> {
  return apiFetch(`/api/employees/${id}/knowledge`);
}
