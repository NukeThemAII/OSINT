export interface HttpRequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

async function fetchWithTimeout(url: string, options: HttpRequestOptions = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: 'application/json,text/plain,*/*',
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const retries = options.retries ?? 2;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 500));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch JSON from ${url}`);
}

export async function fetchText(url: string, options: HttpRequestOptions = {}): Promise<string> {
  const response = await fetchWithTimeout(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  return query.toString();
}
