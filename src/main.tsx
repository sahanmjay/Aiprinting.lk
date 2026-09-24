import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Fade out the first-load splash from index.html once the app is up. Kept on screen for at
// least SPLASH_MIN_MS since page start so it reads as a brand moment, not a flicker.
const SPLASH_MIN_MS = 1200
const splash = document.getElementById('splash')
if (splash) {
  setTimeout(() => {
    splash.classList.add('splash-hide')
    setTimeout(() => splash.remove(), 450)
  }, Math.max(0, SPLASH_MIN_MS - performance.now()))
}
