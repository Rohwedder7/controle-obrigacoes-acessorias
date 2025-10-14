import React, { useEffect, useState } from 'react'
import { getObligations, getCompanies, getStates, getObligationTypes, createObligation, updateObligation, deleteObligation, getUsers, uploadObligationsBulk, downloadTemplate } from '../api'
import Layout from '../components/Layout'
import { ChevronDown, ChevronUp, Edit3, Trash2, Filter, Search, CheckSquare, Square, AlertTriangle, Plus, Upload, List, RotateCcw } from 'lucide-react'

export default function Obligations(){
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [states, setStates] = useState([])
  const [types, setTypes] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  
  // Estados para dropdowns
  const [activeSection, setActiveSection] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    cadastro: false,
    upload: false,
    lista: false
  })
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    type: ''
  })
  
  // Estados para seleção múltipla
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Estados para edição
  const [editingItem, setEditingItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  
  // Estados para modal de recorrência
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [recurrenceForm, setRecurrenceForm] = useState({
    company_id: '',
    state_code: '',
    obligation_type_id: '',
    count: 3,
    start_competence: '',
    start_due_date: '',
    start_delivery_deadline: ''
  })
  const [recurrencePreview, setRecurrencePreview] = useState(null)
  const [recurrenceLoading, setRecurrenceLoading] = useState(false)
  const [recurrenceResult, setRecurrenceResult] = useState(null)
  
  // Formulário
  const [form, setForm] = useState({ 
    company_id:'', 
    state_id:'', 
    obligation_type_id:'', 
    obligation_name:'',
    competence:'', 
    due_date:'', 
    delivery_deadline:'', 
    responsible_user_id:'',
    validity_start_date:'',
    validity_end_date:'',
    notes:'' 
  })
  const [uploadFile, setUploadFile] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [items, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Carregando dados...')
      
      // Carregar dados em paralelo
      const [obligationsData, companiesData, statesData, typesData, usersData] = await Promise.all([
        getObligations().catch(err => {
          console.error('Erro ao carregar obrigações:', err)
          return []
        }),
        getCompanies().catch(err => {
          console.error('Erro ao carregar empresas:', err)
          return []
        }),
        getStates().catch(err => {
          console.error('Erro ao carregar estados:', err)
          return []
        }),
        getObligationTypes().catch(err => {
          console.error('Erro ao carregar tipos de obrigação:', err)
          return []
        }),
        getUsers().catch(err => {
          console.error('Erro ao carregar usuários:', err)
          return []
        })
      ])
      
      console.log('📊 Dados carregados:', {
        obrigações: obligationsData.length,
        empresas: companiesData.length,
        estados: statesData.length,
        tipos: typesData.length,
        usuários: usersData.length
      })
      
      setItems(obligationsData || [])
      setCompanies(companiesData || [])
      setStates(statesData || [])
      setTypes(typesData || [])
      setUsers(usersData || [])
      
      // Se não há obrigações, mostrar mensagem
      if (!obligationsData || obligationsData.length === 0) {
        console.log('⚠️ Nenhuma obrigação encontrada')
      }
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error)
      alert('Erro ao carregar dados. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...items]
    
    if (filters.search) {
      filtered = filtered.filter(item => 
        item.obligation_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.obligation_type?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.company?.name?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    if (filters.company) {
      filtered = filtered.filter(item => item.company?.id == filters.company)
    }
    
    if (filters.type) {
      filtered = filtered.filter(item => item.obligation_type?.id == filters.type)
    }
    
    setFilteredItems(filtered)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validação dos campos obrigatórios
    if (!form.company_id) {
      alert('Por favor, selecione uma empresa')
      return
    }
    if (!form.state_id) {
      alert('Por favor, selecione um estado')
      return
    }
    if (!form.obligation_type_id) {
      alert('Por favor, selecione um tipo de obrigação')
      return
    }
    if (!form.obligation_name) {
      alert('Por favor, digite o nome da obrigação acessória')
      return
    }
    if (!form.competence) {
      alert('Por favor, informe a competência (MM/AAAA)')
      return
    }
    if (!form.due_date) {
      alert('Por favor, informe a data de vencimento')
      return
    }
    
    try {
      setLoading(true)
      
      // Preparar dados para envio, convertendo strings vazias em null
      const formData = {
        ...form,
        responsible_user_id: form.responsible_user_id || null,
        validity_start_date: form.validity_start_date || null,
        validity_end_date: form.validity_end_date || null,
        delivery_deadline: form.delivery_deadline || null,
        notes: form.notes || null
      }
      
      let result
      
      if (editingItem) {
        result = await updateObligation(editingItem.id, formData)
        setItems(items.map(item => item.id === editingItem.id ? result : item))
        setEditingItem(null)
        alert('Obrigação atualizada com sucesso!')
      } else {
        result = await createObligation(formData)
        setItems([result, ...items])
        alert('Obrigação cadastrada com sucesso!')
      }
      
      // Limpar o formulário após sucesso
      setForm({
        company_id:'',
        state_id:'',
        obligation_type_id:'',
        obligation_name:'',
        competence:'',
        due_date:'',
        delivery_deadline:'',
        responsible_user_id:'',
        validity_start_date:'',
        validity_end_date:'',
        notes:''
      })
    } catch (error) {
      console.error('Erro ao salvar obrigação:', error)
      alert('Erro ao salvar obrigação: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)
    
    try {
      const result = await uploadObligationsBulk(formData)
      setUploadResult(result)
      if (result.created > 0) {
        fetchData() // Recarregar dados
      }
    } catch (error) {
      setUploadResult({ error: 'Erro ao fazer upload: ' + error.message })
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setForm({
      company_id: item.company?.id || '',
      state_id: item.state?.id || '',
      obligation_type_id: item.obligation_type?.id || '',
      obligation_name: item.obligation_name || '',
      competence: item.competence || '',
      due_date: item.due_date || '',
      delivery_deadline: item.delivery_deadline || '',
      responsible_user_id: item.responsible_user?.id || '',
      validity_start_date: item.validity_start_date || '',
      validity_end_date: item.validity_end_date || '',
      notes: item.notes || ''
    })
    setExpandedSections(prev => ({ ...prev, cadastro: true }))
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    
    try {
      setLoading(true)
      await deleteObligation(itemToDelete.id)
      setItems(items.filter(item => item.id !== itemToDelete.id))
      setShowDeleteModal(false)
      setItemToDelete(null)
      alert('Obrigação excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir obrigação:', error)
      alert('Erro ao excluir obrigação: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Funções para modal de recorrência
  const handleRecurrencePreview = async () => {
    if (!recurrenceForm.company_id || !recurrenceForm.state_code || !recurrenceForm.obligation_type_id) {
      alert('Preencha empresa, estado e tipo de obrigação')
      return
    }

    setRecurrenceLoading(true)
    try {
      const response = await fetch('/api/obligations/recurrence/preview/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(recurrenceForm)
      })

      if (response.ok) {
        const result = await response.json()
        setRecurrencePreview(result)
      } else {
        const error = await response.json()
        alert(`Erro no preview: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro no preview:', error)
      alert('Erro ao fazer preview')
    } finally {
      setRecurrenceLoading(false)
    }
  }

  const handleRecurrenceGenerate = async () => {
    if (!recurrenceForm.company_id || !recurrenceForm.state_code || !recurrenceForm.obligation_type_id) {
      alert('Preencha empresa, estado e tipo de obrigação')
      return
    }

    setRecurrenceLoading(true)
    try {
      const response = await fetch('/api/obligations/recurrence/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(recurrenceForm)
      })

      if (response.ok) {
        const result = await response.json()
        setRecurrenceResult(result)
        
        // Atualizar lista de obrigações
        await fetchData()
        
        alert(`Geração concluída! ${result.summary.created_count} criadas, ${result.summary.skipped_count} ignoradas`)
      } else {
        const error = await response.json()
        alert(`Erro na geração: ${error.error}`)
      }
    } catch (error) {
      console.error('Erro na geração:', error)
      alert('Erro ao gerar obrigações')
    } finally {
      setRecurrenceLoading(false)
    }
  }

  const handleRecurrenceModalClose = () => {
    setShowRecurrenceModal(false)
    setRecurrencePreview(null)
    setRecurrenceResult(null)
    setRecurrenceForm({
      company_id: '',
      state_code: '',
      obligation_type_id: '',
      count: 3,
      start_competence: '',
      start_due_date: '',
      start_delivery_deadline: ''
    })
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} obrigação(ões)?`)) {
      return
    }
    
    try {
      setLoading(true)
      await Promise.all(selectedItems.map(id => deleteObligation(id)))
      setItems(items.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      setSelectAll(false)
      alert(`${selectedItems.length} obrigação(ões) excluída(s) com sucesso!`)
    } catch (error) {
      console.error('Erro ao excluir obrigações:', error)
      alert('Erro ao excluir obrigações: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([])
      setSelectAll(false)
    } else {
      setSelectedItems(filteredItems.map(item => item.id))
      setSelectAll(true)
    }
  }

  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
      setSelectAll(false)
    } else {
      setSelectedItems([...selectedItems, itemId])
      if (selectedItems.length + 1 === filteredItems.length) {
        setSelectAll(true)
      }
    }
  }

  const handleDownloadTemplate = async (type) => {
    try {
      const blob = await downloadTemplate(type)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template_${type}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Erro ao baixar template: ' + error.message)
    }
  }

  const resetForm = () => {
    setForm({
      company_id:'',
      state_id:'',
      obligation_type_id:'',
      obligation_name:'',
      competence:'',
      due_date:'',
      delivery_deadline:'',
      responsible_user_id:'',
      validity_start_date:'',
      validity_end_date:'',
      notes:''
    })
    setEditingItem(null)
  }

  const sections = [
    {
      id: 'cadastro',
      title: 'Cadastrar Nova Obrigação',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'upload',
      title: 'Upload em Massa',
      icon: Upload,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'lista',
      title: 'Lista de Obrigações',
      icon: List,
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ]

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Obrigações Acessórias</h1>
              <p className="text-gray-600">Gerencie as obrigações acessórias da sua empresa</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Carregando...
                  </>
                ) : (
                  <>
                    🔄 Recarregar Dados
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowRecurrenceModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Gerar Recorrências
              </button>
            </div>
          </div>
        </div>

        {/* Seções com Dropdown */}
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            {/* Header da Seção */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${section.color} text-white`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                {section.id === 'lista' && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                    {filteredItems.length} obrigação(ões)
                  </span>
                )}
              </div>
              {expandedSections[section.id] ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {/* Conteúdo da Seção */}
            {expandedSections[section.id] && (
              <div className="px-6 pb-6 border-t border-gray-200">
                {/* Cadastrar Nova Obrigação */}
                {section.id === 'cadastro' && (
                  <div className="pt-6">
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Empresa *</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          value={form.company_id} 
                          onChange={e=>setForm({...form, company_id:e.target.value})}
                          required
                        >
                          <option value="">Selecione uma empresa</option>
                          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Estado *</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          value={form.state_id} 
                          onChange={e=>setForm({...form, state_id:e.target.value})}
                          required
                        >
                          <option value="">Selecione um estado</option>
                          {states.map(s=><option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Obrigação *</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          value={form.obligation_type_id} 
                          onChange={e=>setForm({...form, obligation_type_id:e.target.value})}
                          required
                        >
                          <option value="">Selecione um tipo</option>
                          {types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nome da Obrigação Acessória *</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="Ex: SPED, RAIS, DIRF..." 
                          value={form.obligation_name} 
                          onChange={e=>setForm({...form, obligation_name:e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Competência *</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="MM/AAAA" 
                          value={form.competence} 
                          onChange={e=>setForm({...form, competence:e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data de Vencimento *</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          type="date" 
                          value={form.due_date} 
                          onChange={e=>setForm({...form, due_date:e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Prazo de Entrega</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          type="date" 
                          value={form.delivery_deadline} 
                          onChange={e=>setForm({...form, delivery_deadline:e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Usuário Responsável</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          value={form.responsible_user_id} 
                          onChange={e=>setForm({...form, responsible_user_id:e.target.value})}
                        >
                          <option value="">Selecione um usuário</option>
                          {users.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Inicial de Validade</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          type="date" 
                          value={form.validity_start_date} 
                          onChange={e=>setForm({...form, validity_start_date:e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Final de Validade</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          type="date" 
                          value={form.validity_end_date} 
                          onChange={e=>setForm({...form, validity_end_date:e.target.value})}
                        />
                      </div>
                      
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                        <textarea 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="Observações adicionais" 
                          value={form.notes} 
                          onChange={e=>setForm({...form, notes:e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="md:col-span-3 flex gap-3">
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {loading ? 'Salvando...' : (editingItem ? 'Atualizar Obrigação' : 'Adicionar Obrigação')}
                        </button>
                        {editingItem && (
                          <button 
                            type="button"
                            onClick={resetForm}
                            className="px-6 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {/* Upload em Massa */}
                {section.id === 'upload' && (
                  <div className="pt-6">
                    <div className="flex space-x-4 mb-6">
                      <button 
                        onClick={() => handleDownloadTemplate('obligations')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        📥 Baixar Template de Obrigações
                      </button>
                    </div>
                    
                    <form onSubmit={handleBulkUpload} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Arquivo Excel</label>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={!uploadFile || uploading}
                        className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {uploading ? 'Enviando...' : 'Fazer Upload'}
                      </button>
                    </form>
                    
                    {uploadResult && (
                      <div className={`mt-4 p-4 rounded-lg ${uploadResult.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {uploadResult.error ? (
                          <p>{uploadResult.error}</p>
                        ) : (
                          <div>
                            <p>✅ Upload concluído!</p>
                            <p>📊 {uploadResult.created} obrigações criadas</p>
                            <p>📋 {uploadResult.total_processed} linhas processadas</p>
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                              <div className="mt-2">
                                <p className="font-semibold">⚠️ Erros encontrados:</p>
                                <ul className="list-disc list-inside">
                                  {uploadResult.errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Obrigações */}
                {section.id === 'lista' && (
                  <div className="pt-6">
                    {/* Filtros */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Buscar</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Nome, tipo ou empresa..."
                              value={filters.search}
                              onChange={e => setFilters({...filters, search: e.target.value})}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Empresa</label>
                          <select
                            value={filters.company}
                            onChange={e => setFilters({...filters, company: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Todas as empresas</option>
                            {companies.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
                          <select
                            value={filters.type}
                            onChange={e => setFilters({...filters, type: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Todos os tipos</option>
                            {types.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-end gap-2">
                          {selectedItems.length > 0 && (
                            <button
                              onClick={handleBulkDelete}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir ({selectedItems.length})
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-600 w-12">
                              <button
                                onClick={handleSelectAll}
                                className="flex items-center justify-center w-full"
                              >
                                {selectAll ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </th>
                            <th className="text-left p-3 font-medium text-gray-600">Empresa</th>
                            <th className="text-left p-3 font-medium text-gray-600">Estado</th>
                            <th className="text-left p-3 font-medium text-gray-600">Obrigação</th>
                            <th className="text-left p-3 font-medium text-gray-600">Competência</th>
                            <th className="text-left p-3 font-medium text-gray-600">Vencimento</th>
                            <th className="text-left p-3 font-medium text-gray-600">Prazo</th>
                            <th className="text-left p-3 font-medium text-gray-600">Responsável</th>
                            <th className="text-left p-3 font-medium text-gray-600">Validade</th>
                            <th className="text-left p-3 font-medium text-gray-600">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map(o => (
                            <tr key={o.id} className="border-t hover:bg-gray-50">
                              <td className="p-3">
                                <button
                                  onClick={() => handleSelectItem(o.id)}
                                  className="flex items-center justify-center w-full"
                                >
                                  {selectedItems.includes(o.id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{o.company?.name}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {o.state?.code}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{o.obligation_name || 'Obrigação não nomeada'}</div>
                                <div className="text-xs text-gray-500">
                                  {o.obligation_type?.name === 'Federal' && '🏛️ Federal'}
                                  {o.obligation_type?.name === 'Estadual' && '🏛️ Estadual'}
                                  {o.obligation_type?.name === 'Municipal' && '🏛️ Municipal'}
                                  {o.obligation_type?.name === 'Regimes Especiais' && '⚖️ Regimes Especiais'}
                                  {!['Federal', 'Estadual', 'Municipal', 'Regimes Especiais'].includes(o.obligation_type?.name) && o.obligation_type?.name}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                  {o.competence}
                                </span>
                              </td>
                              <td className="p-3">
                                {o.due_date ? (
                                  <div className="flex flex-col">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      new Date(o.due_date) < new Date() 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {new Date(o.due_date).toLocaleDateString('pt-BR')}
                                    </span>
                                    {o.due_date && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        {Math.ceil((new Date(o.due_date) - new Date()) / (1000 * 60 * 60 * 24))} dias
                                      </span>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="p-3">
                                {o.delivery_deadline ? (
                                  <div className="flex flex-col">
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      {new Date(o.delivery_deadline).toLocaleDateString('pt-BR')}
                                    </span>
                                    {o.delivery_deadline && o.due_date && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        {Math.ceil((new Date(o.delivery_deadline) - new Date(o.due_date)) / (1000 * 60 * 60 * 24))} dias após vencimento
                                      </span>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="p-3">{o.responsible_user?.username || '-'}</td>
                              <td className="p-3">
                                <div className="text-xs">
                                  <div>Início: {o.validity_start_date ? new Date(o.validity_start_date).toLocaleDateString('pt-BR') : '-'}</div>
                                  <div>Fim: {o.validity_end_date ? new Date(o.validity_end_date).toLocaleDateString('pt-BR') : '-'}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(o)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setItemToDelete(o)
                                      setShowDeleteModal(true)
                                    }}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">Nenhuma obrigação encontrada</p>
                          <p className="text-gray-400 text-sm">Tente ajustar os filtros ou cadastre uma nova obrigação</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 rounded-full p-2">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
                    <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4">
                  Tem certeza que deseja excluir a obrigação <strong>{itemToDelete.obligation_name || itemToDelete.obligation_type?.name}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Empresa: {itemToDelete.company?.name} | Competência: {itemToDelete.competence}
                </p>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setItemToDelete(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Recorrência */}
        {showRecurrenceModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Gerar Recorrências de Obrigações
                  </h3>
                  <button
                    onClick={handleRecurrenceModalClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Formulário */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Empresa *
                      </label>
                      <select
                        value={recurrenceForm.company_id}
                        onChange={(e) => setRecurrenceForm({ ...recurrenceForm, company_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione uma empresa</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado *
                      </label>
                      <select
                        value={recurrenceForm.state_code}
                        onChange={(e) => setRecurrenceForm({ ...recurrenceForm, state_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um estado</option>
                        {states.map(state => (
                          <option key={state.id} value={state.code}>{state.code} - {state.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Obrigação *
                      </label>
                      <select
                        value={recurrenceForm.obligation_type_id}
                        onChange={(e) => setRecurrenceForm({ ...recurrenceForm, obligation_type_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um tipo</option>
                        {types.map(type => (
                          <option key={type.id} value={type.id}>{type.name} - {type.recurrence}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade de Obrigações
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={recurrenceForm.count}
                        onChange={(e) => setRecurrenceForm({ ...recurrenceForm, count: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Campos opcionais para início manual */}
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Parâmetros Iniciais (apenas se não houver base existente)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Competência Inicial
                        </label>
                        <input
                          type="text"
                          placeholder="mm/aaaa"
                          value={recurrenceForm.start_competence}
                          onChange={(e) => setRecurrenceForm({ ...recurrenceForm, start_competence: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Vencimento Inicial
                        </label>
                        <input
                          type="date"
                          value={recurrenceForm.start_due_date}
                          onChange={(e) => setRecurrenceForm({ ...recurrenceForm, start_due_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prazo de Entrega Inicial
                        </label>
                        <input
                          type="date"
                          value={recurrenceForm.start_delivery_deadline}
                          onChange={(e) => setRecurrenceForm({ ...recurrenceForm, start_delivery_deadline: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleRecurrencePreview}
                      disabled={recurrenceLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {recurrenceLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Carregando...
                        </>
                      ) : (
                        <>
                          👁️ Preview
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleRecurrenceGenerate}
                      disabled={recurrenceLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {recurrenceLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Gerando...
                        </>
                      ) : (
                        <>
                          ⚡ Gerar
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleRecurrenceModalClose}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Preview */}
                  {recurrencePreview && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Preview das Obrigações
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Base usada:</strong> {recurrencePreview.base_used.type === 'existing' 
                            ? `Obrigação existente ${recurrencePreview.base_used.competence} (${recurrencePreview.base_used.due_date})`
                            : `Manual ${recurrencePreview.base_used.competence} (${recurrencePreview.base_used.due_date})`
                          }
                        </p>
                        <div className="space-y-1">
                          {recurrencePreview.proposed.map((prop, index) => (
                            <div key={index} className={`text-sm p-2 rounded ${prop.would_conflict ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {prop.competence} - Vencimento: {prop.due_date} 
                              {prop.delivery_deadline && ` - Prazo: ${prop.delivery_deadline}`}
                              {prop.would_conflict && ` (${prop.conflict_reason})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultado */}
                  {recurrenceResult && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Resultado da Geração
                      </h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ {recurrenceResult.summary.created_count} obrigações criadas
                        </p>
                        {recurrenceResult.summary.skipped_count > 0 && (
                          <p className="text-sm text-yellow-700">
                            ⚠️ {recurrenceResult.summary.skipped_count} obrigações ignoradas (já existiam)
                          </p>
                        )}
                        {recurrenceResult.last_created && (
                          <p className="text-sm text-gray-600">
                            Última criada: {recurrenceResult.last_created.competence} - {recurrenceResult.last_created.due_date}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}