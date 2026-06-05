import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import VoiceApp from './VoiceApp'
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <VoiceApp />
  </StrictMode>
)
