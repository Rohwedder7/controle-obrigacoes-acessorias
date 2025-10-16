import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getAdvancedReports, getUserPerformanceReport, getUsers, getCompanies, getStates } from '../api'

export default function AdvancedReports() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [userReport, setUserReport] = useState(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    user_id: '',
    company_id: '',
    state_id: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (filters.start_date || filters.end_date || filters.user_id || filters.company_id || filters.state_id) {
      fetchAdvancedReports()
    }
  }, [filters])

  const fetchInitialData = async () => {
    try {
      const [usersData, companiesData, statesData] = await Promise.all([
        getUsers(),
        getCompanies(),
        getStates()
      ])
      setUsers(usersData)
      setCompanies(companiesData)
      setStates(statesData)
    } catch (error) {
      console.error('Erro ao buscar dados iniciais:', error)
    }
  }

  const fetchAdvancedReports = async () => {
    setLoading(true)
    try {
      const data = await getAdvancedReports(filters)
      setReportData(data)
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserReport = async (userId) => {
    if (!userId) return
    
    setLoading(true)
    try {
      const data = await getUserPerformanceReport(userId)
      setUserReport(data)
    } catch (error) {
      console.error('Erro ao buscar relatório do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleUserChange = (userId) => {
    setSelectedUser(userId)
    fetchUserReport(userId)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    // Se a data já está no formato YYYY-MM-DD, converte diretamente sem problemas de timezone
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'users', name: 'Por Usuário', icon: '👥' },
    { id: 'companies', name: 'Por Empresa', icon: '🏢' },
    { id: 'states', name: 'Por Estado', icon: '🗺️' },
    { id: 'types', name: 'Por Tipo', icon: '📋' },
    { id: 'trends', name: 'Tendências', icon: '📈' }
  ]

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios Avançados</h1>
          <p className="text-gray-600">Análises detalhadas de performance e cumprimento de obrigações</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <select
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select
                value={filters.company_id}
                onChange={(e) => handleFilterChange('company_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>[{company.code}] {company.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filters.state_id}
                onChange={(e) => handleFilterChange('state_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>{state.code} - {state.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Visão Geral */}
            {activeTab === 'overview' && reportData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-2xl font-semibold text-gray-900">{reportData.summary.total_obligations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Entregues</p>
                      <p className="text-2xl font-semibold text-gray-900">{reportData.summary.delivered_obligations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-semibold text-gray-900">{reportData.summary.pending_obligations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                      <p className="text-2xl font-semibold text-gray-900">{reportData.summary.overdue_obligations}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 col-span-full">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Cumprimento</h3>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                      <div 
                        className="bg-green-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${reportData.summary.compliance_rate}%` }}
                      ></div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{formatPercentage(reportData.summary.compliance_rate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Por Usuário */}
            {activeTab === 'users' && reportData && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Performance por Usuário</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregues</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendentes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atrasadas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.by_user.map((user, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.responsible_user__username || 'Não definido'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.delivered}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.pending}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.overdue}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPercentage((user.delivered / user.total) * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Por Empresa */}
            {activeTab === 'companies' && reportData && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Performance por Empresa</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entregues</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendentes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atrasadas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.by_company.map((company, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {company.company__name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.delivered}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.pending}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{company.overdue}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPercentage((company.delivered / company.total) * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Relatório Individual de Usuário */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatório Individual</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Usuário</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                {userReport && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900">Total de Obrigações</h4>
                      <p className="text-2xl font-bold text-blue-600">{userReport.performance.total_obligations}</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900">Entregues</h4>
                      <p className="text-2xl font-bold text-green-600">{userReport.performance.delivered}</p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900">Pendentes</h4>
                      <p className="text-2xl font-bold text-orange-600">{userReport.performance.pending}</p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900">Atrasadas</h4>
                      <p className="text-2xl font-bold text-red-600">{userReport.performance.overdue}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
