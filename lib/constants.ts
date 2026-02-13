import type { PlanTier } from './types';

export const PLAN_LIMITS: Record<PlanTier, { maxEmployees: number; maxSkills: number; price: number }> = {
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
  { id: 'x-commenter', emoji: '💬', title: 'X Commenter', desc: 'Scrolls your feed, finds relevant posts, and leaves smart comments that get you noticed.', category: 'X / Twitter', available: false },
  { id: 'x-article-writer', emoji: '📰', title: 'X Article Writer', desc: 'Writes long-form X articles that position you as a thought leader in your niche.', category: 'X / Twitter', available: true },
  { id: 'x-thread-writer', emoji: '🧵', title: 'X Thread Writer', desc: 'Crafts viral threads that break down ideas, tell stories, and build your following.', category: 'X / Twitter', available: false },
  { id: 'email-newsletter', emoji: '📨', title: 'Email Newsletter Writer', desc: 'Writes engaging newsletters that keep your subscribers hooked and clicking.', category: 'Email', available: false },
  { id: 'email-flow', emoji: '⚡', title: 'Email Flow Writer', desc: 'Creates automated email sequences for welcome, nurture, sales, re-engagement.', category: 'Email', available: false },
  { id: 'email-responder', emoji: '📧', title: 'Email Responder', desc: 'Reads and replies to emails in your voice. Handles inbox on autopilot.', category: 'Email', available: false },
  { id: 'yt-shorts-script', emoji: '🎬', title: 'YouTube Shorts Script', desc: 'Writes punchy, hook-driven scripts for vertical short-form videos.', category: 'YouTube', available: false },
  { id: 'yt-long-script', emoji: '🎥', title: 'YouTube Long Script', desc: 'Full-length video scripts with hooks, structure, CTAs, and retention tricks.', category: 'YouTube', available: false },
  { id: 'yt-community', emoji: '📢', title: 'YouTube Community Post', desc: 'Writes community tab posts that boost engagement and drive views.', category: 'YouTube', available: false },
  { id: 'reddit-commenter', emoji: '🤖', title: 'Reddit Commenter', desc: 'Finds relevant threads in your niche subreddits and leaves helpful, authentic comments.', category: 'Reddit & Social', available: false },
  { id: 'discord-engagement', emoji: '🎮', title: 'Discord Engagement', desc: 'Joins your target Discord servers and builds presence through genuine conversations.', category: 'Reddit & Social', available: false },
  { id: 'facebook-group', emoji: '👥', title: 'Facebook Group', desc: 'Posts and comments in Facebook groups to build authority and drive traffic.', category: 'Reddit & Social', available: false },
  { id: 'instagram-content', emoji: '📸', title: 'Instagram Content', desc: 'Creates captions, Reels scripts, carousel text, and hashtag strategies.', category: 'Content & SEO', available: false },
  { id: 'tiktok-content', emoji: '🎵', title: 'TikTok Content', desc: 'Writes viral TikTok scripts, hooks, and trend-based content for your niche.', category: 'Content & SEO', available: false },
  { id: 'seo-optimization', emoji: '🔍', title: 'SEO Optimization', desc: 'Runs SEO audits, keyword research, and writes optimized content briefs.', category: 'Content & SEO', available: false },
];

export const PLANS = [
  { id: 'junior' as const, title: 'Junior', price: '$99', desc: '1 employee, 1 skill', maxSkills: 1, maxEmployees: 1 },
  { id: 'medior' as const, title: 'Medior', price: '$399', desc: '5 employees, 5 skills each', maxSkills: 5, maxEmployees: 5 },
  { id: 'expert' as const, title: 'Expert', price: '$499', desc: '10 employees, all skills', maxSkills: 15, maxEmployees: 10 },
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
