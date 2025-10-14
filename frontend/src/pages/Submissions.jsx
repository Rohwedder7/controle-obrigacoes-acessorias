import React, { useEffect, useState } from 'react'
import { 
  getCompanies, getCompanyObligations, uploadSubmission, 
  downloadDeliveryTemplate, bulkDeliveries, bulkAttachments, getDeliveries
} from '../api'
import Layout from '../components/Layout'
import { ChevronDown, ChevronUp, Plus, Upload, List, RotateCcw, FileText, Download } from 'lucide-react'

// Função para formatar data sem problemas de timezone
function formatDateWithoutTimezone(dateString) {
  if (!dateString) return ''
  
  // Se a data já está no formato YYYY-MM-DD, converte diretamente
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

export default function Submissions() {
  // Estados gerais
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // Estados para dropdowns
  const [expandedSections, setExpandedSections] = useState({
    individual: false,
    bulk: false,
    lista: false
  })

  // Estados para modo individual
  const [selectedCompany, setSelectedCompany] = useState('')
  const [obligations, setObligations] = useState([])
  const [individualForm, setIndividualForm] = useState({
    obligation: '',
    delivery_date: '',
    submission_type: 'original',
    comments: '',
    file: null
  })

  // Estados para modo bulk
  const [bulkForm, setBulkForm] = useState({
    spreadsheet: null,
    attachments: []
  })
  const [bulkResults, setBulkResults] = useState(null)

  // Estados para lista de entregas
  const [deliveries, setDeliveries] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    status: ''
  })

  useEffect(() => {
    loadCompanies()
    loadDeliveries()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyObligations(selectedCompany)
    } else {
      setObligations([])
    }
  }, [selectedCompany])

  useEffect(() => {
    loadDeliveries()
  }, [filters])

  async function loadCompanies() {
    try {
      const data = await getCompanies()
      setCompanies(data)
    } catch (error) {
      showMessage('Erro ao carregar empresas: ' + error.message, 'error')
    }
  }

  async function loadCompanyObligations(companyId) {
    try {
      setLoading(true)
      const data = await getCompanyObligations(companyId)
      setObligations(data)
    } catch (error) {
      showMessage('Erro ao carregar obrigações: ' + error.message, 'error')
      setObligations([])
    } finally {
      setLoading(false)
    }
  }

  async function loadDeliveries() {
    try {
      setLoading(true)
      const data = await getDeliveries(filters)
      setDeliveries(data.deliveries || [])
    } catch (error) {
      showMessage('Erro ao carregar entregas: ' + error.message, 'error')
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }

  function showMessage(text, type = 'success') {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const handleObligationChange = (obligationId) => {
    // Encontrar a obrigação selecionada
    const selectedObligation = obligations.find(obligation => obligation.id == obligationId)
    
    // Atualizar o formulário
    setIndividualForm(prev => ({
      ...prev,
      obligation: obligationId,
      // Se a obrigação já tem submission, forçar tipo "retificadora"
      submission_type: selectedObligation?.has_submission ? 'retificadora' : 'original'
    }))
  }

  async function handleIndividualSubmit(e) {
    e.preventDefault()
    
    if (!individualForm.obligation || !individualForm.delivery_date) {
      showMessage('Preencha todos os campos obrigatórios', 'error')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('obligation', individualForm.obligation)
      formData.append('delivery_date', individualForm.delivery_date)
      formData.append('submission_type', individualForm.submission_type)
      formData.append('comments', individualForm.comments)
      if (individualForm.file) {
        formData.append('receipt_file', individualForm.file)
      }

      await uploadSubmission(formData)
      showMessage('Entrega registrada com sucesso!')
      
      // Limpar formulário
      setIndividualForm({
        obligation: '',
        delivery_date: '',
        submission_type: 'original',
        comments: '',
        file: null
      })
      
      // Recarregar dados
      loadDeliveries()
      if (selectedCompany) {
        loadCompanyObligations(selectedCompany)
      }
      
    } catch (error) {
      showMessage('Erro ao registrar entrega: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadTemplate() {
    try {
      await downloadDeliveryTemplate()
      showMessage('Template baixado com sucesso!')
    } catch (error) {
      showMessage('Erro ao baixar template: ' + error.message, 'error')
    }
  }

  async function handleBulkSubmit(e) {
    e.preventDefault()
    
    if (!bulkForm.spreadsheet) {
      showMessage('Selecione a planilha Excel', 'error')
      return
    }

    try {
      setLoading(true)
      
      // Processar planilha
      const spreadsheetResult = await bulkDeliveries(bulkForm.spreadsheet)
      
      // Processar anexos se houver
      let attachmentsResult = null
      if (bulkForm.attachments.length > 0) {
        attachmentsResult = await bulkAttachments(bulkForm.attachments)
      }
      
      setBulkResults({
        spreadsheet: spreadsheetResult,
        attachments: attachmentsResult
      })
      
      showMessage('Processamento em massa concluído!')
      
      // Limpar formulário
      setBulkForm({
        spreadsheet: null,
        attachments: []
      })
      
      // Recarregar dados
      loadDeliveries()
      
    } catch (error) {
      showMessage('Erro no processamento em massa: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(field, files) {
    if (field === 'attachments') {
      setBulkForm(prev => ({
        ...prev,
        attachments: Array.from(files)
      }))
    } else {
      setIndividualForm(prev => ({
        ...prev,
        file: files[0] || null
      }))
    }
  }

  const sections = [
    {
      id: 'individual',
      title: 'Entrega Individual',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'bulk',
      title: 'Entregas em Massa',
      icon: Upload,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'lista',
      title: 'Lista de Entregas',
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Entregas PRO</h1>
              <p className="text-gray-600">Gerencie as entregas de obrigações acessórias</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadDeliveries}
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

        {/* Mensagem de feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'error' 
              ? 'bg-red-100 border border-red-400 text-red-700' 
              : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            {message}
          </div>
        )}

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
                    {deliveries.length} entrega(s)
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
                {/* Entrega Individual */}
                {section.id === 'individual' && (
                  <div className="pt-6">
                    <form onSubmit={handleIndividualSubmit} className="space-y-4">
                      {/* Empresa */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Empresa *
                        </label>
                        <select
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Selecione a empresa</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>
                              {company.name} ({company.cnpj})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Obrigação */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Obrigação *
                        </label>
                        {loading ? (
                          <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100">
                            Carregando obrigações...
                          </div>
                        ) : (
                          <select
                            value={individualForm.obligation}
                            onChange={(e) => handleObligationChange(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            disabled={!selectedCompany}
                          >
                            <option value="">Selecione a obrigação</option>
                            {obligations.map(obligation => (
                              <option key={obligation.id} value={obligation.id}>
                                {obligation.label}
                                {obligation.has_submission && ' (JÁ ENTREGUE)'}
                              </option>
                            ))}
                          </select>
                        )}
                        {!selectedCompany && (
                          <p className="mt-1 text-sm text-gray-500">
                            Selecione uma empresa primeiro
                          </p>
                        )}
                        {selectedCompany && individualForm.obligation && (() => {
                          const selectedObligation = obligations.find(obligation => obligation.id == individualForm.obligation)
                          return selectedObligation?.has_submission && (
                            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>⚠️ Atenção:</strong> Esta obrigação já possui uma entrega. 
                                O tipo foi automaticamente alterado para "Retificadora".
                              </p>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Data da entrega */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data da Entrega *
                        </label>
                        <input
                          type="date"
                          value={individualForm.delivery_date}
                          onChange={(e) => setIndividualForm(prev => ({ ...prev, delivery_date: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Tipo da entrega */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo da Entrega
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="submission_type"
                              value="original"
                              checked={individualForm.submission_type === 'original'}
                              onChange={(e) => setIndividualForm(prev => ({ ...prev, submission_type: e.target.value }))}
                              className="mr-2"
                            />
                            Original
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="submission_type"
                              value="retificadora"
                              checked={individualForm.submission_type === 'retificadora'}
                              onChange={(e) => setIndividualForm(prev => ({ ...prev, submission_type: e.target.value }))}
                              className="mr-2"
                            />
                            Retificadora
                          </label>
                        </div>
                      </div>

                      {/* Anexo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Anexo (ZIP)
                        </label>
                        <input
                          type="file"
                          accept=".zip"
                          onChange={(e) => handleFileChange('file', e.target.files)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Arquivo ZIP com comprovantes e memórias de cálculo
                        </p>
                      </div>

                      {/* Comentários */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Comentários
                        </label>
                        <textarea
                          value={individualForm.comments}
                          onChange={(e) => setIndividualForm(prev => ({ ...prev, comments: e.target.value }))}
                          rows={3}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Observações sobre a entrega..."
                        />
                      </div>

                      {/* Botão de envio */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Salvando...' : 'Salvar Entrega'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Entregas em Massa */}
                {section.id === 'bulk' && (
                  <div className="pt-6 space-y-6">
                    {/* Instruções */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Instruções para Entregas em Massa
                      </h3>
                      <div className="text-sm text-gray-700 space-y-2">
                        <p><strong>1. Planilha Excel:</strong> Baixe o template, preencha com os dados das entregas e faça upload.</p>
                        <p><strong>2. Anexos:</strong> Nomeie os arquivos seguindo o padrão: <code>CNPJ_Periodo_NomeObrigacao.ext</code></p>
                        <p><strong>Exemplo:</strong> <code>12345678000190_082025_EFDContribuicoes.zip</code></p>
                        <p><strong>Formatos aceitos:</strong> ZIP, PDF, RAR</p>
                      </div>
                    </div>

                    {/* Template e Planilha */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        1. Planilha de Entregas
                      </h3>
                      
                      <div className="mb-4">
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Baixar Template Excel
                        </button>
                      </div>

                      <form onSubmit={handleBulkSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Planilha Excel (.xlsx) *
                          </label>
                          <input
                            type="file"
                            accept=".xlsx"
                            onChange={(e) => setBulkForm(prev => ({ ...prev, spreadsheet: e.target.files[0] }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Anexos (múltiplos arquivos)
                          </label>
                          <input
                            type="file"
                            multiple
                            accept=".zip,.pdf,.rar"
                            onChange={(e) => handleFileChange('attachments', e.target.files)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            {bulkForm.attachments.length} arquivo(s) selecionado(s)
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
                        >
                          {loading ? 'Processando...' : 'Processar Entregas em Massa'}
                        </button>
                      </form>
                    </div>

                    {/* Resultados */}
                    {bulkResults && (
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">Resultados do Processamento</h3>
                        
                        {/* Planilha */}
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Planilha:</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-green-100 p-2 rounded">
                              <strong>Criadas:</strong> {bulkResults.spreadsheet.created}
                            </div>
                            <div className="bg-blue-100 p-2 rounded">
                              <strong>Atualizadas:</strong> {bulkResults.spreadsheet.updated}
                            </div>
                            <div className="bg-yellow-100 p-2 rounded">
                              <strong>Puladas:</strong> {bulkResults.spreadsheet.skipped.length}
                            </div>
                            <div className="bg-gray-100 p-2 rounded">
                              <strong>Lote:</strong> {bulkResults.spreadsheet.batch_id}
                            </div>
                          </div>
                        </div>

                        {/* Anexos */}
                        {bulkResults.attachments && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Anexos:</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="bg-green-100 p-2 rounded">
                                <strong>Vinculados:</strong> {bulkResults.attachments.attachments_linked}
                              </div>
                              <div className="bg-yellow-100 p-2 rounded">
                                <strong>Pulados:</strong> {bulkResults.attachments.skipped.length}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detalhes dos erros */}
                        {(bulkResults.spreadsheet.skipped.length > 0 || 
                          (bulkResults.attachments && bulkResults.attachments.skipped.length > 0)) && (
                          <div>
                            <h4 className="font-medium mb-2">Detalhes dos Erros:</h4>
                            <div className="max-h-40 overflow-y-auto text-sm">
                              {bulkResults.spreadsheet.skipped.map((item, index) => (
                                <div key={index} className="text-red-600 mb-1">
                                  Linha {item.row}: {item.reason}
                                </div>
                              ))}
                              {bulkResults.attachments?.skipped.map((item, index) => (
                                <div key={index} className="text-red-600 mb-1">
                                  {item.filename}: {item.reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de Entregas */}
                {section.id === 'lista' && (
                  <div className="pt-6">
                    {/* Filtros */}
                    <div className="mb-6 grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          placeholder="Empresa, obrigação..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                        <select
                          value={filters.company}
                          onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Todas as empresas</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Todos os status</option>
                          <option value="original">Original</option>
                          <option value="retificadora">Retificadora</option>
                        </select>
                      </div>
                    </div>

                    {/* Tabela de Entregas */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obrigação</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competência</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Entrega</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anexos</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {deliveries.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                  Nenhuma entrega encontrada
                                </td>
                              </tr>
                            ) : (
                              deliveries.map((delivery, index) => (
                                <tr key={delivery.id || index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div>
                                      <div className="font-medium">{delivery.company}</div>
                                      <div className="text-gray-500 text-xs">{delivery.company_cnpj}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>
                                      <div className="font-medium">{delivery.obligation}</div>
                                      <div className="text-gray-400 text-xs">{delivery.state}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {delivery.competence}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div>
                                      <div className="font-medium">
                                        {formatDateWithoutTimezone(delivery.delivery_date)}
                                      </div>
                                      <div className="text-gray-400 text-xs">
                                        por {delivery.delivered_by}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      delivery.type === 'original' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-purple-100 text-purple-800'
                                    }`}>
                                      {delivery.type === 'original' ? 'Original' : 'Retificadora'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      Entregue
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">{delivery.attachments_count}</span>
                                      {delivery.has_receipt && (
                                        <span className="text-green-600" title="Com comprovante">📎</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}