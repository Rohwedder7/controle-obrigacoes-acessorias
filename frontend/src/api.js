const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function api(path, options={}){
  const headers = options.headers || {}
  const token = localStorage.getItem('access')
  if(token) headers['Authorization'] = 'Bearer ' + token
  
  try {
    console.log('API Request:', API + path, { headers, ...options })
    const response = await fetch(API + path, { ...options, headers })
    console.log('API Response:', response.status, response.statusText)
    
    // Verificar se a resposta é HTML (erro do Django)
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text()
      console.error('Resposta HTML inesperada:', htmlText.substring(0, 200))
      throw new Error('Servidor retornou HTML em vez de JSON. Verifique se o backend está funcionando.')
    }
    
    return response
  } catch (error) {
    console.error('Erro na requisição API:', error)
    throw error
  }
}

export async function login(username, password){
  const r = await fetch(API + '/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if(!r.ok) throw new Error('Login inválido')
  return r.json()
}

export async function getSummary(){
  const r = await api('/reports/summary/')
  return r.json()
}

export async function getDetailedReport(filters = {}){
  const params = new URLSearchParams()
  
  // Adicionar filtros como query parameters
  if (filters.company_ids && filters.company_ids.length > 0) {
    filters.company_ids.forEach(id => params.append('company_id', id))
  }
  if (filters.obligation_name) {
    params.append('obligation_name', filters.obligation_name)
  }
  if (filters.obligation_type_ids && filters.obligation_type_ids.length > 0) {
    filters.obligation_type_ids.forEach(id => params.append('obligation_type_id', id))
  }
  if (filters.competence_start) {
    params.append('competence_start', filters.competence_start)
  }
  if (filters.competence_end) {
    params.append('competence_end', filters.competence_end)
  }
  if (filters.due_start) {
    params.append('due_start', filters.due_start)
  }
  if (filters.due_end) {
    params.append('due_end', filters.due_end)
  }
  if (filters.status) {
    params.append('status', filters.status)
  }
  
  const queryString = params.toString()
  const url = queryString ? `/reports/detailed/?${queryString}` : '/reports/detailed/'
  
  const r = await api(url)
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  return r.json()
}

export async function downloadReport(path, filename, filters = {}){
  const params = new URLSearchParams()
  
  // Adicionar filtros como query parameters
  if (filters.company_ids && filters.company_ids.length > 0) {
    filters.company_ids.forEach(id => params.append('company_id', id))
  }
  if (filters.obligation_name) {
    params.append('obligation_name', filters.obligation_name)
  }
  if (filters.obligation_type_ids && filters.obligation_type_ids.length > 0) {
    filters.obligation_type_ids.forEach(id => params.append('obligation_type_id', id))
  }
  if (filters.competence_start) {
    params.append('competence_start', filters.competence_start)
  }
  if (filters.competence_end) {
    params.append('competence_end', filters.competence_end)
  }
  if (filters.due_start) {
    params.append('due_start', filters.due_start)
  }
  if (filters.due_end) {
    params.append('due_end', filters.due_end)
  }
  if (filters.status) {
    params.append('status', filters.status)
  }
  
  const queryString = params.toString()
  const url = queryString ? `${path}?${queryString}` : path
  
  const token = localStorage.getItem('access')
  const r = await fetch(API + url, { 
    headers: { 
      'Authorization': 'Bearer ' + token 
    } 
  })
  
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    throw new Error(`Erro ${r.status}: ${r.statusText}`)
  }
  
  const blob = await r.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}

