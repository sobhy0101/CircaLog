// useAppUpdate.ts
//
// This hook detects when a new version of CircaLog has been downloaded
// in the background by the service worker.
//
// In V1, the changelog modal will import { needsUpdate, updateApp } from
// this hook to show a "New version available" prompt.
//
// 'virtual:pwa-register/react' is a module injected by vite-plugin-pwa
// at build time — it does not exist as a real file in node_modules.
// It exposes useRegisterSW(), which wraps the browser's service worker
// registration API with React state.
import { useRegisterSW } from 'virtual:pwa-register/react'

export function useAppUpdate() {
  const {
    // needRefresh: true when a new service worker has been downloaded and
    // is waiting to activate. This is when we'd show the changelog modal.
    needRefresh: [needsUpdate],

    // updateServiceWorker: call this to tell the waiting service worker to
    // activate now. Pass 'true' to also reload the page after activation.
    updateServiceWorker,
  } = useRegisterSW({
    // onRegistered fires once when the service worker registers successfully.
    // Useful for debugging — remove or silence in production later.
    onRegistered(registration) {
      console.log('[CircaLog] Service worker registered:', registration)
    },

    // onRegisterError fires if registration fails (e.g. in an unsupported browser).
    onRegisterError(error) {
      console.error('[CircaLog] Service worker registration failed:', error)
    },
  })

  // updateApp triggers the new service worker to activate and reloads the page.
  // The V1 changelog modal will call this after the user dismisses the prompt.
  const updateApp = () => updateServiceWorker(true)

  return { needsUpdate, updateApp }
}
