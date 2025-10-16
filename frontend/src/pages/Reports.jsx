import React, { useState, useEffect } from 'react'
import API, { getCompanies, getObligationTypes, getDetailedReport, downloadReport } from '../api'
import Layout from '../components/Layout'

export default function Reports(){
  const [companies, setCompanies] = useState([])
  const [obligationTypes, setObligationTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)
  
  // Filtros avançados
  const [filters, setFilters] = useState({
    company_ids: [],
    obligation_type_ids: [],
    obligation_name: '',
    competence_start: '',
    competence_end: '',
    due_start: '',
    due_end: '',
    status: []
  })
  
  // Estados para debounce
  const [obligationNameDebounce, setObligationNameDebounce] = useState('')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  // Debounce para nome da obrigação
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, obligation_name: obligationNameDebounce }))
    }, 500)
    return () => clearTimeout(timer)
  }, [obligationNameDebounce])
  
  const fetchData = async () => {
    try {
      const [companiesData, typesData] = await Promise.all([
        getCompanies(),
        getObligationTypes()
      ])
      setCompanies(companiesData)
      setObligationTypes(typesData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setError('Erro ao carregar dados iniciais')
    }
  }
  
  const handleCompanyToggle = (companyId) => {
    setFilters(prev => ({
      ...prev,
      company_ids: prev.company_ids.includes(companyId)
        ? prev.company_ids.filter(id => id !== companyId)
        : [...prev.company_ids, companyId]
    }))
  }
  
  const handleObligationTypeToggle = (typeId) => {
    setFilters(prev => ({
      ...prev,
      obligation_type_ids: prev.obligation_type_ids.includes(typeId)
        ? prev.obligation_type_ids.filter(id => id !== typeId)
        : [...prev.obligation_type_ids, typeId]
    }))
  }
  
  const handleStatusToggle = (status) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }
  
  const selectAllCompanies = () => {
    setFilters(prev => ({ ...prev, company_ids: companies.map(c => c.id) }))
  }
  
  const clearAllCompanies = () => {
    setFilters(prev => ({ ...prev, company_ids: [] }))
  }
  
  const selectAllObligationTypes = () => {
    setFilters(prev => ({ ...prev, obligation_type_ids: obligationTypes.map(t => t.id) }))
  }
  
  const clearAllObligationTypes = () => {
    setFilters(prev => ({ ...prev, obligation_type_ids: [] }))
  }
  
  const clearAllFilters = () => {
    setFilters({
      company_ids: [],
      obligation_type_ids: [],
      obligation_name: '',
      competence_start: '',
      competence_end: '',
      due_start: '',
      due_end: '',
      status: []
    })
    setObligationNameDebounce('')
    setReportData(null)
  }
  
  const generateReport = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Converter array de status para string única (se apenas um selecionado)
      const filtersToSend = {
        ...filters,
        status: filters.status.length === 1 ? filters.status[0] : ''
      }
      
      const data = await getDetailedReport(filtersToSend)
      setReportData(data)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleExportCSV = async () => {
    try {
      const filtersToSend = {
        ...filters,
        status: filters.status.length === 1 ? filters.status[0] : ''
      }
      
      const filename = `relatorio_obrigacoes_${new Date().toISOString().split('T')[0]}.csv`
      await downloadReport('/reports/export.csv', filename, filtersToSend)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      setError(error.message)
    }
  }
  
  const handleExportExcel = async () => {
    try {
      const filtersToSend = {
        ...filters,
        status: filters.status.length === 1 ? filters.status[0] : ''
      }
      
      const filename = `relatorio_obrigacoes_${new Date().toISOString().split('T')[0]}.xlsx`
      await downloadReport('/reports/export.xlsx', filename, filtersToSend)
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      setError(error.message)
    }
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    // Se a data já estiver no formato DD/MM/AAAA, retorna direto
    if (dateString.includes('/')) {
      return dateString
    }
    
    // Se a data está no formato YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS, converte diretamente sem problemas de timezone
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('T')[0].split('-')
      return `${day}/${month}/${year}`
    }
    
    // Fallback: retorna string vazia
    return ''
  }
  
  const getStatusBadge = (status) => {
    const colors = {
      'entregue': 'bg-green-100 text-green-800',
      'pendente': 'bg-yellow-100 text-yellow-800',
      'atrasado': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }
  
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Relatórios Detalhados</h1>
        
        {/* Filtros Avançados */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Filtros Avançados</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Empresas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresas
                <div className="inline-flex ml-2 space-x-2">
                  <button
                    onClick={selectAllCompanies}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Todos
                  </button>
                  <button
                    onClick={clearAllCompanies}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Limpar
                  </button>
                </div>
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {companies.map(company => (
                  <label key={company.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.company_ids.includes(company.id)}
                      onChange={() => handleCompanyToggle(company.id)}
                      className="rounded"
                    />
                    <span>[{company.code}] {company.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Tipos de Obrigação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipos de Obrigação
                <div className="inline-flex ml-2 space-x-2">
                  <button
                    onClick={selectAllObligationTypes}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Todos
                  </button>
                  <button
                    onClick={clearAllObligationTypes}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Limpar
                  </button>
                </div>
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {obligationTypes.map(type => (
                  <label key={type.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.obligation_type_ids.includes(type.id)}
                      onChange={() => handleObligationTypeToggle(type.id)}
                      className="rounded"
                    />
                    <span>{type.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Nome da Obrigação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Obrigação
              </label>
              <input
                type="text"
                value={obligationNameDebounce}
                onChange={(e) => setObligationNameDebounce(e.target.value)}
                placeholder="Ex: SPED FISCAL, EFD..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Período de Competência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competência Início (MM/AAAA)
              </label>
              <input
                type="text"
                value={filters.competence_start}
                onChange={(e) => setFilters(prev => ({ ...prev, competence_start: e.target.value }))}
                placeholder="Ex: 01/2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competência Fim (MM/AAAA)
              </label>
              <input
                type="text"
                value={filters.competence_end}
                onChange={(e) => setFilters(prev => ({ ...prev, competence_end: e.target.value }))}
                placeholder="Ex: 12/2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {['pendente', 'atrasado', 'entregue'].map(status => (
                  <label key={status} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="rounded"
                    />
                    <span className="capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex space-x-4 mt-6">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Gerar Relatório</span>
                </>
              )}
            </button>
            
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
        
        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Relatório */}
        {reportData && (
          <div className="space-y-6">
            {/* Cards de Totais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Obrigações</p>
                    <p className="text-2xl font-bold text-gray-900">{reportData.totals.obligations}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Entregues</p>
                    <p className="text-2xl font-bold text-green-600">{reportData.totals.delivered}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{reportData.totals.pending}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Entregas Atrasadas</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.totals.late_deliveries || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Atrasadas (Pendente de Entrega)</p>
                    <p className="text-2xl font-bold text-gray-600">{reportData.totals.late}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botões de Exportação */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Exportações</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Excel
                </button>
              </div>
            </div>
            
            {/* Tabela de Dados */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700">Dados Detalhados</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.rows.length} registros encontrados
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competência</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregue em</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atraso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprovado por</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Aprovação</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anexos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.rows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.cnpj}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.obligation_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.obligation_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.competence}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(row.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(row.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.submission_info ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              row.submission_info.submission_type === 'original' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {row.submission_info.submission_type === 'original' ? 'Original' : 'Retificadora'}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.submission_info ? formatDate(row.submission_info.delivery_date) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.submission_info?.days_late > 0 ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              {row.submission_info.days_late} dias
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.submission_info?.approval_decision_by ? (
                            <div>
                              <div className="font-medium text-gray-900">
                                {row.submission_info.approval_decision_by.full_name || row.submission_info.approval_decision_by.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {row.submission_info.approval_decision_by.email}
                              </div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.submission_info?.approval_decision_at ? formatDate(row.submission_info.approval_decision_at) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row.total_attachments > 0 ? (
                            <div className="flex items-center space-x-1">
                              <span>{row.total_attachments}</span>
                              {row.submission_info?.has_receipt_file && (
                                <span className="text-green-600" title="Arquivo principal">📎</span>
                              )}
                              {row.submission_info?.attachments_count > 0 && (
                                <span className="text-blue-600" title="Anexos adicionais">📁</span>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}