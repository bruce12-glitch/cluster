import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted so the page renders identically offline and never blocks on a
// third-party font CDN. Variable axis, so every tracking step stays crisp.
import '@fontsource-variable/jetbrains-mono'

import './index.css'
import App from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('[infinitum] Mount point #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
