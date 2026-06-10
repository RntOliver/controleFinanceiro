import { Link, Outlet, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard({ usernameLogado, isAdmin, onLogout }) {
  const location = useLocation();

  return (
    // Essa classe principal mantém o seu Flexbox ou Grid original do layout
    <div className="dashboard-container">
      {/* MENU LATERAL FIXO */}
      <aside className="sidebar">
        <div className="perfil-usuario">
          <div className="avatar">
            {usernameLogado.substring(0, 1).toUpperCase()}
          </div>
          <h3>{usernameLogado.toUpperCase()}</h3>
          <p>{isAdmin ? "👑 DIRETOR ADM" : "👤 CLIENTE RNT"}</p>
        </div>

        <nav className="menu-lateral">
          <Link
            to="/dashboard"
            className={location.pathname === "/dashboard" ? "ativo" : ""}
          >
            DASHBOARD
          </Link>
          {isAdmin && (
            <Link
              to="/contas"
              className={location.pathname === "/contas" ? "ativo" : ""}
            >
              CONTAS
            </Link>
          )}
          <Link
            to="/metas"
            className={location.pathname === "/metas" ? "ativo" : ""}
          >
            METAS
          </Link>
          <Link
            to="/graficos"
            className={location.pathname === "/graficos" ? "ativo" : ""}
          >
            GRÁFICOS
          </Link>
          <Link
            to="/relatorios"
            className={location.pathname === "/relatorios" ? "ativo" : ""}
          >
            RELATÓRIOS
          </Link>
        </nav>

        <button className="botao-logout" onClick={onLogout}>
          🚪 SAIR
        </button>
      </aside>

      {/* ÁREA DA DIREITA: Onde as telas de verdade vão se espalhar */}
      {/* Certifique-se de que a classe "conteudo-principal" tenha a estilização de espaçamento/largura ideal no seu CSS */}
      <main className="conteudo-principal">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
