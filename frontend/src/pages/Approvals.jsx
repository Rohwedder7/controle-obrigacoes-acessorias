import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  getPendingApprovals,
  getCompanies,
  getObligationTypes,
  approveSubmission,
  rejectSubmission,
  requestRevision,
  getSubmissionTimeline,
  downloadAttachment
} from '../api'
import { CheckCircle, XCircle, AlertCircle, Download, Clock, FileText, X } from 'lucide-react'

// Função helper para obter cor do status
const getStatusDotColor = (approvalStatus) => {
  switch (approvalStatus) {
    case 'approved':
      return 'bg-green-500'
    case 'needs_revision':
      return 'bg-yellow-500'
    case 'rejected':
      return 'bg-red-500'
    case 'pending_review':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}

// Função helper para formatar CNPJ
const formatCNPJ = (cnpj) => {
  if (!cnpj) return ''
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '')
  // Aplica máscara XX.XXX.XXX/XXXX-XX
  if (cleaned.length === 14) {
    return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    )
  }
  return cnpj
}

export default function Approvals() {
  const [loading, setLoading] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [companies, setCompanies] = useState([])
  const [obligationTypes, setObligationTypes] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState(null) // 'approve', 'reject', 'revision'
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  
  const [filters, setFilters] = useState({
    company: '',
    obligation_type: '',
    search: '',
    start_date: '',
    end_date: '',
    status: ''  // Filtro de status (vazio = todas)
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadApprovals()
  }, [filters])

  const loadData = async () => {
    try {
      const [companiesData, typesData] = await Promise.all([
        getCompanies(),
        getObligationTypes()
      ])
      setCompanies(companiesData)
      setObligationTypes(typesData)
    } catch (error) {
      showMessage(`Erro ao carregar dados: ${error.message}`, 'error')
    }
  }

  const loadApprovals = async () => {
    try {
      setLoading(true)
      const data = await getPendingApprovals(filters)
      setPendingApprovals(data.results || [])
    } catch (error) {
      showMessage(`Erro ao carregar aprovações: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectSubmission = async (submission) => {
    try {
      setSelectedSubmission(submission)
      const timelineData = await getSubmissionTimeline(submission.id)
      setTimeline(timelineData.timeline || [])
    } catch (error) {
      showMessage(`Erro ao carregar timeline: ${error.message}`, 'error')
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => {
      setMessage('')
      setMessageType('')
    }, 5000)
  }

  const openModal = (action) => {
    setModalAction(action)
    setComment('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalAction(null)
    setComment('')
  }

  const handleAction = async () => {
    if (!selectedSubmission) return

    // Validar comentário obrigatório para reject e revision
    if ((modalAction === 'reject' || modalAction === 'revision') && !comment.trim()) {
      showMessage('O comentário é obrigatório', 'error')
      return
    }

    try {
      setLoading(true)

      if (modalAction === 'approve') {
        await approveSubmission(selectedSubmission.id, comment)
        showMessage('Entrega aprovada com sucesso!', 'success')
      } else if (modalAction === 'reject') {
        await rejectSubmission(selectedSubmission.id, comment)
        showMessage('Entrega recusada', 'success')
      } else if (modalAction === 'revision') {
        await requestRevision(selectedSubmission.id, comment)
        showMessage('Revisão solicitada', 'success')
      }

      closeModal()
      setSelectedSubmission(null)
      loadApprovals()
    } catch (error) {
      showMessage(`Erro: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (attachmentId) => {
    try {
      await downloadAttachment(selectedSubmission.id, attachmentId)
    } catch (error) {
      showMessage(`Erro ao baixar anexo: ${error.message}`, 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aprovações</h1>
          <p className="text-gray-600">Visualize e gerencie todas as entregas do sistema</p>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              messageType === 'error'
                ? 'bg-red-100 border border-red-400 text-red-700'
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Empresa, obrigação..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <select
                value={filters.company}
                onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as empresas</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    [{company.code}] {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Obrigação</label>
              <select
                value={filters.obligation_type}
                onChange={(e) => setFilters({ ...filters, obligation_type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                {obligationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="pending_review">Pendente de Revisão</option>
                <option value="approved">Aprovada</option>
                <option value="rejected">Recusada</option>
                <option value="needs_revision">Necessita Revisão</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setFilters({ company: '', obligation_type: '', search: '', start_date: '', end_date: '', status: '' })}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de entregas */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Entregas ({pendingApprovals.length})
              </h2>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma entrega pendente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingApprovals.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => selectSubmission(submission)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                        selectedSubmission?.id === submission.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      {/* Bolinha de status no canto superior direito */}
                      <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${getStatusDotColor(submission.approval_status)} shadow-sm`} 
                           title={
                             submission.approval_status === 'approved' ? 'Aprovada' :
                             submission.approval_status === 'needs_revision' ? 'Necessita Revisão' :
                             submission.approval_status === 'rejected' ? 'Recusada' :
                             'Pendente de Revisão'
                           }>
                      </div>
                      
                      <div className="font-semibold text-gray-900">
                        {submission.company.name} - {formatCNPJ(submission.company.cnpj)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {submission.obligation.name} • {submission.obligation.state}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Competência: {submission.obligation.competence}
                      </div>
                      <div className="text-xs text-gray-500">
                        Entregue em: {formatDate(submission.delivery_date)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {submission.attachments_count} anexo(s)
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            submission.submission_type === 'original'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {submission.submission_type === 'original' ? 'Original' : 'Retificadora'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Painel de detalhes */}
          <div className="bg-white rounded-lg shadow-lg">
            {selectedSubmission ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Detalhes da Entrega</h2>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: '600px' }}>
                  {/* Informações da entrega */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Informações</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Empresa:</span> {selectedSubmission.company.code} - {selectedSubmission.company.name}
                      </div>
                      <div>
                        <span className="font-medium">CNPJ:</span> {formatCNPJ(selectedSubmission.company.cnpj)}
                      </div>
                      <div>
                        <span className="font-medium">Obrigação:</span> {selectedSubmission.obligation.name}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> {selectedSubmission.obligation.state}
                      </div>
                      <div>
                        <span className="font-medium">Competência:</span> {selectedSubmission.obligation.competence}
                      </div>
                      <div>
                        <span className="font-medium">Vencimento:</span> {formatDate(selectedSubmission.obligation.due_date)}
                      </div>
                      <div>
                        <span className="font-medium">Data de Entrega:</span> {formatDate(selectedSubmission.delivery_date)}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span>{' '}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedSubmission.submission_type === 'original'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {selectedSubmission.submission_type === 'original' ? 'Original' : 'Retificadora'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Entregue por:</span> {selectedSubmission.delivered_by.username}
                        {selectedSubmission.delivered_by.full_name && ` (${selectedSubmission.delivered_by.full_name})`}
                      </div>
                      {selectedSubmission.comments && (
                        <div>
                          <span className="font-medium">Comentários:</span>
                          <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">{selectedSubmission.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Anexos */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Anexos ({selectedSubmission.attachments_count})</h3>
                    <div className="space-y-2">
                      {selectedSubmission.attachments.map((attachment) => (
                        <button
                          key={attachment.id}
                          onClick={() => handleDownload(attachment.id)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium">{attachment.filename}</span>
                          </div>
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                      <div className="space-y-4">
                        {timeline.map((event, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                  event.color === 'green'
                                    ? 'bg-green-500'
                                    : event.color === 'red'
                                    ? 'bg-red-500'
                                    : event.color === 'yellow'
                                    ? 'bg-yellow-500'
                                    : event.color === 'purple'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                }`}
                              >
                                {event.icon}
                              </div>
                              {index < timeline.length - 1 && <div className="w-0.5 h-full bg-gray-300 mt-2"></div>}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="font-semibold">{event.label}</div>
                              <div className="text-xs text-gray-500">{formatDateTime(event.timestamp)}</div>
                              {event.by && (
                                <div className="text-xs text-gray-600 mt-1">
                                  por {event.by.username}
                                  {event.by.full_name && ` (${event.by.full_name})`}
                                </div>
                              )}
                              {event.comment && (
                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">{event.comment}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => openModal('approve')}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => openModal('revision')}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Pedir Revisão
                    </button>
                    <button
                      onClick={() => openModal('reject')}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Recusar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma entrega para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de ação */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {modalAction === 'approve' && 'Confirmar Aprovação'}
                    {modalAction === 'reject' && 'Recusar Entrega'}
                    {modalAction === 'revision' && 'Solicitar Revisão'}
                  </h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {modalAction === 'approve' ? 'Comentário (opcional)' : 'Comentário *'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      modalAction === 'approve'
                        ? 'Adicione um comentário (opcional)...'
                        : modalAction === 'reject'
                        ? 'Explique o motivo da recusa...'
                        : 'Explique o que precisa ser corrigido...'
                    }
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAction}
                    disabled={loading}
                    className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      modalAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : modalAction === 'reject'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {loading ? 'Processando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

