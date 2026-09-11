import { supabase } from './supabaseClient';

// Field name aliases: Base44 uses created_date/updated_date, Supabase uses created_at/updated_at
const FIELD_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
};

function resolveField(field) {
  return FIELD_ALIASES[field] || field;
}

// Tables PARTAGÉES (non liées à un utilisateur) : on ne filtre pas par user_id.
const SHARED_TABLES = new Set(['exercise_library']);

// Isolation des données : renvoie l'id de l'utilisateur connecté.
// Défense en profondeur au cas où les règles RLS Supabase ne seraient pas actives :
// on ne lit QUE les lignes de l'utilisateur courant.
async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

function createEntityShim(tableName) {
  const isShared = SHARED_TABLES.has(tableName);
  return {
    async list(sort, limit) {
      let query = supabase.from(tableName).select('*');
      if (!isShared) {
        const uid = await currentUserId();
        if (!uid) return []; // pas connecté → aucune donnée personnelle
        query = query.eq('user_id', uid);
      }
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
      if (!isShared) {
        const uid = await currentUserId();
        if (!uid) return [];
        query = query.eq('user_id', uid);
      }
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.session;
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
// IA -- appel via la fonction serverless /api/llm
// La clé du fournisseur (Gemini/Groq/OpenAI) reste côté serveur,
// jamais exposée dans le navigateur.
// ============================================================
async function InvokeLLM({ prompt, response_json_schema }) {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, response_json_schema }),
  });

  if (!res.ok) {
    let detail = '';
    let providerStatus = res.status;
    try {
      const err = await res.json();
      detail = err.error || '';
      if (err.provider_status) providerStatus = err.provider_status;
    } catch {
      // réponse non-JSON, on garde le message générique
    }
    // Message honnête en cas de quota épuisé (429) : inutile de spammer "réessaie".
    if (providerStatus === 429) {
      const e = new Error('Le service IA a atteint sa limite pour le moment. Utilise le programme débutant prêt à l\'emploi ci-dessous, ou réessaie plus tard.');
      e.code = 'quota';
      throw e;
    }
    throw new Error(detail || `Erreur IA (${res.status}). Réessaie dans un instant.`);
  }

  const { text = '' } = await res.json();

  if (response_json_schema) {
    // Certains modèles enrobent le JSON dans des balises Markdown ```json ... ``` :
    // on nettoie avant de parser pour éviter un programme vide en silence.
    const cleaned = String(text)
      .replace(/^\s*```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Dernier recours : extraire le premier objet JSON complet de la réponse.
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch { /* noop */ }
      }
      if (parsed === undefined) {
        // Échec réel : on lève une erreur plutôt que de renvoyer un objet vide
        // (sinon l'app créait un programme sans aucune séance, sans prévenir).
        throw new Error('Réponse IA illisible. Réessaie ou utilise le programme débutant prêt à l\'emploi.');
      }
    }
    // Certains modèles (ex: Groq) enveloppent tout le résultat sous une clé
    // parente arbitraire ("program", "programme", "data"...). Les vraies réponses
    // de l'app ont plusieurs clés à la racine, donc un objet à UNE seule clé dont
    // la valeur est un objet/tableau est un emballage : on le déballe (max 3 niveaux).
    let depth = 0;
    while (
      parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
      Object.keys(parsed).length === 1 &&
      parsed[Object.keys(parsed)[0]] && typeof parsed[Object.keys(parsed)[0]] === 'object' &&
      depth < 3
    ) {
      parsed = parsed[Object.keys(parsed)[0]];
      depth += 1;
    }
    return parsed;
  }
  return text;
}

// ============================================================
// Upload fichier -- Supabase Storage
// ============================================================
async function UploadFile({ file }) {
  const bucket = 'nfit-uploads';
  const ext = file.name.split('.').pop();
  // La politique Storage exige que le fichier soit dans un dossier au nom de
  // l'utilisateur (auth.uid). On préfixe donc le chemin par son id.
  const { data: { user } } = await supabase.auth.getUser();
  const prefix = user?.id ? `${user.id}/` : '';
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
      throw new Error(`Fonction "${name}" non encore configuree (Stripe/Edge Functions a venir).`);
    },
  },
  asServiceRole: null,
};
