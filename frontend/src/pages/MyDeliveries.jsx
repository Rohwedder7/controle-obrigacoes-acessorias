import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  getMyDeliveries,
  getSubmissionTimeline,
  resubmitSubmission,
  downloadAttachment
} from '../api'
import { CheckCircle, XCircle, AlertCircle, Clock, FileText, Download, RefreshCw } from 'lucide-react'

export default function MyDeliveries() {
  const [loading, setLoading] = useState(false)
  const [deliveries, setDeliveries] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [resubmitForm, setResubmitForm] = useState({
    delivery_date: '',
    submission_type: 'retificadora',
    comments: '',
    receipt_file: null
  })

  useEffect(() => {
    loadDeliveries()
  }, [statusFilter])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const data = await getMyDeliveries(statusFilter)
      setDeliveries(data.results || [])
    } catch (error) {
      showMessage(`Erro ao carregar entregas: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectDelivery = async (delivery) => {
    try {
      setSelectedDelivery(delivery)
      const timelineData = await getSubmissionTimeline(delivery.id)
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

  const openResubmitModal = () => {
    setResubmitForm({
      delivery_date: new Date().toISOString().split('T')[0],
      submission_type: 'retificadora',
      comments: '',
      receipt_file: null
    })
    setShowResubmitModal(true)
  }

  const closeResubmitModal = () => {
    setShowResubmitModal(false)
    setResubmitForm({
      delivery_date: '',
      submission_type: 'retificadora',
      comments: '',
      receipt_file: null
    })
  }

  const handleResubmit = async () => {
    if (!selectedDelivery || !resubmitForm.delivery_date) {
      showMessage('Preencha todos os campos obrigatórios', 'error')
      return
    }

    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append('delivery_date', resubmitForm.delivery_date)
      formData.append('submission_type', resubmitForm.submission_type)
      formData.append('comments', resubmitForm.comments)
      
      if (resubmitForm.receipt_file) {
        formData.append('receipt_file', resubmitForm.receipt_file)
      }
      
      await resubmitSubmission(selectedDelivery.id, formData)
      showMessage('Entrega reenviada com sucesso!', 'success')
      closeResubmitModal()
      setSelectedDelivery(null)
      loadDeliveries()
    } catch (error) {
      showMessage(`Erro ao reenviar: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (attachmentId) => {
    try {
      await downloadAttachment(selectedDelivery.id, attachmentId)
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_review: { label: 'Pendente', color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> },
      approved: { label: 'Aprovada', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      rejected: { label: 'Recusada', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
      needs_revision: { label: 'Necessita Revisão', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> }
    }
    
    const config = statusConfig[status] || statusConfig.pending_review
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Entregas</h1>
          <p className="text-gray-600">Acompanhe o status das suas entregas e faça reenvios quando necessário</p>
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

        {/* Filtro por status */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="pending_review">Pendente de Revisão</option>
            <option value="approved">Aprovada</option>
            <option value="rejected">Recusada</option>
            <option value="needs_revision">Necessita Revisão</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de entregas */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Suas Entregas ({deliveries.length})
              </h2>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
              ) : deliveries.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Você ainda não fez nenhuma entrega</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      onClick={() => selectDelivery(delivery)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedDelivery?.id === delivery.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900">{delivery.company}</div>
                        {getStatusBadge(delivery.approval_status)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {delivery.obligation} • {delivery.state}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Competência: {delivery.competence}
                      </div>
                      <div className="text-xs text-gray-500">
                        Entregue em: {formatDate(delivery.delivery_date)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {delivery.attachments_count} anexo(s)
                        </span>
                        {delivery.can_resubmit && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pode Reenviar
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Painel de detalhes */}
          <div className="bg-white rounded-lg shadow-lg">
            {selectedDelivery ? (
              <>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Detalhes</h2>
                    {getStatusBadge(selectedDelivery.approval_status)}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: '600px' }}>
                  {/* Informações da entrega */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Informações</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Empresa:</span> {selectedDelivery.company}
                      </div>
                      <div>
                        <span className="font-medium">Obrigação:</span> {selectedDelivery.obligation}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> {selectedDelivery.state}
                      </div>
                      <div>
                        <span className="font-medium">Competência:</span> {selectedDelivery.competence}
                      </div>
                      <div>
                        <span className="font-medium">Data de Entrega:</span> {formatDate(selectedDelivery.delivery_date)}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span>{' '}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedDelivery.submission_type === 'original'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {selectedDelivery.submission_type === 'original' ? 'Original' : 'Retificadora'}
                        </span>
                      </div>
                      {selectedDelivery.approval_decision_at && (
                        <div>
                          <span className="font-medium">Decisão em:</span> {formatDateTime(selectedDelivery.approval_decision_at)}
                        </div>
                      )}
                      {selectedDelivery.approval_decision_by && (
                        <div>
                          <span className="font-medium">Decisão por:</span> {selectedDelivery.approval_decision_by}
                        </div>
                      )}
                      {selectedDelivery.approval_comment && (
                        <div>
                          <span className="font-medium">Comentário do Aprovador:</span>
                          <p className="mt-1 text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                            {selectedDelivery.approval_comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Histórico</h3>
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

                  {/* Botão de reenvio */}
                  {selectedDelivery.can_resubmit && (
                    <button
                      onClick={openResubmitModal}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Reenviar Entrega
                    </button>
                  )}
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

        {/* Modal de reenvio */}
        {showResubmitModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reenviar Entrega</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrega *</label>
                    <input
                      type="date"
                      value={resubmitForm.delivery_date}
                      onChange={(e) => setResubmitForm({ ...resubmitForm, delivery_date: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Novo Anexo (opcional)</label>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) => setResubmitForm({ ...resubmitForm, receipt_file: e.target.files[0] })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Deixe em branco para manter o anexo anterior</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comentários</label>
                    <textarea
                      value={resubmitForm.comments}
                      onChange={(e) => setResubmitForm({ ...resubmitForm, comments: e.target.value })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva as correções feitas..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeResubmitModal}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Enviando...' : 'Reenviar'}
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

