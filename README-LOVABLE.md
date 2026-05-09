# GünesOS — GitHub Pages (Statik SPA)

Bu paket, repondaki TanStack Start + Cloudflare yapısını **statik Vite + React SPA**'ya dönüştürür ve GitHub Pages'te `https://ankatec.github.io/gunesos/` adresinde çalışır.

## Kurulum (tek seferlik)

1. Bu zip'i açın ve **tüm içeriği** mevcut `gunesos` repo klasörünüzün üzerine kopyalayın (üzerine yaz).
2. Repo'da artık olmaması gereken eski dosyalar (zaten bu zip'te yok, ama lokalde kalmışsa silin):
   - `src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/routeTree.gen.ts`
   - `src/routes/` klasörü
   - `wrangler.jsonc`
   - Eski `src/App.tsx` (yenisi yok — `src/main.tsx` doğrudan `<GunesOS />`'u render ediyor)
3. Commit & push (main branch).
4. GitHub → repo → **Settings → Pages → Source: GitHub Actions**.
5. Actions sekmesinden "Deploy to GitHub Pages" workflow'unun yeşil olmasını bekleyin.

## Lokal test

```bash
bun install
bun run build
bun run preview
# http://localhost:4173/gunesos/  adresinden açılır
```

## Neler değişti

- `vite.config.ts`: `base: "/gunesos/"`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`.
- `index.html`: Basit SPA shell, `#root` + `src/main.tsx`.
- `src/main.tsx`: React kökü; `QueryClient`, `ThemeProvider`, `TooltipProvider`, `Toaster`, ardından `<GunesOS />`.
- `package.json`: `@cloudflare/vite-plugin`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `@lovable.dev/vite-tanstack-config` kaldırıldı.
- `.github/workflows/deploy.yml`: Bun ile build → `dist/` → `dist/404.html = dist/index.html` (SPA fallback) → GitHub Pages.
- `src/components/*`, `src/contexts/*`, `src/hooks/*`, `src/lib/*`, `src/utils/*`, `src/assets/*`, `src/styles.css`, `public/*` AYNEN korundu.

## Custom domain
GitHub Pages için custom domain bağlarsanız `vite.config.ts`'de `base: "/"` yapın ve workflow'u tekrar çalıştırın.
