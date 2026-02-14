import { describe, it, expect } from 'vitest';
import {
  WORKER_PRICE,
  PLAN_LIMITS,
  PORT_RANGES,
  TRIAL_DURATION_DAYS,
  SKILLS,
  CHANNELS,
  PLANS,
  TONES,
  WORKER_NAMES,
} from '@/lib/constants';

describe('Pricing', () => {
  it('worker price is $199', () => {
    expect(WORKER_PRICE).toBe(199);
  });

  it('plan limits allow many employees for worker plan', () => {
    expect(PLAN_LIMITS.worker.maxEmployees).toBeGreaterThanOrEqual(1);
    expect(PLAN_LIMITS.worker.price).toBe(WORKER_PRICE);
  });

  it('PLANS array matches WORKER_PRICE', () => {
    expect(PLANS).toHaveLength(1);
    expect(PLANS[0].id).toBe('worker');
    expect(PLANS[0].price).toBe('$199');
  });
});

describe('Port ranges', () => {
  it('gateway and novnc ranges do not overlap', () => {
    expect(PORT_RANGES.gateway.max).toBeLessThan(PORT_RANGES.novnc.min);
  });

  it('each range has sufficient capacity', () => {
    const gatewayCapacity = PORT_RANGES.gateway.max - PORT_RANGES.gateway.min + 1;
    const novncCapacity = PORT_RANGES.novnc.max - PORT_RANGES.novnc.min + 1;
    expect(gatewayCapacity).toBeGreaterThanOrEqual(1000);
    expect(novncCapacity).toBeGreaterThanOrEqual(1000);
  });
});

describe('Trial', () => {
  it('trial duration is 7 days', () => {
    expect(TRIAL_DURATION_DAYS).toBe(7);
  });
});

describe('Skills & Channels', () => {
  it('all available skills have valid ids', () => {
    const availableSkills = SKILLS.filter(s => s.available);
    expect(availableSkills.length).toBeGreaterThan(0);
    availableSkills.forEach(skill => {
      expect(skill.id).toBeTruthy();
      expect(skill.title).toBeTruthy();
      expect(skill.category).toBeTruthy();
    });
  });

  it('x-twitter channel references only valid skill ids', () => {
    const xChannel = CHANNELS.find(c => c.id === 'x-twitter');
    expect(xChannel).toBeTruthy();
    const skillIds = SKILLS.map(s => s.id);
    xChannel!.skills.forEach(skillId => {
      expect(skillIds).toContain(skillId);
    });
  });

  it('every channel has at least one skill', () => {
    CHANNELS.forEach(channel => {
      expect(channel.skills.length).toBeGreaterThan(0);
    });
  });

  it('no duplicate skill ids', () => {
    const ids = SKILLS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Tones', () => {
  it('has at least 2 tone options', () => {
    expect(TONES.length).toBeGreaterThanOrEqual(2);
  });

  it('each tone has required fields', () => {
    TONES.forEach(tone => {
      expect(tone.id).toBeTruthy();
      expect(tone.label).toBeTruthy();
      expect(tone.desc).toBeTruthy();
    });
  });
});

describe('Worker names', () => {
  it('has enough names for scaling', () => {
    expect(WORKER_NAMES.length).toBeGreaterThanOrEqual(30);
  });

  it('no duplicate names', () => {
    expect(new Set(WORKER_NAMES).size).toBe(WORKER_NAMES.length);
  });
});
