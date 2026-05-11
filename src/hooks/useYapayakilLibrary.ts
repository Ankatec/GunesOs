import { useEffect, useRef, useState, useCallback } from "react";

const PRIMARY = "https://cdn.jsdelivr.net/gh/Ankatec/yapayakilkutuphanesi@main/";
const FALLBACK = "https://raw.githubusercontent.com/Ankatec/yapayakilkutuphanesi/main/";
const INDEX_KEY = "yapayakil_lib_index_v1";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface LibraryIndex {
  name: string;
  version: string;
  cdn: { primary: string; fallback: string };
  categories: Record<string, Record<string, string>>;
  search?: string;
}

const memCache = new Map<string, any>();

async function fetchJSON<T = any>(path: string): Promise<T> {
  if (memCache.has(path)) return memCache.get(path);
  const urls = [PRIMARY + path, FALLBACK + path];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      memCache.set(path, data);
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export function useYapayakilLibrary() {
  const [index, setIndex] = useState<LibraryIndex | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    (async () => {
      try {
        const cached = localStorage.getItem(INDEX_KEY);
        if (cached) {
          const { ts, data } = JSON.parse(cached);
          if (Date.now() - ts < TTL_MS) {
            setIndex(data);
            setReady(true);
            return;
          }
        }
        const data = await fetchJSON<LibraryIndex>("index.json");
        localStorage.setItem(INDEX_KEY, JSON.stringify({ ts: Date.now(), data }));
        setIndex(data);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kütüphane yüklenemedi");
      }
    })();
  }, []);

  const loadCategory = useCallback(
    async (cat: string, key: string) => {
      if (!index) return null;
      const path = index.categories?.[cat]?.[key];
      if (!path) return null;
      try {
        return await fetchJSON(path);
      } catch {
        return null;
      }
    },
    [index]
  );

  const findSnippet = useCallback(
    async (query: string): Promise<{ name: string; code: string } | null> => {
      if (!index) return null;
      const q = query.toLowerCase();
      const lang =
        /css|stil|grid|flex|renk/.test(q) ? "css" :
        /js|javascript|fonksiyon|debounce|fetch|clipboard|storage/.test(q) ? "js" :
        "html";
      const data: any = await loadCategory(lang, "snippets");
      if (!data) return null;
      const list: any[] = Array.isArray(data) ? data : data.snippets || data.items || Object.values(data);
      const hit = list.find((s) => {
        const text = `${s.name || s.title || ""} ${s.tags?.join(" ") || ""} ${s.description || ""}`.toLowerCase();
        return q.split(/\s+/).some((w) => w.length > 2 && text.includes(w));
      }) || list[0];
      if (!hit) return null;
      return { name: hit.name || hit.title || "snippet", code: hit.code || hit.html || hit.css || hit.js || "" };
    },
    [index, loadCategory]
  );

  return { index, ready, error, loadCategory, findSnippet };
}
