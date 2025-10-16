import React, { useEffect, useState } from 'react'
import { getCompanies, getUsers, getDispatches, createDispatch, updateDispatch, deleteDispatch, getDispatchSubtasks, createDispatchSubtask, updateDispatchSubtask, deleteDispatchSubtask } from '../api'
import Layout from '../components/Layout'
import { ChevronDown, ChevronUp, Edit3, Trash2, Filter, Search, CheckSquare, Square, AlertTriangle, Plus, Upload, List } from 'lucide-react'

export default function Dispatches(){
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Estados para dropdowns
  const [expandedSections, setExpandedSections] = useState({
    cadastro: false,
    lista: false
  })
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    category: '',
    responsible: '',
    status: ''
  })
  
  // Estados para seleção múltipla
  const [selectedItems, setSelectedItems] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  
  // Estados para edição
  const [editingItem, setEditingItem] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  
  // Estados para subatividades
  const [expandedDispatches, setExpandedDispatches] = useState({})
  const [subtasks, setSubtasks] = useState({})
  const [showSubtaskModal, setShowSubtaskModal] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [currentDispatchId, setCurrentDispatchId] = useState(null)
  
  // Formulário
  const [form, setForm] = useState({ 
    company_id:'', 
    category:'', 
    title:'',
    responsible_id:'',
    start_date:'', 
    end_date:''
  })
  
  // Formulário de subatividade
  const [subtaskForm, setSubtaskForm] = useState({
    name: '',
    status: 'NAO_INICIADO'
  })

  // Opções para categorias
  const categoryOptions = [
    { value: 'NOTIFICACAO_FISCAL', label: 'Notificação Fiscal' },
    { value: 'FISCALIZACAO', label: 'Fiscalização' },
    { value: 'DESPACHO_DECISORIO', label: 'Despacho Decisório' }
  ]

  // Opções para status
  const statusOptions = [
    { value: 'NAO_INICIADO', label: 'Não Iniciado' },
    { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
    { value: 'CONCLUIDO', label: 'Concluído' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Carregando dados...')
      
      // Carregar dados em paralelo
      const [companiesData, usersData] = await Promise.all([
        getCompanies().catch(err => {
          console.error('Erro ao carregar empresas:', err)
          return []
        }),
        getUsers().catch(err => {
          console.error('Erro ao carregar usuários:', err)
          return []
        })
      ])
      
      setCompanies(companiesData || [])
      setUsers(usersData || [])
      
      // Carregar despachos
      console.log('🔄 Carregando despachos com filtros:', filters)
      const dispatchesData = await getDispatches(filters).catch(err => {
        console.error('Erro ao carregar despachos:', err)
        return []
      })
      
      console.log('📊 Dados carregados:', {
        empresas: companiesData.length,
        usuários: usersData.length,
        despachos: (dispatchesData || []).length
      })
      
      setItems(dispatchesData || [])
      setFilteredItems(dispatchesData || [])
      
      // Pré-carregar subatividades que vêm junto com os despachos
      const subtasksFromDispatches = {}
      dispatchesData.forEach(dispatch => {
        if (dispatch.subtasks && dispatch.subtasks.length > 0) {
          subtasksFromDispatches[dispatch.id] = dispatch.subtasks
        }
      })
      setSubtasks(prev => ({ ...prev, ...subtasksFromDispatches }))
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error)
      alert('Erro ao carregar dados. Verifique o console para mais detalhes.')
    } finally {
      setLoading(false)
    }
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
    if (!form.category) {
      alert('Por favor, selecione uma categoria')
      return
    }
    if (!form.start_date) {
      alert('Por favor, informe a data inicial')
      return
    }
    if (!form.end_date) {
      alert('Por favor, informe a data final')
      return
    }
    
    try {
      setLoading(true)
      
      // Preparar dados para envio
      const formData = {
        ...form,
        responsible_id: form.responsible_id || null,
        title: form.title || null
      }
      
      let newDispatch
      if (editingItem) {
        // Atualizar despacho existente
        newDispatch = await updateDispatch(editingItem.id, formData)
        // Atualizar item na lista
        setItems(items.map(item => item.id === editingItem.id ? newDispatch : item))
        setFilteredItems(filteredItems.map(item => item.id === editingItem.id ? newDispatch : item))
        alert('Despacho atualizado com sucesso!')
      } else {
        // Criar novo despacho
        newDispatch = await createDispatch(formData)
        // Adicionar à lista
        setItems([newDispatch, ...items])
        setFilteredItems([newDispatch, ...filteredItems])
        alert('Despacho criado com sucesso!')
      }
      
      // Limpar o formulário após sucesso
      setForm({
        company_id:'',
        category:'',
        title:'',
        responsible_id:'',
        start_date:'',
        end_date:''
      })
    } catch (error) {
      console.error('Erro ao salvar despacho:', error)
      alert('Erro ao salvar despacho: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setForm({
      company_id: item.company?.id || '',
      category: item.category || '',
      title: item.title || '',
      responsible_id: item.responsible?.id || '',
      start_date: item.start_date || '',
      end_date: item.end_date || ''
    })
    setExpandedSections(prev => ({ ...prev, cadastro: true }))
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    
    try {
      setLoading(true)
      await deleteDispatch(itemToDelete.id)
      // Remover da lista
      setItems(items.filter(item => item.id !== itemToDelete.id))
      alert('Despacho excluído com sucesso!')
      
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir despacho:', error)
      alert('Erro ao excluir despacho: ' + error.message)
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

  const resetForm = () => {
    setForm({
      company_id:'',
      category:'',
      title:'',
      responsible_id:'',
      start_date:'',
      end_date:''
    })
    setEditingItem(null)
  }

  const resetSubtaskForm = () => {
    setSubtaskForm({
      name: '',
      status: 'NAO_INICIADO'
    })
    setEditingSubtask(null)
  }

  const toggleDispatchExpansion = (dispatchId) => {
    setExpandedDispatches(prev => ({
      ...prev,
      [dispatchId]: !prev[dispatchId]
    }))
    
    // Carregar subatividades se não foram carregadas ainda
    if (!subtasks[dispatchId]) {
      // Verificar se as subatividades já estão nos dados do despacho
      const dispatch = items.find(item => item.id === dispatchId)
      if (dispatch && dispatch.subtasks) {
        setSubtasks(prev => ({
          ...prev,
          [dispatchId]: dispatch.subtasks
        }))
      } else {
        loadSubtasks(dispatchId)
      }
    }
  }

  const loadSubtasks = async (dispatchId) => {
    try {
      console.log('🔄 Carregando subatividades para dispatch:', dispatchId)
      const subtasksData = await getDispatchSubtasks(dispatchId)
      console.log('📊 Subatividades carregadas:', subtasksData)
      
      setSubtasks(prev => ({
        ...prev,
        [dispatchId]: subtasksData
      }))
    } catch (error) {
      console.error('❌ Erro ao carregar subatividades:', error)
    }
  }

  const handleSubtaskSubmit = async (e) => {
    e.preventDefault()
    
    if (!subtaskForm.name.trim()) {
      alert('Por favor, informe o nome da subatividade')
      return
    }
    
    try {
      setLoading(true)
      
      if (editingSubtask) {
        // Atualizar subatividade existente
        const updatedSubtask = await updateDispatchSubtask(currentDispatchId, editingSubtask.id, subtaskForm)
        alert('Subatividade atualizada com sucesso!')
        
        // Atualizar subatividade na lista local
        setSubtasks(prev => ({
          ...prev,
          [currentDispatchId]: prev[currentDispatchId]?.map(subtask => 
            subtask.id === editingSubtask.id ? updatedSubtask : subtask
          ) || []
        }))
      } else {
        // Criar nova subatividade
        const newSubtask = await createDispatchSubtask(currentDispatchId, subtaskForm)
        alert('Subatividade criada com sucesso!')
        
        // Adicionar subatividade à lista local
        setSubtasks(prev => ({
          ...prev,
          [currentDispatchId]: [...(prev[currentDispatchId] || []), newSubtask]
        }))
      }
      
      // Recarregar subatividades e despachos para atualizar progresso
      console.log('🔄 Recarregando subatividades após criação/edição')
      await loadSubtasks(currentDispatchId)
      console.log('🔄 Recarregando dados dos despachos')
      await fetchData()
      
      // Fechar modal e limpar formulário
      setShowSubtaskModal(false)
      resetSubtaskForm()
      
    } catch (error) {
      console.error('Erro ao salvar subatividade:', error)
      alert('Erro ao salvar subatividade: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubtaskEdit = (dispatchId, subtask) => {
    setCurrentDispatchId(dispatchId)
    setEditingSubtask(subtask)
    setSubtaskForm({
      name: subtask.name,
      status: subtask.status
    })
    setShowSubtaskModal(true)
  }

  const handleSubtaskDelete = async (dispatchId, subtaskId) => {
    if (!confirm('Tem certeza que deseja excluir esta subatividade?')) {
      return
    }
    
    try {
      setLoading(true)
      await deleteDispatchSubtask(dispatchId, subtaskId)
      alert('Subatividade excluída com sucesso!')
      
      // Remover subatividade da lista local
      setSubtasks(prev => ({
        ...prev,
        [dispatchId]: prev[dispatchId]?.filter(subtask => subtask.id !== subtaskId) || []
      }))
      
      // Recarregar despachos para atualizar progresso
      await fetchData()
      
    } catch (error) {
      console.error('Erro ao excluir subatividade:', error)
      alert('Erro ao excluir subatividade: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubtaskStatusChange = async (dispatchId, subtaskId, newStatus) => {
    try {
      setLoading(true)
      
      // Atualizar status localmente primeiro para feedback imediato
      setSubtasks(prev => ({
        ...prev,
        [dispatchId]: prev[dispatchId]?.map(subtask => 
          subtask.id === subtaskId ? { ...subtask, status: newStatus } : subtask
        ) || []
      }))
      
      await updateDispatchSubtask(dispatchId, subtaskId, { status: newStatus })
      
      // Recarregar despachos para atualizar progresso
      await fetchData()
      
    } catch (error) {
      console.error('Erro ao atualizar status da subatividade:', error)
      alert('Erro ao atualizar status: ' + error.message)
      
      // Reverter mudança local em caso de erro
      await loadSubtasks(dispatchId)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category)
    return option ? option.label : category
  }

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.label : status
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONCLUIDO': return 'bg-green-100 text-green-800'
      case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800'
      case 'NAO_INICIADO': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const sections = [
    {
      id: 'cadastro',
      title: 'Criar Nova Atividade',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'lista',
      title: 'Lista de Atividades',
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Despacho</h1>
              <p className="text-gray-600">Gerencie atividades de notificação fiscal, fiscalização e despacho decisório</p>
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
                    {filteredItems.length} atividade(s)
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
                {/* Criar Nova Atividade */}
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
                        <label className="block text-sm font-medium text-gray-600 mb-1">Categoria *</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          value={form.category} 
                          onChange={e=>setForm({...form, category:e.target.value})}
                          required
                        >
                          <option value="">Selecione uma categoria</option>
                          {categoryOptions.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Responsável</label>
                        <select 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          value={form.responsible_id} 
                          onChange={e=>setForm({...form, responsible_id:e.target.value})}
                        >
                          <option value="">Selecione um responsável</option>
                          {users.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                      </div>
                      
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="Título da atividade (opcional)" 
                          value={form.title} 
                          onChange={e=>setForm({...form, title:e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Inicial *</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          type="date" 
                          value={form.start_date} 
                          onChange={e=>setForm({...form, start_date:e.target.value})}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Data Final *</label>
                        <input 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          type="date" 
                          value={form.end_date} 
                          onChange={e=>setForm({...form, end_date:e.target.value})}
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-3 flex gap-3">
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {loading ? 'Salvando...' : (editingItem ? 'Atualizar Atividade' : 'Criar Atividade')}
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

                {/* Lista de Atividades */}
                {section.id === 'lista' && (
                  <div className="pt-6">
                    {/* Filtros */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Buscar</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Título, categoria ou empresa..."
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
                          <label className="block text-sm font-medium text-gray-600 mb-1">Categoria</label>
                          <select
                            value={filters.category}
                            onChange={e => setFilters({...filters, category: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Todas as categorias</option>
                            {categoryOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Responsável</label>
                          <select
                            value={filters.responsible}
                            onChange={e => setFilters({...filters, responsible: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Todos os responsáveis</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                          <select
                            value={filters.status}
                            onChange={e => setFilters({...filters, status: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Todos os status</option>
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
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
                            <th className="text-left p-3 font-medium text-gray-600">Categoria</th>
                            <th className="text-left p-3 font-medium text-gray-600">Título</th>
                            <th className="text-left p-3 font-medium text-gray-600">Responsável</th>
                            <th className="text-left p-3 font-medium text-gray-600">Período</th>
                            <th className="text-left p-3 font-medium text-gray-600">Progresso</th>
                            <th className="text-left p-3 font-medium text-gray-600">Status</th>
                            <th className="text-left p-3 font-medium text-gray-600">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map(item => (
                            <React.Fragment key={item.id}>
                              {/* Linha principal do despacho */}
                              <tr className="border-t hover:bg-gray-50">
                                <td className="p-3">
                                  <button
                                    onClick={() => handleSelectItem(item.id)}
                                    className="flex items-center justify-center w-full"
                                  >
                                    {selectedItems.includes(item.id) ? (
                                      <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleDispatchExpansion(item.id)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      {expandedDispatches[item.id] ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                    <div className="font-medium text-gray-900">{item.company?.name}</div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                    {getCategoryLabel(item.category)}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">{item.title || 'Sem título'}</div>
                                </td>
                                <td className="p-3">{item.responsible?.username || '-'}</td>
                                <td className="p-3">
                                  <div className="text-xs">
                                    <div>Início: {item.start_date ? new Date(item.start_date).toLocaleDateString('pt-BR') : '-'}</div>
                                    <div>Fim: {item.end_date ? new Date(item.end_date).toLocaleDateString('pt-BR') : '-'}</div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full" 
                                        style={{width: `${item.progress_pct || 0}%`}}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{item.progress_pct || 0}%</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {getStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Editar"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setItemToDelete(item)
                                        setShowDeleteModal(true)
                                      }}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCurrentDispatchId(item.id)
                                        resetSubtaskForm()
                                        setShowSubtaskModal(true)
                                      }}
                                      className="text-green-600 hover:text-green-800 p-1"
                                      title="Adicionar Subatividade"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Linha expandida com subatividades */}
                              {expandedDispatches[item.id] && (
                                <tr className="bg-gray-50">
                                  <td colSpan="9" className="p-4">
                                    <div className="bg-white rounded-lg border p-4">
                                      <h4 className="font-medium text-gray-900 mb-3">Subatividades</h4>
                                      
                                      {subtasks[item.id] && subtasks[item.id].length > 0 ? (
                                        <div className="space-y-2">
                                          {subtasks[item.id].map((subtask, index) => (
                                            <div key={subtask.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
                                              <div className="flex-1">
                                                <span className="font-medium">{index + 1}. {subtask.name}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <select
                                                  value={subtask.status}
                                                  onChange={(e) => handleSubtaskStatusChange(item.id, subtask.id, e.target.value)}
                                                  className="text-xs px-2 py-1 border rounded"
                                                >
                                                  <option value="NAO_INICIADO">Não Iniciado</option>
                                                  <option value="EM_ANDAMENTO">Em Andamento</option>
                                                  <option value="CONCLUIDO">Concluído</option>
                                                </select>
                                                <button
                                                  onClick={() => handleSubtaskEdit(item.id, subtask)}
                                                  className="text-blue-600 hover:text-blue-800 p-1"
                                                  title="Editar"
                                                >
                                                  <Edit3 className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() => handleSubtaskDelete(item.id, subtask.id)}
                                                  className="text-red-600 hover:text-red-800 p-1"
                                                  title="Excluir"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-gray-500">
                                          <p>Nenhuma subatividade encontrada</p>
                                          <p className="text-sm">Clique no botão "+" para adicionar uma subatividade</p>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                      
                      {filteredItems.length === 0 && (
                        <div className="text-center py-12">
                          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">Nenhuma atividade encontrada</p>
                          <p className="text-gray-400 text-sm">Tente ajustar os filtros ou crie uma nova atividade</p>
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
                  Tem certeza que deseja excluir a atividade <strong>{itemToDelete.title || getCategoryLabel(itemToDelete.category)}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Empresa: {itemToDelete.company?.name} | Categoria: {getCategoryLabel(itemToDelete.category)}
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

        {/* Modal de Subatividade */}
        {showSubtaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingSubtask ? 'Editar Subatividade' : 'Nova Subatividade'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {editingSubtask ? 'Atualize os dados da subatividade' : 'Adicione uma nova subatividade'}
                    </p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubtaskSubmit} className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nome da Subatividade *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o nome da subatividade"
                    value={subtaskForm.name}
                    onChange={e => setSubtaskForm({...subtaskForm, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={subtaskForm.status}
                    onChange={e => setSubtaskForm({...subtaskForm, status: e.target.value})}
                  >
                    <option value="NAO_INICIADO">Não Iniciado</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubtaskModal(false)
                      resetSubtaskForm()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Salvando...' : (editingSubtask ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
