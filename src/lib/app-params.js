// Stub pour la compatibilité avec les composants qui importent appParams
export const appParams = {
  appId: null,
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '/',
  functionsVersion: null,
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
};
