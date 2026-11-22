import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerAutoUpdate } from '@/lib/autoUpdate'

registerAutoUpdate();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)