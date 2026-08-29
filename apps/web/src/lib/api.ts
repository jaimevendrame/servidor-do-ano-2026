import axios, { AxiosError, AxiosInstance } from 'axios';

const TOKEN_KEY = 'sda:token';
const ADMIN_TOKEN_KEY = 'sda:admin-token';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL nao definida. Copie .env.example para .env.local.');
  }
  return `${url.replace(/\/$/, '')}/api`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

function traduzirErro(status: number, mensagemBackend?: string): string {
  if (mensagemBackend) return mensagemBackend;
  if (status === 401) return 'Sessao expirada. Faca login novamente.';
  if (status === 403) return 'Acesso negado.';
  if (status === 404) return 'Recurso nao encontrado.';
  if (status === 409) return 'Conflito de estado.';
  if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (status >= 500) return 'Erro no servidor. Tente novamente em instantes.';
  return 'Falha na requisicao.';
}

function extrairMensagemBackend(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const msg = (data as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.length > 0) return msg;
  if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
  return undefined;
}

export const api: AxiosInstance = axios.create({
  baseURL: '', // será preenchido no primeiro uso (lazy)
  timeout: 15000,
});

// Setter lazy do baseURL no primeiro uso
api.interceptors.request.use(config => {
  if (!config.baseURL) {
    config.baseURL = getBaseUrl();
  }
  // Rotas admin exigem o token de admin; as demais usam o do eleitor.
  // O token admin tem precedência quando a URL é de recurso administrativo.
  const url = config.url ?? '';
  const isAdminRoute =
    url.includes('/admin/') ||
    url.startsWith('/importacao') ||
    url.startsWith('importacao') ||
    // mutações de recursos administrativos
    ((config.method === 'post' || config.method === 'put' || config.method === 'delete') &&
      (url.includes('/candidatos') || url.includes('/edicoes') || url.includes('/janela')));

  const adminToken =
    typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  const eleitorToken = getToken();
  const token = isAdminRoute && adminToken ? adminToken : (eleitorToken ?? adminToken);

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const mensagemBackend = extrairMensagemBackend(error.response?.data);
    const mensagem = traduzirErro(status, mensagemBackend);

    // 401: token invalido/expirado -> descarta token local para evitar loop.
    if (status === 401) {
      clearToken();
    }

    return Promise.reject(new ApiError(status, mensagem));
  }
);
