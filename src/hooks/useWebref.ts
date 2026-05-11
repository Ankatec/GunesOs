import { useCallback, useRef, useState } from "react";

const PRIMARY = "https://cdn.jsdelivr.net/gh/Ankatec/yapayakilkutuphanesi@main/vendor/webref/ed/";
const FALLBACK = "https://raw.githubusercontent.com/Ankatec/yapayakilkutuphanesi/main/vendor/webref/ed/";
const CACHE_PREFIX = "yapayakil_webref_";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface WebrefDfn {
  id: string;
  href: string;
  linkingText: string[];
  type: string;
  for: string[];
  heading?: { title?: string };
}

export interface WebrefElement {
  name: string;
  href: string;
  interface?: string;
}

interface DfnsFile { spec: any; dfns: WebrefDfn[] }
interface ElementsFile { spec: any; elements: WebrefElement[] }

async function fetchJSON<T>(path: string): Promise<T> {
  const cacheKey = CACHE_PREFIX + path;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < TTL_MS) return data as T;
    }
  } catch {/* ignore */}

  let lastErr: unknown;
  for (const base of [PRIMARY, FALLBACK]) {
    try {
      const res = await fetch(base + path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
      } catch {/* quota */}
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export function useWebref() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elementsCache = useRef<WebrefElement[] | null>(null);
  const dfnsCache = useRef<WebrefDfn[] | null>(null);

  const loadHtmlElements = useCallback(async (): Promise<WebrefElement[]> => {
    if (elementsCache.current) return elementsCache.current;
    const data = await fetchJSON<ElementsFile>("elements/html.json");
    elementsCache.current = data.elements || [];
    return elementsCache.current;
  }, []);

  const loadHtmlDfns = useCallback(async (): Promise<WebrefDfn[]> => {
    if (dfnsCache.current) return dfnsCache.current;
    setLoading(true);
    try {
      const data = await fetchJSON<DfnsFile>("dfns/html.json");
      dfnsCache.current = data.dfns || [];
      return dfnsCache.current;
    } catch (e) {
      setError(e instanceof Error ? e.message : "webref yüklenemedi");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Returns attribute names defined for a given HTML element */
  const getElementAttributes = useCallback(
    async (elementName: string): Promise<string[]> => {
      const dfns = await loadHtmlDfns();
      const name = elementName.toLowerCase();
      const attrs = new Set<string>();
      for (const d of dfns) {
        if (d.type !== "element-attr") continue;
        if (d.for?.includes(name) || d.for?.includes("htmlsvg-global") || d.for?.length === 0) {
          for (const t of d.linkingText) attrs.add(t);
        }
      }
      return Array.from(attrs).sort();
    },
    [loadHtmlDfns]
  );

  /** Quick element lookup (interface name etc.) — lightweight (~20KB) */
  const findElement = useCallback(
    async (name: string): Promise<WebrefElement | null> => {
      const els = await loadHtmlElements();
      const n = name.toLowerCase();
      return els.find((e) => e.name === n) || null;
    },
    [loadHtmlElements]
  );

  return { loading, error, findElement, getElementAttributes, loadHtmlElements };
}
