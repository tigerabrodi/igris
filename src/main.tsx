import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { Analytics } from '@vercel/analytics/react'
import { ConvexReactClient } from 'convex/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ConvexAuthProvider client={convex}>
        <App />
        <Toaster />
        <Analytics />
      </ConvexAuthProvider>
    </BrowserRouter>
  </StrictMode>
)
