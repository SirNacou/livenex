import React from 'react'
import ReactDOM from 'react-dom/client'
import { RootLayout } from './lib/root-layout'
import './app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootLayout />
  </React.StrictMode>,
)
