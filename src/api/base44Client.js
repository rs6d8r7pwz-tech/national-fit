import { supabase } from './supabaseClient';

// Field name aliases: Base44 uses created_date/updated_date, Supabase uses created_at/updated_at
const FIELD_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
};

function resolveField(field) {
  return FIELD_ALIASES[field] || field;
}

function createEntityShim(tableName) {
  return {
    async list(sort, limit) {
      let query = supabase.from(tableName).select('*');
      if (sort) {
        const desc = sort.startsWith('-');
        const field = resolveField(sort.replace(/^-/, ''));
        query = query.order(field, { ascending: !desc });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filters)) {
        if (['created_by', 'created_by_id'].includes(key)) continue;
        query = query.eq(key, value);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async create(data) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([{ ...data, user_id: user?.id }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  };
}

const auth = {
  async loginViaEmailPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  loginWithProvider(provider, redirectPath) {
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${redirectPath || '/'}`,
      },
    });
  },

  async register({ email, password }) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) throw error;
    return data.session;
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  },

  setToken() {
    // Supabase gère les tokens automatiquement via les cookies/localStorage
  },

  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    return user;
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    window.location.href = redirectUrl || '/login';
  },

  redirectToLogin() {
    window.location.href = '/login';
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

// ============================================================
// IA — appel OpenAI via fetch natif
// ============================================================
async function InvokeLLM({ prompt, response_json_schema }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Clé OpenAI non configurée. Ajoute VITE_OPENAI_API_KEY dans .env.local');
  }

  const messages = [{ role: 'user', content: prompt }];
  const body = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 1200,
  };

  if (response_json_schema) {
    body.response_format = { type: 'json_object' };
    body.messages = [
      { role: 'system', content: 'Réponds uniquement en JSON valide.' },
      ...messages,
    ];
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';

  if (response_json_schema) {
    try { return JSON.parse(text); } catch { return {}; }
  }
  return text;
}

// ============================================================
// Upload fichier — Supabase Storage
// ============================================================
async function UploadFile({ file }) {
  const bucket = 'nfit-uploads';
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { file_url: data.publicUrl };
}

export const base44 = {
  auth,
  entities: {
    UserProfile: createEntityShim('user_profiles'),
    WorkoutProgram: createEntityShim('workout_programs'),
    WorkoutSession: createEntityShim('workout_sessions'),
    ExerciseLibrary: createEntityShim('exercise_library'),
    ExerciseLog: createEntityShim('exercise_logs'),
    PersonalRecord: createEntityShim('personal_records'),
    FavoriteProgram: createEntityShim('favorite_programs'),
    UserGoal: createEntityShim('user_goals'),
    Notification: createEntityShim('notifications'),
    ProgressEntry: createEntityShim('progress_entries'),
    ShoppingList: createEntityShim('shopping_lists'),
    Referral: createEntityShim('referrals'),
    FavoriteRecipe: createEntityShim('favorite_recipes'),
    MealPlan: createEntityShim('meal_plans'),
  },
  integrations: {
    Core: { InvokeLLM, UploadFile },
  },
  functions: {
    invoke: async (name) => {
      throw new Error(`Fonction "${name}" non encore configurée (Stripe/Edge Functions à venir).`);
    },
  },
  asServiceRole: null,
};
