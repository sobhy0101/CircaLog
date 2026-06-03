// App.tsx — root component of CircaLog.
// Defines which page component renders for each URL path.

import { Routes, Route } from 'react-router-dom' // URL-to-component mapping
import ComingSoon from '@/pages/ComingSoon'       // Route: /
import AppShell   from '@/pages/AppShell'         // Route: /log (shell wrapper)
import LogPage    from '@/pages/log/LogPage'      // Route: /log (index child)

export default function App() {
  return (
    <Routes>
      {/* / → coming soon landing page */}
      <Route path="/" element={<ComingSoon />} />

      {/* /log → app shell; LogPage renders inside <Outlet /> */}
      <Route path="/log" element={<AppShell />}>
        <Route index element={<LogPage />} />
      </Route>
    </Routes>
  )
}
