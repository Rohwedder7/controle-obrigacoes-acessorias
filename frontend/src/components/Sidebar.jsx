import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao buscar usuário atual:', error);
        // Se der erro 401, limpar tokens
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Empresas', href: '/companies', icon: '🏢' },
    { name: 'Obrigações', href: '/obligations', icon: '📋' },
    { name: 'Despacho', href: '/despacho', icon: '📬' },
    { name: 'Entregas', href: '/submissions', icon: '✅' },
    { name: 'Minhas Entregas', href: '/my-deliveries', icon: '📦' },
    { name: 'Relatórios', href: '/reports', icon: '📈' },
    { name: 'Importação', href: '/imports', icon: '📤' },
  ];

  // Adicionar links de Admin/Aprovador
  const navigation = currentUser?.is_admin 
    ? [
        ...baseNavigation.slice(0, 5), // Até "Minhas Entregas"
        { name: 'Aprovações', href: '/approvals', icon: '✔️' }, // NOVO!
        ...baseNavigation.slice(5), // Relatórios e Importação
        { name: 'Usuários', href: '/users', icon: '👥' }
      ]
    : baseNavigation;

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay para mobile quando sidebar expandida */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      <div className={`bg-white shadow-lg border-r border-gray-200 h-screen transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } fixed lg:relative z-30`}>
        {/* Toggle Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive(item.href)
                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            title={isCollapsed ? item.name : ''}
          >
            <span className={`text-lg ${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="truncate">{item.name}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {loading ? 'Carregando...' : currentUser?.role || 'Usuário'}
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Sair' : ''}
        >
          <svg className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
      </div>
    </>
  );
};

export default Sidebar;
