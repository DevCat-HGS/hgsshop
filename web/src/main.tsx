import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { dismissBootLoader } from './boot/dismissBootLoader.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Tras el primer pintado de React, no al evaluar el módulo.
requestAnimationFrame(() => requestAnimationFrame(dismissBootLoader))
