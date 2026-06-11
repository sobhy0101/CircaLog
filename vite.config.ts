import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'fs'
// https://vitejs.dev/config/
// Vite 8 uses rolldown; Vitest 3 bundles an older rollup-based Vite.
// Using defineConfig from 'vite' keeps correct plugin types; the cast below
// allows the 'test' property that Vitest reads at runtime without changing
// how the Vite build works.
export default defineConfig({
  plugins: [
    tailwindcss(), // Processes all Tailwind utility classes
    react(),       // Enables React JSX transformation and fast refresh

    VitePWA({
      // 'autoUpdate' means the service worker updates silently in the background.
      // The new version becomes active after the user closes and reopens the app.
      // We pair this with a hook (see useAppUpdate.ts) that can show a changelog prompt.
      registerType: 'autoUpdate',

      // Generate the service worker and its assets during 'vite build'.
      // During 'vite dev', the service worker is inactive so it doesn't
      // interfere with hot module replacement (HMR).
      devOptions: {
        enabled: false,
      },

      // The Web App Manifest — tells the browser how to present the app
      // when installed on a device (name, icons, colors, start screen, etc.)
      manifest: {
        name: 'CircaLog',
        short_name: 'CircaLog',
        description:
          'Sleep tracking for Non-24-Hour Sleep-Wake Disorder and other circadian rhythm conditions.',

        // start_url is the page that opens when the user launches the installed app.
        // '/log' is the permanent home of the CircaLog PWA.
        start_url: '/log',

        // 'standalone' makes the app look like a native app — no browser chrome
        // (no address bar, no navigation buttons from the browser).
        display: 'standalone',

        // Orientation: allow both portrait and landscape.
        orientation: 'any',

        // theme_color sets the color of the browser/system chrome around the app
        // (e.g. the status bar on Android). Matches the app's deep navy background.
        theme_color: '#0F0F1E',

        // background_color is shown on the splash screen while the app loads.
        background_color: '#0F0F1E',

        // Icons — production set added 28 May 2026.
        // All files live in /public/images/brand/ and were generated via
        // realfavicongenerator.net from the CircaLog symbol mark SVG.
        // The PNG icons use purpose 'any maskable' because the artwork was
        // created with a ~350px safe zone inside a 512px artboard, which
        // satisfies the maskable icon safe-zone requirement.
        icons: [
          {
            // SVG icon — picked up by modern browsers that support it.
            src: '/images/brand/icons/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            // 192×192 PNG — required minimum size for Android home screen.
            src: '/images/brand/icons/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            // 512×512 PNG — used for the Android splash screen and
            // high-resolution home screen icons.
            src: '/images/brand/icons/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      // Workbox controls the service worker caching strategy.
      workbox: {
        // Cache all built assets (JS, CSS, images) with a cache-first strategy.
        // 'globPatterns' tells Workbox which files in the dist/ folder to precache.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // When a new service worker is waiting to activate, skip the waiting phase
        // and activate immediately. Combined with 'autoUpdate', this means the
        // app will use the new version as soon as all tabs are closed and reopened.
        skipWaiting: true,

        // After the new service worker activates, take control of all open tabs
        // immediately without requiring a page reload.
        clientsClaim: true,
      },
    }),
  ],

  define: {
    // __APP_VERSION__ is replaced at build time with the version string from
    // package.json. Using process.env.npm_package_version means it always
    // matches package.json without any manual synchronisation.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),

    // __CHANGELOG_CONTENT__ is replaced at build time with the full text of
    // CHANGELOG.md, read from disk. The hook (useChangelog.ts) parses this
    // string into structured entries. Bundling it here means the changelog
    // works fully offline — no network fetch needed at runtime.
    __CHANGELOG_CONTENT__: JSON.stringify(
      readFileSync(path.resolve(__dirname, 'CHANGELOG.md'), 'utf-8')
    ),
  },

  build: {
    // Raise the warning threshold to 700 kB — the main bundle sits at ~628 kB
    // (gzipped: ~173 kB), which is well within acceptable range for a PWA.
    chunkSizeWarningLimit: 700,

    // Split vendor libs into a separate chunk so app-only deploys don't bust
    // the cached vendor bundle (React, ReactDOM, Dexie).
    rolldownOptions: {
      output: {
        // Rolldown requires manualChunks to be a function (not a plain object).
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor'
          }
          if (id.includes('node_modules/dexie')) {
            return 'dexie'
          }
        },
      },
    },
  },

  server: {
    // Bind to 0.0.0.0 instead of 127.0.0.1 (loopback only).
    // This makes the dev server reachable from other devices on the same LAN (e.g. a phone at 10.0.0.140:5173).
    // WAN access still requires a separate port-forwarding rule on the router.
    host: true,
  },

  resolve: {
    alias: {
      // Allows clean imports like: import Foo from '@/components/Foo'
      // instead of messy relative paths like: '../../components/Foo'
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vitest configuration — runs via 'npm test'.
  // Defined here inside vite.config.ts so that Vitest inherits the same
  // plugins, path aliases, and module resolution as the app itself.
  // This means @/ imports work identically in tests and in production code.
  test: {
    // 'node' environment — correct for pure TypeScript logic tests
    // (circadian engine functions, data transformations, fixture validation).
    // If DOM tests are ever needed (e.g. component tests), switch specific
    // test files to 'jsdom' using a per-file environment annotation:
    //   // @vitest-environment jsdom
    environment: 'node',

    // Include all test files in src/ that match these patterns.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Globals: false — we use explicit imports (import { describe, it, expect }
    // from 'vitest') rather than relying on injected globals.
    // Explicit imports make it immediately clear where these functions come
    // from and prevent name collisions with any future testing utilities.
    globals: false,
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)
