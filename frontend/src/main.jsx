import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Obligations from './pages/Obligations'
import Submissions from './pages/Submissions'
import Reports from './pages/Reports'
import Imports from './pages/Imports'
import Notifications from './pages/Notifications'
import Planning from './pages/Planning'
import AdvancedReports from './pages/AdvancedReports'
import Users from './pages/Users'
import Approvals from './pages/Approvals'
import MyDeliveries from './pages/MyDeliveries'

function RequireAuth({ children }){
  const token = localStorage.getItem('access')
  return token ? children : <Navigate to="/login" />
}

// Adicionar tratamento de erro
try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Elemento root não encontrado')
  }
  
  const root = createRoot(rootElement)
  
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/" element={<RequireAuth><Dashboard/></RequireAuth>} />
          <Route path="/companies" element={<RequireAuth><Companies/></RequireAuth>} />
          <Route path="/obligations" element={<RequireAuth><Obligations/></RequireAuth>} />
          <Route path="/submissions" element={<RequireAuth><Submissions/></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports/></RequireAuth>} />
          <Route path="/imports" element={<RequireAuth><Imports/></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications/></RequireAuth>} />
          <Route path="/planning" element={<RequireAuth><Planning/></RequireAuth>} />
          <Route path="/advanced-reports" element={<RequireAuth><AdvancedReports/></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><Users/></RequireAuth>} />
          <Route path="/approvals" element={<RequireAuth><Approvals/></RequireAuth>} />
          <Route path="/my-deliveries" element={<RequireAuth><MyDeliveries/></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Erro ao renderizar a aplicação:', error)
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Erro na Aplicação</h1>
      <p>Erro: ${error.message}</p>
      <p>Verifique o console do navegador para mais detalhes.</p>
    </div>
  `
}