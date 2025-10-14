import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, Eye, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api'

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data || [])
      setUnreadCount(data.filter(n => !n.is_read).length)
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
    } finally {
      setLoading(false)
    }
  }

  // Carregar notificações ao montar e a cada 60s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // 60 segundos
    return () => clearInterval(interval)
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Marcar como lida e navegar
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationRead(notification.id)
        fetchNotifications()
      }
      setShowDropdown(false)
      
      // Navegar baseado no tipo
      if (notification.type === 'approval') {
        navigate('/my-deliveries')
      } else if (notification.obligation) {
        navigate('/obligations')
      }
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
      console.error('Erro ao marcar todas como lidas:', err)
    }
  }

  // Formatar tempo relativo
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return `${diffDays}d atrás`
  }

  // Ícone por tipo
  const getTypeIcon = (type) => {
    switch (type) {
      case 'due_soon': return '⚠️'
      case 'overdue': return '🔴'
      case 'approval': return '✅'
      case 'reminder': return '📌'
      default: return '🔔'
    }
  }

  // Cor por prioridade
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300'
      case 'high': return 'bg-orange-100 border-orange-300'
      case 'medium': return 'bg-yellow-100 border-yellow-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  // Últimas 10 notificações
  const recentNotifications = notifications.slice(0, 10)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        title="Notificações"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Notificações */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loading && recentNotifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação</p>
              </div>
            )}

            {!loading && recentNotifications.length > 0 && (
              <div className="divide-y divide-gray-200">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0 mt-1">
                        {getTypeIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => {
                  setShowDropdown(false)
                  navigate('/notifications')
                }}
                className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 ml-auto"
              >
                <Eye className="w-4 h-4" />
                Ver todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell

