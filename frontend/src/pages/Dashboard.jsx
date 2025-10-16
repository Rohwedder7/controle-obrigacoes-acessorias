import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { ComplianceChart, StatusDistributionChart, MonthlyTrendChart, UserPerformanceChart } from '../components/DashboardCharts';

// Função auxiliar para formatar datas corretamente (evita problema de timezone)
function formatDate(dateString) {
  if (!dateString) return ''
  // Se a data já estiver no formato DD/MM/AAAA, retorna direto
  if (dateString.includes('/')) {
    return dateString
  }
  // Caso contrário, parsear corretamente sem interpretar como UTC
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showSettings, setShowSettings] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState({
    showCharts: true,
    showCompanyPerformance: true,
    showUserPerformance: true,
    showMonthlyTrend: true,
    showStatusDistribution: true,
    showCriticalAlerts: true,
    showUpcomingAlerts: true,
    chartHeight: 'h-64'
  });

  // Estados para expansão dos cards
  const [expandedCards, setExpandedCards] = useState({
    critical: false,
    upcoming: false
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access');
      let url = `${API_URL}/dashboard/metrics/`;
      
      // Adicionar filtros de data se estiverem preenchidos
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('start_date', dateFilter.startDate);
      if (dateFilter.endDate) params.append('end_date', dateFilter.endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (monthStr) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const [month, year] = monthStr.split('/');
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const getStatusColor = (pending, delivered) => {
    const total = pending + delivered;
    if (total === 0) return 'bg-gray-100 border-gray-300';
    const percentage = (delivered / total) * 100;
    if (percentage >= 80) return 'bg-green-50 border-green-300';
    if (percentage >= 50) return 'bg-yellow-50 border-yellow-300';
    return 'bg-red-50 border-red-300';
  };

  const getStatusIcon = (pending, delivered) => {
    const total = pending + delivered;
    if (total === 0) return '⚪';
    const percentage = (delivered / total) * 100;
    if (percentage >= 80) return '🟢';
    if (percentage >= 50) return '🟡';
    return '🔴';
  };

  const applyDateFilter = () => {
    setLoading(true);
    fetchDashboardData();
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    });
  };

  const toggleCardExpansion = (cardType) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardType]: !prev[cardType]
    }));
  };

  const exportDashboardData = async (format) => {
    try {
      const token = localStorage.getItem('access');
      let url = `${API_URL}/reports/export.${format}`;
      
      // Adicionar filtros de data se estiverem preenchidos
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('start_date', dateFilter.startDate);
      if (dateFilter.endDate) params.append('end_date', dateFilter.endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados do dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50">
              {/* Header */}
              <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                      <p className="text-gray-600 mt-1">
                        Visão geral das obrigações - {formatMonth(dashboardData?.current_month || new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Última atualização</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Filtros e Exportação */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">De:</label>
                        <input
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Até:</label>
                        <input
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={applyDateFilter}
                        className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Aplicar Filtro
                      </button>
                      {(dateFilter.startDate || dateFilter.endDate) && (
                        <button
                          onClick={clearDateFilter}
                          className="px-4 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSettings(true)}
                        className="px-4 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configurações
                      </button>
                      <button
                        onClick={() => exportDashboardData('csv')}
                        className="px-4 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        CSV
                      </button>
                      <button
                        onClick={() => exportDashboardData('xlsx')}
                        className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total de Empresas</p>
                <p className="text-3xl font-bold text-blue-900">{dashboardData?.total_companies || 0}</p>
                <p className="text-xs text-blue-600 mt-1">Empresas ativas</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full shadow-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Obrigações</p>
                <p className="text-3xl font-bold text-purple-900">{dashboardData?.total_obligations || 0}</p>
                <p className="text-xs text-purple-600 mt-1">Todas as obrigações</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Pendentes</p>
                <p className="text-3xl font-bold text-orange-900">{dashboardData?.pending_obligations || 0}</p>
                <p className="text-xs text-orange-600 mt-1">Aguardando entrega</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-full shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Entregues</p>
                <p className="text-3xl font-bold text-green-900">{dashboardData?.delivered_obligations || 0}</p>
                <p className="text-xs text-green-600 mt-1">Concluídas</p>
              </div>
              <div className="bg-green-500 p-3 rounded-full shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-indigo-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Taxa de Cumprimento</p>
                <p className="text-3xl font-bold text-indigo-900">{dashboardData?.compliance_rate || 0}%</p>
                <p className="text-xs text-indigo-600 mt-1">Eficiência geral</p>
              </div>
              <div className="bg-indigo-500 p-3 rounded-full shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas Críticos */}
        {dashboardSettings.showCriticalAlerts && dashboardData?.critical_obligations && dashboardData.critical_obligations.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-red-500 p-2 rounded-full">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-red-800">Obrigações Críticas</h3>
                  <div className="mt-1 text-sm text-red-700">
                    <p>{dashboardData.critical_obligations.length} obrigação(ões) em atraso há mais de 5 dias</p>
                  </div>
                </div>
              </div>
              {dashboardData.critical_obligations.length > 3 && (
                <button
                  onClick={() => toggleCardExpansion('critical')}
                  className="flex items-center gap-2 px-3 py-1 bg-red-200 hover:bg-red-300 text-red-800 rounded-lg transition-colors text-sm font-medium"
                >
                  {expandedCards.critical ? 'Ver menos' : 'Ver todas'}
                  <svg 
                    className={`w-4 h-4 transition-transform ${expandedCards.critical ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(expandedCards.critical ? dashboardData.critical_obligations : dashboardData.critical_obligations.slice(0, 3)).map((obligation, index) => (
                <div key={obligation.id || index} className="bg-white/50 p-4 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-red-900 font-semibold text-sm">
                        {obligation.company_name}
                      </div>
                      <div className="text-red-800 font-medium text-sm mt-1">
                        {obligation.obligation_name} - {obligation.state} ({obligation.competence})
                      </div>
                      <div className="text-red-700 text-xs mt-1">
                        Responsável: {obligation.responsible_user_full_name}
                      </div>
                    </div>
                    <span className="font-bold text-red-800 bg-red-200 px-3 py-1 rounded-full text-sm whitespace-nowrap ml-3">
                      {obligation.days_overdue} dias em atraso
                    </span>
                  </div>
                  <div className="text-xs text-red-600">
                    Vencimento: {formatDate(obligation.due_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Obrigações Próximas do Vencimento */}
        {dashboardSettings.showUpcomingAlerts && dashboardData?.upcoming_obligations && dashboardData.upcoming_obligations.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-orange-500 p-2 rounded-full">
                    <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-orange-800">Vencimentos Próximos</h3>
                  <div className="mt-1 text-sm text-orange-700">
                    <p>{dashboardData.upcoming_obligations.length} obrigação(ões) vence(m) nos próximos 7 dias</p>
                  </div>
                </div>
              </div>
              {dashboardData.upcoming_obligations.length > 3 && (
                <button
                  onClick={() => toggleCardExpansion('upcoming')}
                  className="flex items-center gap-2 px-3 py-1 bg-orange-200 hover:bg-orange-300 text-orange-800 rounded-lg transition-colors text-sm font-medium"
                >
                  {expandedCards.upcoming ? 'Ver menos' : 'Ver todas'}
                  <svg 
                    className={`w-4 h-4 transition-transform ${expandedCards.upcoming ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(expandedCards.upcoming ? dashboardData.upcoming_obligations : dashboardData.upcoming_obligations.slice(0, 3)).map((obligation, index) => (
                <div key={obligation.id || index} className="bg-white/50 p-4 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-orange-900 font-semibold text-sm">
                        {obligation.company_name}
                      </div>
                      <div className="text-orange-800 font-medium text-sm mt-1">
                        {obligation.obligation_name} - {obligation.state} ({obligation.competence})
                      </div>
                      <div className="text-orange-700 text-xs mt-1">
                        Responsável: {obligation.responsible_user_full_name}
                      </div>
                    </div>
                    <span className="font-bold text-orange-800 bg-orange-200 px-3 py-1 rounded-full text-sm whitespace-nowrap ml-3">
                      {obligation.days_until_due} dias restantes
                    </span>
                  </div>
                  <div className="text-xs text-orange-600">
                    Vencimento: {formatDate(obligation.due_date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráficos */}
        {dashboardSettings.showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de Distribuição de Status */}
            {dashboardSettings.showStatusDistribution && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Distribuição de Status</h3>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                </div>
                <div className="h-80">
                  <StatusDistributionChart data={dashboardData} />
                </div>
              </div>
            )}

            {/* Gráfico de Tendência Mensal */}
            {dashboardSettings.showMonthlyTrend && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Tendência Mensal</h3>
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="h-80">
                  <MonthlyTrendChart data={dashboardData} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gráfico de Performance por Usuário */}
        {dashboardSettings.showUserPerformance && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Performance por Usuário Responsável</h3>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="h-80">
              <UserPerformanceChart data={dashboardData} />
            </div>
          </div>
        )}

        {/* Gráfico de Taxa de Cumprimento por Empresa */}
        {dashboardSettings.showCompanyPerformance && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Taxa de Cumprimento por Empresa</h3>
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="h-80">
              <ComplianceChart data={dashboardData?.company_performance || []} />
            </div>
          </div>
        )}

        {/* Companies Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Empresas - {formatMonth(dashboardData?.current_month || '')}</h2>
                <p className="text-sm text-gray-600 mt-1">Status das obrigações por empresa no mês atual</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pendentes
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entregues
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progresso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.companies?.map((company) => (
                  <tr key={company.id} className={`hover:bg-gray-50 ${getStatusColor(company.pending_count, company.delivered_count)}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{getStatusIcon(company.pending_count, company.delivered_count)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">[{company.code}] {company.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">
                        {company.cnpj ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {company.total_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {company.pending_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {company.delivered_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: company.total_count > 0 ? `${(company.delivered_count / company.total_count) * 100}%` : '0%' 
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {company.total_count > 0 ? Math.round((company.delivered_count / company.total_count) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!dashboardData?.companies || dashboardData.companies.length === 0) && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Cadastre empresas para começar a visualizar os dados.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link 
              to="/companies" 
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Empresas</p>
                <p className="text-xs text-gray-500">Cadastrar e editar</p>
              </div>
            </Link>

            <Link 
              to="/obligations" 
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Obrigações</p>
                <p className="text-xs text-gray-500">Gerenciar prazos</p>
              </div>
            </Link>

            <Link 
              to="/submissions" 
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Entregas</p>
                <p className="text-xs text-gray-500">Registrar envios</p>
              </div>
            </Link>

            <Link 
              to="/reports" 
              className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200"
            >
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Relatórios</p>
                <p className="text-xs text-gray-500">Exportar dados</p>
              </div>
            </Link>

            <Link 
              to="/notifications" 
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200 relative"
            >
              <div className="bg-orange-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Notificações</p>
                <p className="text-xs text-gray-500">Alertas e avisos</p>
              </div>
              {dashboardData?.notifications?.unread > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {dashboardData.notifications.unread}
                </div>
              )}
            </Link>

            <Link 
              to="/planning" 
              className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
            >
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Planejamento</p>
                <p className="text-xs text-gray-500">Geração automática</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      </div>

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Configurações do Dashboard</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Mostrar Gráficos</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showCharts}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showCharts: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Distribuição de Status</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showStatusDistribution}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showStatusDistribution: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Tendência Mensal</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showMonthlyTrend}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showMonthlyTrend: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Performance por Usuário</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showUserPerformance}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showUserPerformance: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Performance por Empresa</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showCompanyPerformance}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showCompanyPerformance: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Alertas Críticos</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showCriticalAlerts}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showCriticalAlerts: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Vencimentos Próximos</label>
                  <input
                    type="checkbox"
                    checked={dashboardSettings.showUpcomingAlerts}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, showUpcomingAlerts: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Altura dos Gráficos</label>
                  <select
                    value={dashboardSettings.chartHeight}
                    onChange={(e) => setDashboardSettings({...dashboardSettings, chartHeight: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="h-48">Pequena (192px)</option>
                    <option value="h-64">Média (256px)</option>
                    <option value="h-80">Grande (320px)</option>
                    <option value="h-96">Extra Grande (384px)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;