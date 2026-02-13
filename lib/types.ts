// Shared types for InstantWorker

export type PlanTier = 'worker';
// Legacy tiers kept for backward compat with existing subscriptions
export type LegacyPlanTier = 'junior' | 'medior' | 'expert';
export type PlanStatus = 'trial' | 'active' | 'past_due' | 'cancelled';
export type ContainerStatus = 'none' | 'provisioning' | 'running' | 'stopped' | 'error';

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  personality: string;
  skills: string[];
  worker_type: string;
  worker_config: WorkerConfig;
  container_status: ContainerStatus;
  container_gateway_port: number | null;
  container_novnc_port: number | null;
  container_token: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export interface WorkerConfig {
  skills?: string[];
  plan?: string;
  companyUrl?: string;
  clientDescription?: string;
  competitorUrls?: string[];
  timezone?: string;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  email: string;
  onboarding_completed: boolean;
  plan_status: PlanStatus;
  selected_plan: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  max_employees: number;
}

export interface KnowledgeFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export interface EmployeeKnowledge {
  companyProfile: string | null;
  researchFindings: string | null;
  pendingQuestions: string | null;
  suggestions: string | null;
}

export interface EmployeeDoc {
  filename: string;
  title: string;
  description: string;
  content: string;
}

export interface ApiError {
  error: string;
  code: string;
}
