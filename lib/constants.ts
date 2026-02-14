import type { PlanTier } from './types';

// New model: $199/worker/month. Each worker = 1 channel, all skills for that channel.
// No tiers. Want more channels? Hire more workers.
export const WORKER_PRICE = 199;

export const PLAN_LIMITS: Record<PlanTier, { maxEmployees: number; maxSkills: number; price: number }> = {
  worker: { maxEmployees: 99, maxSkills: 99, price: WORKER_PRICE },
};

// Legacy limits for existing subscriptions (deprecated — remove once all migrated)
export const LEGACY_PLAN_LIMITS: Record<string, { maxEmployees: number; maxSkills: number; price: number }> = {
  junior: { maxEmployees: 1, maxSkills: 1, price: 99 },
  medior: { maxEmployees: 5, maxSkills: 5, price: 399 },
  expert: { maxEmployees: 10, maxSkills: 15, price: 499 },
};

export const PORT_RANGES = {
  gateway: { min: 20000, max: 21999 },
  novnc: { min: 22000, max: 23999 },
} as const;

export const FILE_UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const FILE_UPLOAD_ALLOWED_TYPES = ['pdf', 'txt', 'md', 'csv', 'json', 'doc', 'docx'];

export const WORK_HOURS = 18;
export const SLEEP_HOURS = 6;

export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const TRIAL_DURATION_DAYS = 7;

export const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://localhost:3500';
export const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET || '';

export interface SkillDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  category: string;
  available: boolean;
}

export const SKILLS: SkillDef[] = [
  // Active X/Twitter skills (templates built)
  { id: 'x-commenter', emoji: '💬', title: 'X Commenter', desc: 'Finds relevant posts from target accounts and leaves smart comments that get you noticed.', category: 'X / Twitter', available: true },
  { id: 'x-tweet-writer', emoji: '✍️', title: 'X Tweet Writer', desc: 'Writes and posts original tweets using the 3-bucket system to grow your following.', category: 'X / Twitter', available: true },
  { id: 'x-article-writer', emoji: '📰', title: 'X Article Writer', desc: 'Writes long-form X articles that position you as a thought leader in your niche.', category: 'X / Twitter', available: true },
  { id: 'x-thread-writer', emoji: '🧵', title: 'X Thread Writer', desc: 'Crafts viral threads that break down ideas, tell stories, and build your following.', category: 'X / Twitter', available: true },
  // Reddit skills (coming soon)
  { id: 'reddit-commenter', emoji: '💬', title: 'Reddit Commenter', desc: 'Finds relevant subreddits and leaves valuable, on-topic comments that build authority and drive traffic.', category: 'Reddit', available: false },
  { id: 'reddit-poster', emoji: '📝', title: 'Reddit Poster', desc: 'Creates engaging Reddit posts that provide value, spark discussion, and grow your presence in target communities.', category: 'Reddit', available: false },
  // Internal worker types (admin-only)
  { id: 'ops-monitor', emoji: '🔧', title: 'Ops Monitor', desc: 'Internal: monitors infrastructure, workers, and business metrics. Admin-only.', category: 'Internal', available: false },
];

// New pricing: per-worker, per-channel. No tiers.
export const PLANS = [
  { id: 'worker' as const, title: 'Worker', price: '$199', desc: '1 worker, 1 channel, all skills', maxSkills: 99, maxEmployees: 99 },
];

// Channel definitions — each worker is assigned to one channel and gets ALL skills for it
export const CHANNELS: { id: string; title: string; skills: string[] }[] = [
  { id: 'x-twitter', title: 'X / Twitter', skills: ['x-commenter', 'x-tweet-writer', 'x-thread-writer', 'x-article-writer'] },
  { id: 'reddit', title: 'Reddit', skills: ['reddit-commenter', 'reddit-poster'] },
  // Future channels (skills not yet built):
  // { id: 'instagram', title: 'Instagram', skills: ['instagram-content'] },
  // { id: 'youtube', title: 'YouTube', skills: ['yt-shorts-script', 'yt-long-script', 'yt-community'] },
  // { id: 'email', title: 'Email', skills: ['email-newsletter', 'email-flow', 'email-responder'] },
  // { id: 'tiktok', title: 'TikTok', skills: ['tiktok-content'] },
  // { id: 'discord', title: 'Discord', skills: ['discord-engagement'] },
  // { id: 'linkedin', title: 'LinkedIn', skills: [] },
  // { id: 'facebook', title: 'Facebook', skills: ['facebook-group'] },
];

export const TONES = [
  { id: 'witty', emoji: '😏', label: 'Witty', desc: 'Sharp, clever, a bit edgy' },
  { id: 'professional', emoji: '💼', label: 'Professional', desc: 'Polished and authoritative' },
  { id: 'friendly', emoji: '😊', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'provocative', emoji: '🔥', label: 'Provocative', desc: 'Bold takes, strong opinions' },
];

export const WORKER_NAMES = [
  'Atlas', 'Nova', 'Scout', 'Echo', 'Vega', 'Orion', 'Pixel', 'Sage',
  'Blaze', 'Ridge', 'Lux', 'Drift', 'Ember', 'Flux', 'Haze', 'Jett',
  'Koda', 'Maven', 'Nyx', 'Onyx', 'Pulse', 'Quinn', 'Raze', 'Slate',
  'Thorn', 'Volt', 'Wren', 'Zara', 'Axel', 'Cleo', 'Dash', 'Fern',
  'Grit', 'Hawk', 'Ivy', 'Jade', 'Knox', 'Luna', 'Milo', 'Nero',
];
