import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Employee, WorkerConfig } from '../types';

function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** List all employees for a user */
export async function listEmployees(userId: string): Promise<Employee[]> {
  const db = getAdminClient();
  const { data, error } = await db
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to list employees: ${error.message}`);
  return data as Employee[];
}

/** Get a single employee by ID */
export async function getEmployee(employeeId: string): Promise<Employee | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to get employee: ${error.message}`);
  return (data as Employee) || null;
}

/** Verify an employee belongs to a user */
export async function verifyOwnership(employeeId: string, userId: string): Promise<Employee | null> {
  const db = getAdminClient();
  const { data, error } = await db
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(`Ownership check failed: ${error.message}`);
  return (data as Employee) || null;
}

/** Create a new employee */
export async function createEmployee(params: {
  userId: string;
  name: string;
  personality: string;
  skills: string[];
  workerType: string;
  workerConfig: WorkerConfig;
}): Promise<Employee> {
  const db = getAdminClient();

  // Get next sort order
  const { count } = await db
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', params.userId);

  const { data, error } = await db
    .from('employees')
    .insert({
      user_id: params.userId,
      name: params.name,
      personality: params.personality,
      skills: params.skills,
      worker_type: params.workerType,
      worker_config: params.workerConfig,
      sort_order: (count || 0),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create employee: ${error.message}`);
  return data as Employee;
}

/** Update employee container info after provisioning */
export async function updateEmployeeContainer(employeeId: string, container: {
  status: string;
  gatewayPort: number;
  novncPort: number;
  token: string;
}): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from('employees')
    .update({
      container_status: container.status,
      container_gateway_port: container.gatewayPort,
      container_novnc_port: container.novncPort,
      container_token: container.token,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId);

  if (error) throw new Error(`Failed to update container: ${error.message}`);
}

/** Update employee config */
export async function updateEmployee(employeeId: string, updates: Partial<Pick<Employee, 'name' | 'personality' | 'skills' | 'worker_config'>>): Promise<Employee> {
  const db = getAdminClient();
  const { data, error } = await db
    .from('employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update employee: ${error.message}`);
  return data as Employee;
}

/** Delete an employee */
export async function deleteEmployee(employeeId: string): Promise<void> {
  const db = getAdminClient();
  const { error } = await db
    .from('employees')
    .delete()
    .eq('id', employeeId);

  if (error) throw new Error(`Failed to delete employee: ${error.message}`);
}

/** Get user's max_employees from profile */
export async function getMaxEmployees(userId: string): Promise<number> {
  const db = getAdminClient();
  const { data, error } = await db
    .from('profiles')
    .select('max_employees')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`Failed to get profile: ${error.message}`);
  return data?.max_employees || 1;
}

/** Count user's current employees */
export async function countEmployees(userId: string): Promise<number> {
  const db = getAdminClient();
  const { count, error } = await db
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error(`Failed to count employees: ${error.message}`);
  return count || 0;
}
