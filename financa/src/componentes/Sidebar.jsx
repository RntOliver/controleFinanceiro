function Sidebar({
  usernameLogado,
  isAdmin,
  onLogout,
  telaAtiva,
  setTelaAtiva,
}) {
  return (
    <aside className="sidebar">
      <div className="perfil-usuario">
        <div className="avatar">
          {usernameLogado ? usernameLogado.substring(0, 1).toUpperCase() : "U"}
        </div>
        <h3>{usernameLogado ? usernameLogado.toUpperCase() : "USUÁRIO"}</h3>
        <p className={isAdmin ? "badge-admin" : "badge-cliente"}>
          {isAdmin ? "👑 DIRETOR ADM" : "👤 CLIENTE RNT"}
        </p>
      </div>

      <nav className="menu-lateral">
        <span
          className={telaAtiva === "dashboard" ? "ativo" : ""}
          onClick={() => setTelaAtiva("dashboard")}
        >
          DASHBOARD
        </span>

        <span
          className={telaAtiva === "perfil" ? "ativo" : ""}
          onClick={() => setTelaAtiva("perfil")}
        >
          PERFIL
        </span>

        {isAdmin && (
          <span
            className={telaAtiva === "contas" ? "ativo" : ""}
            onClick={() => setTelaAtiva("contas")}
          >
            CONTAS
          </span>
        )}

        <span
          className={telaAtiva === "metas" ? "ativo" : ""}
          onClick={() => setTelaAtiva("metas")}
        >
          METAS
        </span>
        <span
          className={telaAtiva === "graficos" ? "ativo" : ""}
          onClick={() => setTelaAtiva("graficos")}
        >
          GRÁFICOS
        </span>
        <span
          className={telaAtiva === "relatorios" ? "ativo" : ""}
          onClick={() => setTelaAtiva("relatorios")}
        >
          RELATÓRIOS
        </span>
      </nav>

      <button className="botao-logout" onClick={onLogout}>
        🚪 SAIR DO SISTEMA
      </button>
    </aside>
  );
}

export default Sidebar;
