import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { generateObligations, checkDueDates, checkOverdueObligations, sendEmailNotifications, getCompanies, getStates, getObligationTypes } from '../api'

export default function Planning() {
  const [companies, setCompanies] = useState([])
  const [states, setStates] = useState([])
  const [obligationTypes, setObligationTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState('generate')
  
  const [generateForm, setGenerateForm] = useState({
    monthsAhead: 3,
    companyId: '',
    obligationTypeId: '',
    obligationName: '',
    stateId: ''
  })
  
  const [checkForm, setCheckForm] = useState({
    daysAhead: 7
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [companiesData, statesData, typesData] = await Promise.all([
        getCompanies(),
        getStates(),
        getObligationTypes()
      ])
      setCompanies(companiesData)
      setStates(statesData)
      setObligationTypes(typesData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    }
  }

  const handleGenerateObligations = async (e) => {
    e.preventDefault()
    setLoading(true)
    console.log('Iniciando geração de obrigações:', generateForm)
    try {
      const result = await generateObligations(
        generateForm.monthsAhead,
        generateForm.companyId || null,
        generateForm.obligationTypeId || null,
        generateForm.obligationName || null,
        generateForm.stateId || null
      )
      console.log('Resultado da geração:', result)
      setResults({ type: 'generate', data: result })
    } catch (error) {
      console.error('Erro na geração:', error)
      setResults({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckDueDates = async (e) => {
    e.preventDefault()
    setLoading(true)
    console.log('Verificando vencimentos:', checkForm)
    try {
      const result = await checkDueDates(checkForm.daysAhead)
      console.log('Resultado da verificação de vencimentos:', result)
      setResults({ type: 'check_due', data: result })
    } catch (error) {
      console.error('Erro na verificação de vencimentos:', error)
      setResults({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOverdue = async () => {
    setLoading(true)
    console.log('Verificando atrasos...')
    try {
      const result = await checkOverdueObligations()
      console.log('Resultado da verificação de atrasos:', result)
      setResults({ type: 'check_overdue', data: result })
    } catch (error) {
      console.error('Erro na verificação de atrasos:', error)
      setResults({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmails = async () => {
    setLoading(true)
    console.log('Enviando emails...')
    try {
      const result = await sendEmailNotifications()
      console.log('Resultado do envio de emails:', result)
      setResults({ type: 'send_emails', data: result })
    } catch (error) {
      console.error('Erro no envio de emails:', error)
      setResults({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'generate', name: 'Gerar Obrigações', icon: '🔄' },
    { id: 'check', name: 'Verificar Vencimentos', icon: '⏰' },
    { id: 'overdue', name: 'Verificar Atrasos', icon: '🚨' },
    { id: 'emails', name: 'Enviar Emails', icon: '📧' }
  ]

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planejamento Automático</h1>
          <p className="text-gray-600">Gerencie a geração automática de obrigações e notificações do sistema</p>
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

        {/* Conteúdo das Abas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Gerar Obrigações */}
          {activeTab === 'generate' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerar Obrigações Automaticamente</h2>
              <p className="text-gray-600 mb-6">
                Gere obrigações automaticamente baseado nos tipos de obrigação cadastrados e suas recorrências.
              </p>
              
              <form onSubmit={handleGenerateObligations} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período de Geração (meses)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={generateForm.monthsAhead}
                      onChange={(e) => setGenerateForm({ ...generateForm, monthsAhead: parseInt(e.target.value) || 1 })}
                      placeholder="Digite a quantidade de meses"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Digite a quantidade de meses que deseja gerar (sem limite)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa Específica (opcional)
                    </label>
                    <select
                      value={generateForm.companyId}
                      onChange={(e) => setGenerateForm({ ...generateForm, companyId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas as empresas</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Obrigação (opcional)
                    </label>
                    <select
                      value={generateForm.obligationTypeId}
                      onChange={(e) => setGenerateForm({ ...generateForm, obligationTypeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos os tipos</option>
                      {obligationTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name} - {type.recurrence}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Obrigação (opcional)
                    </label>
                    <input
                      type="text"
                      value={generateForm.obligationName}
                      onChange={(e) => setGenerateForm({ ...generateForm, obligationName: e.target.value })}
                      placeholder="Ex: SPED FISCAL, EFD..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado (opcional)
                    </label>
                    <select
                      value={generateForm.stateId}
                      onChange={(e) => setGenerateForm({ ...generateForm, stateId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos os estados</option>
                      {states.map(state => (
                        <option key={state.id} value={state.id}>{state.code} - {state.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Como funciona</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>O sistema irá:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Usar filtros para gerar obrigações específicas</li>
                          <li>Considerar o último período existente para cada combinação</li>
                          <li>Calcular as datas de vencimento baseado na recorrência</li>
                          <li>Criar obrigações para os próximos meses</li>
                          <li>Evitar duplicatas (obrigações já existentes)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      Gerar Obrigações
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Verificar Vencimentos */}
          {activeTab === 'check' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verificar Vencimentos Próximos</h2>
              <p className="text-gray-600 mb-6">
                Crie notificações para obrigações que vencem nos próximos dias.
              </p>
              
              <form onSubmit={handleCheckDueDates} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verificar vencimentos em quantos dias?
                  </label>
                  <select
                    value={checkForm.daysAhead}
                    onChange={(e) => setCheckForm({ ...checkForm, daysAhead: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1 dia</option>
                    <option value={3}>3 dias</option>
                    <option value={7}>7 dias</option>
                    <option value={15}>15 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <span>⏰</span>
                      Verificar Vencimentos
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Verificar Atrasos */}
          {activeTab === 'overdue' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verificar Obrigações em Atraso</h2>
              <p className="text-gray-600 mb-6">
                Crie notificações urgentes para obrigações que já passaram da data de vencimento.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Atenção</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>Esta ação irá criar notificações urgentes para todas as obrigações em atraso. 
                      Use com cuidado para evitar spam de notificações.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCheckOverdue}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span>🚨</span>
                    Verificar Atrasos
                  </>
                )}
              </button>
            </div>
          )}

          {/* Enviar Emails */}
          {activeTab === 'emails' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Enviar Notificações por Email</h2>
              <p className="text-gray-600 mb-6">
                Envie emails para usuários que possuem notificações não lidas no sistema.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Informação</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Emails serão enviados apenas para usuários que:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Possuem notificações não lidas no sistema</li>
                        <li>Possuem email cadastrado no perfil</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSendEmails}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    Enviar Emails
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Resultados */}
        {results && (
          <div className="mt-6">
            {results.type === 'error' ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Erro na Operação</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p className="font-medium">{results.message}</p>
                      <p className="mt-2">Verifique os logs do sistema ou tente novamente mais tarde.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-green-800">Operação Concluída com Sucesso!</h3>
                    <div className="mt-3">
                      <p className="text-sm text-green-700 font-medium mb-3">{results.data.message}</p>
                      
                      {/* Estatísticas detalhadas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {results.data.generated !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 font-bold text-sm">+</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-xs font-medium text-green-800">Novas Obrigações</p>
                                <p className="text-lg font-bold text-green-900">{results.data.generated}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {results.data.skipped !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-yellow-200">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <span className="text-yellow-600 font-bold text-sm">-</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-xs font-medium text-yellow-800">Já Existentes</p>
                                <p className="text-lg font-bold text-yellow-900">{results.data.skipped}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {results.data.notifications_created !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">📢</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-xs font-medium text-blue-800">Notificações</p>
                                <p className="text-lg font-bold text-blue-900">{results.data.notifications_created}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {results.data.emails_sent !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 font-bold text-sm">📧</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-xs font-medium text-purple-800">Emails Enviados</p>
                                <p className="text-lg font-bold text-purple-900">{results.data.emails_sent}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Informações adicionais sobre a geração */}
                      {results.type === 'generate' && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Como funciona a geração:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• O sistema usa suas obrigações existentes como modelo para gerar as próximas</li>
                            <li>• Considera o último período existente para cada combinação filtrada</li>
                            <li>• Mantém exatamente os mesmos dias de vencimento e prazo de entrega</li>
                            <li>• Incrementa apenas os meses conforme a recorrência do tipo de obrigação</li>
                            <li>• O vencimento e prazo são sempre no mês seguinte à competência</li>
                            <li>• Exemplo: Competência 11/2025 → Vencimento 20/12/2025, Prazo 15/12/2025</li>
                            <li>• Você pode gerar quantas vezes quiser - sempre partirá do último período</li>
                            <li>• Obrigações já existentes para a mesma competência são ignoradas</li>
                          </ul>
                        </div>
                      )}
                      
                      {/* Botão para limpar resultados */}
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <button
                          onClick={() => setResults(null)}
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          Fechar resultado
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
