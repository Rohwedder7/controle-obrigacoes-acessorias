import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { uploadCompaniesBulk, downloadTemplate } from '../api';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    cnpj: '',
    fantasy_name: '',
    email: '',
    phone: '',
    address: '',
    responsible: '',
    active: true
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(`${API_URL}/companies/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access');
      const url = editingCompany 
        ? `${API_URL}/companies/${editingCompany.id}/`
        : `${API_URL}/companies/`;
      
      const method = editingCompany ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCompanies();
        setShowForm(false);
        setEditingCompany(null);
        setFormData({
          code: '',
          name: '',
          cnpj: '',
          fantasy_name: '',
          email: '',
          phone: '',
          address: '',
          responsible: '',
          active: true
        });
      }
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      code: company.code || '',
      name: company.name || '',
      cnpj: company.cnpj || '',
      fantasy_name: company.fantasy_name || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      responsible: company.responsible || '',
      active: company.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta empresa?')) {
      try {
        const token = localStorage.getItem('access');
        await fetch(`${API_URL}/companies/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        fetchCompanies();
      } catch (error) {
        console.error('Erro ao excluir empresa:', error);
      }
    }
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    
    try {
      const result = await uploadCompaniesBulk(formData);
      setUploadResult(result);
      if (result.created > 0) {
        // Recarregar a lista de empresas
        fetchCompanies();
      }
    } catch (error) {
      setUploadResult({ error: 'Erro ao fazer upload: ' + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async (type) => {
    try {
      const blob = await downloadTemplate(type);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Erro ao baixar template: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Empresas</h1>
          <p className="text-gray-600">Gerencie as empresas cadastradas no sistema</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Empresa
          </button>
          
          <button
            onClick={() => handleDownloadTemplate('companies')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar Template
          </button>
        </div>

        {/* Upload em Massa */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload em Massa</h3>
          
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivo Excel
              </label>
              <input 
                type="file" 
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={!uploadFile || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
            >
              {uploading ? 'Enviando...' : 'Fazer Upload'}
            </button>
          </form>
          
          {uploadResult && (
            <div className={`mt-4 p-4 rounded-lg ${uploadResult.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {uploadResult.error ? (
                <p>{uploadResult.error}</p>
              ) : (
                <div>
                  <p>✅ Upload concluído!</p>
                  <p>📊 {uploadResult.created} empresas criadas</p>
                  <p>📋 {uploadResult.total_processed} linhas processadas</p>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">⚠️ Erros encontrados:</p>
                      <ul className="list-disc list-inside">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {company.code}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                  </div>
                  {company.fantasy_name && (
                    <p className="text-sm text-gray-600 mb-2">({company.fantasy_name})</p>
                  )}
                  {company.cnpj && (
                    <p className="text-sm text-gray-500 font-mono">{formatCNPJ(company.cnpj)}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  company.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {company.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {company.responsible && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Responsável:</span> {company.responsible}
                  </p>
                </div>
              )}

              {(company.email || company.phone) && (
                <div className="mb-4 space-y-1">
                  {company.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26c.46.25 1.02.25 1.48 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {company.email}
                    </p>
                  )}
                  {company.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {company.phone}
                    </p>
                  )}
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{company.obligations_count || 0}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-orange-600">{company.pending_obligations || 0}</p>
                  <p className="text-xs text-gray-500">Pendentes</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{company.delivered_obligations || 0}</p>
                  <p className="text-xs text-gray-500">Entregues</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(company)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-gray-500 mb-6">Comece cadastrando sua primeira empresa.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Cadastrar Empresa
            </button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingCompany(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingCompany ? true : false}
                  />
                  {editingCompany && (
                    <p className="text-xs text-gray-500 mt-1">O código não pode ser alterado após a criação</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={formData.fantasy_name}
                    onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Empresa ativa
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCompany(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingCompany ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default Companies;
