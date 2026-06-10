import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./componentes/Login";
import Dashboard from "./componentes/HomeDashboard";
import "./App.css";

// Componentes "Dummy" temporários para a aplicação não quebrar enquanto criamos os arquivos reais
const Contas = () => (
  <div style={{ padding: "20px", color: "#fff" }}>
    <h2>👑 Painel de Gerenciamento de Usuários (Contas)</h2>
    <p>Em breve: Ativação, exclusão e alteração de cargos.</p>
  </div>
);
const Metas = () => (
  <div style={{ padding: "20px", color: "#fff" }}>
    <h2>🎯 Metas Financeiras</h2>
    <p>Em breve: Definição de objetivos integrados ao banco de dados.</p>
  </div>
);
const Graficos = () => (
  <div style={{ padding: "20px", color: "#fff" }}>
    <h2>📈 Gráficos Avançados</h2>
    <p>Em breve: Novas visões analíticas de receitas e despesas.</p>
  </div>
);
const Relatorios = () => (
  <div style={{ padding: "20px", color: "#fff" }}>
    <h2>📋 Relatórios e Balancetes</h2>
    <p>Em breve: Exportação de dados e relatórios gerenciais.</p>
  </div>
);

// Componente auxiliar para herdar a lógica do gráfico atual do Dashboard
const HomeDashboard = () => (
  <div style={{ color: "#fff", padding: "10px" }}>
    {/* Relaxa! No próximo passo já vamos mover o gráfico original para cá para o centro da tela ficar perfeito */}
    <p>O conteúdo original do seu gráfico e formulário aparecerá aqui.</p>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem("rnt_token") || null);
  const [usernameLogado, setUsernameLogado] = useState(
    localStorage.getItem("rnt_user") || "",
  );
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("rnt_is_admin") === "true",
  );

  const efetuadoLogin = (novoToken, usuario, adminStatus) => {
    localStorage.setItem("rnt_token", novoToken);
    localStorage.setItem("rnt_user", usuario);
    localStorage.setItem("rnt_is_admin", adminStatus);
    setToken(novoToken);
    setUsernameLogado(usuario);
    setIsAdmin(adminStatus);
  };

  const efetuarLogout = () => {
    localStorage.removeItem("rnt_token");
    localStorage.removeItem("rnt_user");
    localStorage.removeItem("rnt_is_admin");
    setToken(null);
    setUsernameLogado("");
    setIsAdmin(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA DE LOGIN: Se já tiver token, joga direto para o dashboard */}
        <Route
          path="/login"
          element={
            !token ? (
              <Login onLoginSuccess={efetuadoLogin} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {/* ROTAS PROTEGIDAS (DASHBOARD LAYOUT): Se não tiver token, barra e joga pro login */}
        <Route
          path="/"
          element={
            token ? (
              <Dashboard
                token={token}
                usernameLogado={usernameLogado}
                isAdmin={isAdmin}
                onLogout={efetuarLogout}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          {/* Sub-rotas que vão renderizar DENTRO do Dashboard */}
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<HomeDashboard />} />
          <Route path="metas" element={<Metas />} />
          <Route path="graficos" element={<Graficos />} />
          <Route path="relatorios" element={<Relatorios />} />

          {/* 🔒 PROTEÇÃO DE ROTA NÍVEL ADMIN: Se não for admin, bloqueia e redireciona */}
          <Route
            path="contas"
            element={isAdmin ? <Contas /> : <Navigate to="/dashboard" />}
          />
        </Route>

        {/* ROTA CORINGA: Qualquer endereço bizarro joga para o dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
