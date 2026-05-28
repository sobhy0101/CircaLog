import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
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
            src: '/images/brand/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            // 192×192 PNG — required minimum size for Android home screen.
            src: '/images/brand/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            // 512×512 PNG — used for the Android splash screen and
            // high-resolution home screen icons.
            src: '/images/brand/web-app-manifest-512x512.png',
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

  resolve: {
    alias: {
      // Allows clean imports like: import Foo from '@/components/Foo'
      // instead of messy relative paths like: '../../components/Foo'
      '@': path.resolve(__dirname, './src'),
    },
  },
})
