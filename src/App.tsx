// App.tsx — root component of CircaLog.
// Defines which page component renders for each URL path.

import { Routes, Route } from 'react-router-dom' // URL-to-component mapping
import ComingSoon from '@/pages/ComingSoon'       // Route: /
import AppShell   from '@/pages/AppShell'         // Route: /log

export default function App() {
  return (
    <Routes>
      {/* / → coming soon landing page */}
      <Route path="/" element={<ComingSoon />} />

      {/* /log → the main PWA application */}
      <Route path="/log" element={<AppShell />} />
    </Routes>
  )
}
