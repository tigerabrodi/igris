import { Route, Routes } from 'react-router'
import { AuthLayout } from './layouts/auth'
import { ROUTES } from './lib/constants'
import { AuthEntryPage } from './pages/auth-entry'
import { VoiceSetsPage } from './pages/voice-sets'
import { VoiceSetsDetailPage } from './pages/voice-sets-detail'

function App() {
  return (
    <Routes>
      <Route path={ROUTES.authEntry} element={<AuthEntryPage />} />
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.voiceSets} element={<VoiceSetsPage />} />
        <Route path={ROUTES.voiceSet} element={<VoiceSetsDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
