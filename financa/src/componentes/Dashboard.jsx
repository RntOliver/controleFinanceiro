import { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import Perfil from "./Perfil";
import Sidebar from "./Sidebar";
import DashboardMain from "./DashboardMain";

function Dashboard({ token, usernameLogado, isAdmin, onLogout }) {
  const [transacoes, setTransacoes] = useState([]);
  const [usuarioFiltrado, setUsuarioFiltrado] = useState(null);
  const [telaAtiva, setTelaAtiva] = useState("dashboard");

  // 🔌 CARREGA OS DADOS DIRETO DO BANCO PYTHON
  useEffect(() => {
    if (!token) return;

    const carregarDadosDoBanco = async () => {
      try {
        const resposta = await fetch("https://rnt-finance-backend.onrender.com/transacoes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resposta.status === 401) {
          onLogout();
          return;
        }

        const dados = await resposta.json();
        setTransacoes(dados);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };
    carregarDadosDoBanco();
  }, [token, onLogout]);

  return (
    <div className="dashboard-container">
      {/* 1. SIDEBAR LATERAL */}
      <Sidebar
        usernameLogado={usernameLogado}
        isAdmin={isAdmin}
        onLogout={onLogout}
        telaAtiva={telaAtiva}
        setTelaAtiva={setTelaAtiva}
      />

      {/* --- CONTEÚDO PRINCIPAL DINÂMICO --- */}
      <main className="conteudo-principal">
        {/* TELA 1: CONTEÚDO DO DASHBOARD */}
        {telaAtiva === "dashboard" && (
          <DashboardMain
            token={token}
            transacoes={transacoes}
            setTransacoes={setTransacoes}
            isAdmin={isAdmin}
            usuarioFiltrado={usuarioFiltrado}
            setUsuarioFiltrado={setUsuarioFiltrado}
          />
        )}

        {/* TELA DE PERFIL */}
        {telaAtiva === "perfil" && (
          <Perfil
            token={token}
            usuarioLogado={{ username: usernameLogado, is_admin: isAdmin }}
          />
        )}

        {/* TELA 2: CONTAS (Exclusivo Admin) */}
        {telaAtiva === "contas" && isAdmin && (
          <div className="animacao-entrada">
            <header className="topo-dashboard">
              <h2>Gerenciamento de Clientes</h2>
              <p>Controle de usuários cadastrados no RNT FINANCE.</p>
            </header>
            <div className="bloco-generico-tela">
              <p>
                ⚠️ Tela em desenvolvimento: Aqui listaremos todos os usuários do
                banco `usuarios`.
              </p>
            </div>
          </div>
        )}

        {/* TELA 3: METAS */}
        {telaAtiva === "metas" && (
          <div className="animacao-entrada">
            <header className="topo-dashboard">
              <h2>Metas Financeiras</h2>
              <p>Planeje seus objetivos de curto, médio e longo prazo.</p>
            </header>
            <div className="bloco-generico-tela">
              <p>🎯 Defina quanto você quer poupar este mês.</p>
            </div>
          </div>
        )}

        {/* TELAS 4 e 5: PLACEHOLDERS */}
        {["graficos", "relatorios"].includes(telaAtiva) && (
          <div className="animacao-entrada">
            <header className="topo-dashboard">
              <h2 style={{ textTransform: "uppercase" }}>{telaAtiva}</h2>
              <p>Módulo de análise profunda em desenvolvimento.</p>
            </header>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
