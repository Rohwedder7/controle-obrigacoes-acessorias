import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, AlertCircle, Filter, Check, Eye } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api'
import { useNavigate } from 'react-router-dom'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all') // all, due_soon, overdue, approval, reminder
  const navigate = useNavigate()

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data || [])
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Marcar como lida
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId)
      fetchNotifications()
    } catch (err) {
      console.error('Erro ao marcar notificação:', err)
    }
  }

  // Marcar todas como lidas
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      fetchNotifications()
    } catch (err) {
      console.error('Erro ao marcar todas:', err)
    }
  }

  // Navegar ao clicar
  const handleNavigate = (notification) => {
    if (notification.type === 'approval') {
      navigate('/my-deliveries')
    } else if (notification.obligation) {
      navigate('/obligations')
    }
  }

  // Filtrar notificações
  const filteredNotifications = notifications.filter(n => {
    // Filtro de leitura
    if (filter === 'unread' && n.is_read) return false
    if (filter === 'read' && !n.is_read) return false
    
    // Filtro de tipo
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    
    return true
  })

  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // Ícone por tipo
  const getTypeIcon = (type) => {
    switch (type) {
      case 'due_soon': return { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '⚠️' }
      case 'overdue': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', emoji: '🔴' }
      case 'approval': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', emoji: '✅' }
      case 'reminder': return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100', emoji: '📌' }
      default: return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100', emoji: '🔔' }
    }
  }

  // Label do tipo
  const getTypeLabel = (type) => {
    switch (type) {
      case 'due_soon': return 'Vencimento Próximo'
      case 'overdue': return 'Atrasado'
      case 'approval': return 'Aprovação'
      case 'reminder': return 'Lembrete'
      default: return 'Sistema'
    }
  }

  // Estatísticas
  const totalCount = notifications.length
  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando notificações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-5 h-5" />
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {totalCount}</span>
            <span>Não lidas: {unreadCount}</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Filtro de leitura */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Não lidas
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lidas
              </button>
            </div>

            {/* Filtro de tipo */}
            <div className="flex gap-2 border-l pl-3">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos os tipos
              </button>
              <button
                onClick={() => setTypeFilter('due_soon')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === 'due_soon' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Vencimento Próximo
              </button>
              <button
                onClick={() => setTypeFilter('overdue')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === 'overdue' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Atrasados
              </button>
              <button
                onClick={() => setTypeFilter('approval')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === 'approval' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aprovações
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Notificações */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-gray-600">
              {filter !== 'all' || typeFilter !== 'all' 
                ? 'Tente ajustar os filtros para ver mais notificações.' 
                : 'Você não tem notificações no momento.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const typeData = getTypeIcon(notification.type)
              const IconComponent = typeData.icon

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                    !notification.is_read ? 'border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Ícone */}
                      <div className={`p-3 rounded-full ${typeData.bg} flex-shrink-0`}>
                        <span className="text-2xl">{typeData.emoji}</span>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`text-base font-semibold ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <span className={`px-2 py-0.5 rounded-full ${typeData.bg} ${typeData.color}`}>
                            {getTypeLabel(notification.type)}
                          </span>
                          <span>•</span>
                          <span>{formatDate(notification.created_at)}</span>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">
                          {notification.message}
                        </p>

                        {/* Ações */}
                        <div className="flex items-center gap-3">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Check className="w-4 h-4" />
                              Marcar como lida
                            </button>
                          )}
                          {(notification.type === 'approval' || notification.obligation) && (
                            <button
                              onClick={() => handleNavigate(notification)}
                              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalhes
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
