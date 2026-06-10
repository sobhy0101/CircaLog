// App.tsx — root component of CircaLog.
// Defines which page component renders for each URL path.

import { Routes, Route } from 'react-router-dom'   // URL-to-component mapping
import ComingSoon  from '@/pages/ComingSoon'         // Route: /
import AppShell    from '@/pages/AppShell'           // Route: /log (shell wrapper)
import LogPage     from '@/pages/log/LogPage'        // Route: /log (index child)
import HistoryPage from '@/pages/history/HistoryPage' // Route: /log/history
import ChartPage   from '@/pages/chart/ChartPage'    // Route: /log/chart
import ImportPage  from '@/pages/log/ImportPage'     // Route: /log/import
import InsightsPage from '@/pages/insights/InsightsPage' // Route: /log/insights
import SessionDetailPage from '@/pages/history/SessionDetailPage' // Route: /log/history/:entryId

export default function App() {
  return (
    <Routes>
      {/* / → coming soon landing page */}
      <Route path="/" element={<ComingSoon />} />

      {/* /log → app shell; child pages render inside <Outlet /> */}
      <Route path="/log" element={<AppShell />}>
        <Route index element={<LogPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="history/:entryId" element={<SessionDetailPage />} />
        <Route path="chart" element={<ChartPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="insights" element={<InsightsPage />} />
      </Route>
    </Routes>
  )
}
