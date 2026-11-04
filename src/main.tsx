import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initMonitoring, reportError } from './lib/monitoring/monitoring'

createRoot(document.getElementById('root')!, {
  // Errors an error boundary (e.g. a route's error page) caught, such as a
  // page chunk that no longer exists after a deploy.
  onCaughtError(error, info) {
    console.error(error)
    reportError(error, { componentStack: info.componentStack })
  },
  onUncaughtError(error, info) {
    console.error(error)
    reportError(error, { componentStack: info.componentStack })
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void initMonitoring()
