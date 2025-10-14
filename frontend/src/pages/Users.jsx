import React, { useState, useEffect } from 'react'
import { 
  Users as UsersIcon, 
  Search, 
  Eye, 
  Edit3, 
  Shield, 
  User as UserIcon,
  Calendar,
  Mail,
  UserCheck,
  AlertCircle,
  Trash2,
  Key,
  UserPlus,
  Shuffle
} from 'lucide-react'
import { getUsersAdmin, setUserRole, getUserHistory, deleteUser, changeUserPassword, createUser } from '../api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [userHistory, setUserHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [userToChangePassword, setUserToChangePassword] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'Usuario'
  })
  const [createErrors, setCreateErrors] = useState({})

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsersAdmin()
      setUsers(data.results || data)
    } catch (err) {
      if (err.message.includes('403') || err.message.includes('Acesso negado')) {
        setIsAuthorized(false)
      }
      setError('Erro ao carregar usuários: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Alterar papel do usuário
  const changeUserRole = async (userId, newRole) => {
    try {
      await setUserRole(userId, newRole)
      setMessage(`Papel alterado para ${newRole} com sucesso!`)
      fetchUsers() // Recarregar lista
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('Erro ao alterar papel: ' + err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  // Buscar histórico do usuário
  const fetchUserHistory = async (userId) => {
    try {
      setHistoryLoading(true)
      const data = await getUserHistory(userId)
      setUserHistory(data.results?.history || data.history || [])
      setShowHistory(true)
    } catch (err) {
      setError('Erro ao carregar histórico: ' + err.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Confirmar exclusão de usuário
  const confirmDeleteUser = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  // Excluir usuário
  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUser(userToDelete.id)
      setMessage(`Usuário ${userToDelete.username} excluído com sucesso!`)
      fetchUsers() // Recarregar lista
      setShowDeleteModal(false)
      setUserToDelete(null)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError('Erro ao excluir usuário: ' + err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  // Confirmar alteração de senha
  const confirmChangePassword = (user) => {
    setUserToChangePassword(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  // Alterar senha do usuário
  const handleChangePassword = async () => {
    console.log('handleChangePassword iniciado')
    console.log('userToChangePassword:', userToChangePassword)
    console.log('newPassword:', newPassword)
    
    if (!userToChangePassword || !newPassword) {
      console.log('Dados insuficientes para alterar senha')
      return
    }
    
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setTimeout(() => setError(''), 3000)
      return
    }
    
    try {
      console.log('Chamando changeUserPassword...')
      const result = await changeUserPassword(userToChangePassword.id, newPassword)
      console.log('Resultado recebido:', result)
      
      if (result.success) {
        console.log('Senha alterada com sucesso!')
        setMessage(`✅ Senha do usuário ${userToChangePassword.username} alterada com sucesso! O usuário já pode fazer login com a nova senha.`)
        setShowPasswordModal(false)
        setUserToChangePassword(null)
        setNewPassword('')
        setTimeout(() => setMessage(''), 5000)
      } else {
        console.error('Erro no resultado:', result)
        setError('Erro ao alterar senha: ' + (result.error || 'Resposta inválida do servidor'))
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      console.error('Erro detalhado na alteração de senha:', err)
      console.error('Stack trace:', err.stack)
      setError('Erro ao alterar senha: ' + err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  // Gerar senha aleatória
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Abrir modal de criação
  const openCreateModal = () => {
    setNewUser({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      role: 'Usuario'
    })
    setCreateErrors({})
    setShowCreateModal(true)
  }

  // Criar novo usuário
  const handleCreateUser = async () => {
    // Validações básicas no frontend
    const errors = {}
    
    if (!newUser.username || newUser.username.length < 3) {
      errors.username = 'Username deve ter pelo menos 3 caracteres'
    }
    
    if (!newUser.email || !newUser.email.includes('@')) {
      errors.email = 'E-mail inválido'
    }
    
    if (!newUser.first_name) {
      errors.first_name = 'Nome é obrigatório'
    }
    
    if (!newUser.last_name) {
      errors.last_name = 'Sobrenome é obrigatório'
    }
    
    if (!newUser.password || newUser.password.length < 8) {
      errors.password = 'Senha deve ter pelo menos 8 caracteres'
    }
    
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      return
    }
    
    try {
      const result = await createUser(newUser)
      setMessage(`✅ Usuário ${result.username} criado com sucesso!`)
      setShowCreateModal(false)
      fetchUsers() // Recarregar lista
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      // Tentar parsear erros do backend
      try {
        const backendErrors = JSON.parse(err.message)
        setCreateErrors(backendErrors)
      } catch {
        setError('Erro ao criar usuário: ' + err.message)
        setTimeout(() => setError(''), 5000)
      }
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filtrar usuários por busca
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString, formattedString) => {
    // Se temos a versão formatada do backend, use ela
    if (formattedString) return formattedString
    // Caso contrário, formate no frontend
    if (!dateString) return 'Nunca'
    
    // Se a data já está no formato YYYY-MM-DD, converte diretamente sem problemas de timezone
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800'
      case 'Usuario': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin': return <Shield className="w-4 h-4" />
      case 'Usuario': return <UserIcon className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="bg-red-100 rounded-full p-6 mb-4">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 text-center max-w-md">
              Você não tem permissão para acessar esta página. 
              Apenas administradores podem gerenciar usuários.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Novo Usuário
            </button>
          </div>
          <p className="text-gray-600">Administre usuários e seus papéis no sistema</p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{message}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Papel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.username
                            }
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email || 'Sem email'}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(user.last_login, user.last_login_formatted)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            fetchUserHistory(user.id)
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Histórico
                        </button>
                        
                        {user.role !== 'Admin' || users.filter(u => u.role === 'Admin').length > 1 ? (
                          <select
                            value={user.role}
                            onChange={(e) => changeUserRole(user.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Usuario">Usuario</option>
                            <option value="Admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">Último Admin</span>
                        )}
                        
                        <button
                          onClick={() => confirmChangePassword(user)}
                          className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                          title="Alterar senha"
                        >
                          <Key className="w-4 h-4" />
                          Senha
                        </button>
                        
                        <button
                          onClick={() => confirmDeleteUser(user)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User History Modal */}
        {showHistory && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Histórico de {selectedUser.username}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Registro de ações no sistema
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : userHistory.length > 0 ? (
                  <div className="space-y-4">
                    {userHistory.map((log, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {log.action === 'created' && 'Criado'}
                            {log.action === 'updated' && 'Atualizado'}
                            {log.action === 'deleted' && 'Excluído'}
                            {log.action === 'grant_role' && 'Papel alterado'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Modelo: {log.model}
                          {log.object_id && ` (ID: ${log.object_id})`}
                        </div>
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            <details>
                              <summary className="cursor-pointer hover:text-gray-700">
                                Ver alterações
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum histórico encontrado para este usuário.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 rounded-full p-2">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Confirmar Exclusão
                    </h3>
                    <p className="text-sm text-gray-500">
                      Esta ação não pode ser desfeita
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4">
                  Tem certeza que deseja excluir o usuário <strong>{userToDelete.username}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Todos os dados relacionados a este usuário serão removidos permanentemente.
                </p>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setUserToDelete(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de criação de usuário */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Criar Novo Usuário
                    </h3>
                    <p className="text-sm text-gray-500">
                      Preencha os dados do novo usuário
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {/* Nome Completo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={newUser.first_name}
                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                        className={`w-full px-3 py-2 border ${createErrors.first_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="João"
                      />
                      {createErrors.first_name && (
                        <p className="text-xs text-red-600 mt-1">{createErrors.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sobrenome *
                      </label>
                      <input
                        type="text"
                        value={newUser.last_name}
                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                        className={`w-full px-3 py-2 border ${createErrors.last_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Silva"
                      />
                      {createErrors.last_name && (
                        <p className="text-xs text-red-600 mt-1">{createErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className={`w-full px-3 py-2 border ${createErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="joao.silva@exemplo.com"
                    />
                    {createErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{createErrors.email}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                      className={`w-full px-3 py-2 border ${createErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="joao_silva"
                    />
                    {createErrors.username && (
                      <p className="text-xs text-red-600 mt-1">{createErrors.username}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Apenas letras, números e underscore</p>
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className={`flex-1 px-3 py-2 border ${createErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, password: generatePassword() })}
                        className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        title="Gerar senha aleatória"
                      >
                        <Shuffle className="w-4 h-4" />
                        Gerar
                      </button>
                    </div>
                    {createErrors.password && (
                      <p className="text-xs text-red-600 mt-1">{createErrors.password}</p>
                    )}
                  </div>

                  {/* Papel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Papel *
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Usuario">Usuario</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {/* Informações */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Importante:</strong> O usuário poderá fazer login com o username e senha fornecidos.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateErrors({})
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Criar Usuário
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de alteração de senha */}
        {showPasswordModal && userToChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <Key className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Alterar Senha
                    </h3>
                    <p className="text-sm text-gray-500">
                      Definir nova senha para o usuário
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <p className="text-gray-700 mb-4">
                  Nova senha para <strong>{userToChangePassword.username}</strong>:
                </p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  minLength={6}
                />
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Após alterar a senha, o usuário deve:
                  </p>
                  <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
                    <li>Fazer logout se estiver logado</li>
                    <li>Fazer login novamente com a nova senha</li>
                    <li>Limpar o cache do navegador se necessário</li>
                  </ul>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setUserToChangePassword(null)
                    setNewPassword('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={newPassword.length < 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Alterar Senha
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
