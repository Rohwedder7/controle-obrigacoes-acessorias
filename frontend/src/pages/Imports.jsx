import React, { useState } from 'react'
import API from '../api'
import Layout from '../components/Layout'

export default function Imports(){
  const [file,setFile] = useState(null)
  const [msg,setMsg] = useState('')
  async function submit(e){
    e.preventDefault()
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch(API + '/imports/bulk/', { method:'POST', body: fd, headers: { 'Authorization': 'Bearer ' + localStorage.getItem('access') } })
    const j = await r.json()
    setMsg('Criados: ' + (j.created||0))
  }
  return (
    <Layout>
      <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Importação em Massa (Excel)</h2>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow grid gap-3">
        <input type="file" accept=".xlsx" onChange={e=>setFile(e.target.files[0])} className="p-2 border rounded" />
        <button className="p-2 bg-indigo-600 text-white rounded">Enviar</button>
        {msg && <div className="text-green-700">{msg}</div>}
      </form>
      <p className="text-sm text-gray-600 mt-4">Esperado: colunas (linha 1 cabeçalho): <strong>company</strong>, <strong>cnpj</strong>, <strong>state</strong>, <strong>obligation_type</strong>, <strong>competence</strong>, <strong>due_date</strong> (YYYY-MM-DD), <strong>delivery_deadline</strong> (YYYY-MM-DD), <strong>notes</strong>.</p>
    </div>
    </Layout>
  )
}