export async function getObligations(){
  const r = await api('/obligations/')
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function createObligation(payload){
  const r = await api('/obligations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  
  if (!r.ok) {
    const errorText = await r.text()
    console.error('Erro na API:', r.status, r.statusText, errorText)
    throw new Error(`Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function updateObligation(id, data){
  const r = await api(`/obligations/${id}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function deleteObligation(id){
  const r = await api(`/obligations/${id}/`, {
    method: 'DELETE'
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return true
}

export async function uploadSubmission(formData){
  const r = await api('/submissions/', {
    method: 'POST',
    body: formData
  })
  return r.json()
}

export async function getCompanies(){ 
  const r = await api('/companies/')
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json() 
}
export async function getStates(){ 
  const r = await api('/states/')
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json() 
}
export async function getObligationTypes(){ 
  const r = await api('/obligation-types/')
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json() 
}

export async function getReportByObligation(obligationIds = []){
  const params = new URLSearchParams()
  if(obligationIds.length > 0){
    obligationIds.forEach(id => params.append('obligation_type', id))
  }
  const r = await api(`/obligations/?${params.toString()}`)
  return r.json()
}

export async function getReportByCompany(companyIds = []){
  const params = new URLSearchParams()
  if(companyIds.length > 0){
    companyIds.forEach(id => params.append('company', id))
  }
  const r = await api(`/obligations/?${params.toString()}`)
  return r.json()
}


export async function getUsers(){
  const r = await api('/users/')
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function uploadCompaniesBulk(formData){
  const r = await api('/imports/companies/', {
    method: 'POST',
    body: formData
  })
  return r.json()
}

export async function uploadObligationsBulk(formData){
  const r = await api('/imports/obligations/', {
    method: 'POST',
    body: formData
  })
  return r.json()
}

export async function downloadTemplate(templateType){
  const r = await api(`/templates/${templateType}/`)
  return r.blob()
}

// Notificações
export async function getNotifications(){
  const r = await api('/notifications/')
  return r.json()
}

export async function getNotificationStats(){
  const r = await api('/notifications/stats/')
  return r.json()
}

export async function markNotificationRead(notificationId){
  const r = await api(`/notifications/${notificationId}/read/`, {
    method: 'POST'
  })
  return r.json()
}

export async function markAllNotificationsRead(){
  const r = await api('/notifications/read-all/', {
    method: 'POST'
  })
  return r.json()
}

// Planejamento Automático
export async function generateObligations(monthsAhead = 3, companyId = null, obligationTypeId = null, 
                                        obligationName = null, stateId = null){
  const r = await api('/planning/generate/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      months_ahead: monthsAhead, 
      company_id: companyId,
      obligation_type_id: obligationTypeId,
      obligation_name: obligationName,
      state_id: stateId
    })
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function checkDueDates(daysAhead = 7){
  const r = await api('/planning/check-due-dates/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ days_ahead: daysAhead })
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function checkOverdueObligations(){
  const r = await api('/planning/check-overdue/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function sendEmailNotifications(){
  const r = await api('/planning/send-emails/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

// Relatórios Avançados
export async function getAdvancedReports(filters = {}){
  const params = new URLSearchParams()
  Object.keys(filters).forEach(key => {
    if(filters[key]) params.append(key, filters[key])
  })
  const r = await api(`/reports/advanced/?${params.toString()}`)
  return r.json()
}

export async function getUserPerformanceReport(userId){
  const r = await api(`/reports/user/${userId}/`)
  return r.json()
}

// Gestão de usuários (Admin apenas)
export async function getUsersAdmin(){
  const r = await api('/users/admin/')
  return r.json()
}

export async function setUserRole(userId, role){
  const r = await api(`/users/${userId}/role/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  })
  return r.json()
}

export async function getUserHistory(userId){
  const r = await api(`/users/${userId}/history/`)
  return r.json()
}

export async function getUserStats(){
  const r = await api('/users/stats/')
  return r.json()
}

export async function getCurrentUser(){
  const r = await api('/me/')
  if (!r.ok) {
    throw new Error(`Erro ${r.status}: ${r.statusText}`)
  }
  return r.json()
}

export async function deleteUser(userId){
  const r = await api(`/users/${userId}/`, {
    method: 'DELETE'
  })
  return r.json()
}

export async function changeUserPassword(userId, newPassword){
  console.log('changeUserPassword chamada com:', { userId, newPassword })
  
  const r = await api(`/users/${userId}/password/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ new_password: newPassword })
  })
  
  console.log('Resposta da API:', r.status, r.statusText)
  
  if (!r.ok) {
    console.error('Erro na resposta da API:', r.status, r.statusText)
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    console.error('Dados do erro:', errorData)
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  const result = await r.json()
  console.log('Resultado da API:', result)
  return result
}

export async function createUser(userData){
  const r = await api('/users/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.errors ? JSON.stringify(errorData.errors) : (errorData.error || `Erro ${r.status}: ${r.statusText}`))
  }
  
  return r.json()
}

// ===== ENTREGAS PRO =====

export async function getCompanyObligations(companyId) {
  const r = await api(`/companies/${companyId}/obligations/`)
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  return r.json()
}

export async function downloadDeliveryTemplate() {
  const token = localStorage.getItem('access')
  const r = await fetch(API + '/deliveries/template.xlsx', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    throw new Error(`Erro ${r.status}: ${r.statusText}`)
  }
  
  const blob = await r.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = 'template_entregas.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}

export async function bulkDeliveries(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const token = localStorage.getItem('access')
  const r = await fetch(API + '/deliveries/bulk/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: formData
  })
  
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function bulkAttachments(files) {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  const token = localStorage.getItem('access')
  const r = await fetch(API + '/deliveries/bulk-attachments/', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: formData
  })
  
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function getDeliveries(filters = {}) {
  const params = new URLSearchParams()
  
  if (filters.search) {
    params.append('search', filters.search)
  }
  if (filters.company) {
    params.append('company', filters.company)
  }
  if (filters.status) {
    params.append('status', filters.status)
  }
  
  const queryString = params.toString()
  const url = queryString ? `/deliveries/?${queryString}` : '/deliveries/'
  
  const r = await api(url)
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

// ===== SISTEMA DE APROVAÇÃO =====

export async function getPendingApprovals(filters = {}) {
  const params = new URLSearchParams()
  
  if (filters.company) params.append('company', filters.company)
  if (filters.obligation_type) params.append('obligation_type', filters.obligation_type)
  if (filters.search) params.append('search', filters.search)
  if (filters.start_date) params.append('start_date', filters.start_date)
  if (filters.end_date) params.append('end_date', filters.end_date)
  
  const queryString = params.toString()
  const url = queryString ? `/approvals/pending/?${queryString}` : '/approvals/pending/'
  
  const r = await api(url)
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function approveSubmission(submissionId, comment = '') {
  const r = await api(`/approvals/${submissionId}/approve/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment })
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function rejectSubmission(submissionId, comment) {
  const r = await api(`/approvals/${submissionId}/reject/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment })
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function requestRevision(submissionId, comment) {
  const r = await api(`/approvals/${submissionId}/request-revision/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment })
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function resubmitSubmission(submissionId, formData) {
  const r = await api(`/approvals/${submissionId}/resubmit/`, {
    method: 'POST',
    body: formData
  })
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function getSubmissionTimeline(submissionId) {
  const r = await api(`/approvals/${submissionId}/timeline/`)
  
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export async function downloadAttachment(submissionId, attachmentId) {
  const token = localStorage.getItem('access')
  const r = await fetch(API + `/approvals/${submissionId}/attachments/${attachmentId}/download/`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  
  if (!r.ok) {
    if (r.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    throw new Error(`Erro ${r.status}: ${r.statusText}`)
  }
  
  const blob = await r.blob()
  const contentDisposition = r.headers.get('Content-Disposition')
  let filename = 'arquivo'
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
    if (filenameMatch) {
      filename = filenameMatch[1]
    }
  }
  
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}

export async function getMyDeliveries(statusFilter = '') {
  const params = new URLSearchParams()
  if (statusFilter) params.append('status', statusFilter)
  
  const queryString = params.toString()
  const url = queryString ? `/approvals/my-deliveries/?${queryString}` : '/approvals/my-deliveries/'
  
  const r = await api(url)
  if (!r.ok) {
    const errorData = await r.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.error || `Erro ${r.status}: ${r.statusText}`)
  }
  
  return r.json()
}

export default API
