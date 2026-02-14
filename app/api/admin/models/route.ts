import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/admin-auth';
import { getModelInfo, getLiteLLMHealth, MODEL_COSTS } from '@/lib/litellm';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [models, health] = await Promise.all([
    getModelInfo(),
    getLiteLLMHealth(),
  ]);

  // Merge with our cost data
  const enriched = models.map(m => ({
    name: m.model_name,
    provider: m.litellm_params.model.split('/')[0],
    model: m.litellm_params.model,
    costs: MODEL_COSTS[m.model_name] || null,
    maxTokens: m.model_info?.max_tokens || null,
  }));

  // Add models we know about but may not be in LiteLLM yet
  for (const [name, costs] of Object.entries(MODEL_COSTS)) {
    if (!enriched.find(m => m.name === name)) {
      enriched.push({
        name,
        provider: name.startsWith('gemini') ? 'google' : 'anthropic',
        model: name,
        costs,
        maxTokens: null,
      });
    }
  }

  return NextResponse.json({
    models: enriched,
    health,
    budgetRules: {
      dailyCeiling: 5.0,
      weeklyCeiling: 25.0,
      runawayThreshold: 200.0,
    },
  });
}
