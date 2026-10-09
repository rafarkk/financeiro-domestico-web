import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { ToastProvider } from './components/Sobreposicoes.jsx'
import Home from './pages/Home.jsx'
import ContaForm from './pages/ContaForm.jsx'
import MovimentacaoForm from './pages/MovimentacaoForm.jsx'
import Categorias from './pages/Categorias.jsx'
import Planejamentos from './pages/Planejamentos.jsx'
import PlanejamentoForm from './pages/PlanejamentoForm.jsx'
import LancamentosPrevistos from './pages/LancamentosPrevistos.jsx'

// Recria a tela quando o endereço muda (ex.: de "editar" para "copiar" o mesmo lançamento).
function PorEndereco({ children }) {
  return <div key={useLocation().pathname}>{children}</div>
}

// Mesmas rotas do app original.
export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="contas/nova" element={<ContaForm />} />
            <Route path="contas/:id" element={<PorEndereco><ContaForm /></PorEndereco>} />
            <Route path="movimentacoes/nova/:idConta/:tipo" element={<PorEndereco><MovimentacaoForm /></PorEndereco>} />
            <Route path="movimentacoes/transformar/:idOrigem" element={<PorEndereco><MovimentacaoForm /></PorEndereco>} />
            <Route path="movimentacoes/:id" element={<PorEndereco><MovimentacaoForm /></PorEndereco>} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="planejamentos" element={<Planejamentos />} />
            <Route path="planejamentos/previewDespesas" element={<LancamentosPrevistos />} />
            <Route path="planejamentos/createEdit/tipo/:tipo" element={<PorEndereco><PlanejamentoForm /></PorEndereco>} />
            <Route path="planejamentos/createEdit/transformar/:idMovimentacao" element={<PorEndereco><PlanejamentoForm /></PorEndereco>} />
            <Route path="planejamentos/createEdit/:id" element={<PorEndereco><PlanejamentoForm /></PorEndereco>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
