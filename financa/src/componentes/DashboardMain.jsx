
import GraficoComparativo from "./GraficoComparativo";
import FormularioGasto from "./FormularioGasto";
import TabelaTransacoes from "./TabelaTransacoes";

function DashboardMain({
  token,
  transacoes,
  setTransacoes,
  isAdmin,
  usernameLogado,
  usuarioFiltrado,
  setUsuarioFiltrado,
}) {
  const dadosExibidos = usuarioFiltrado
    ? transacoes.filter((t) => t.nome === usuarioFiltrado)
    : transacoes;

  // Cálculo das métricas mantendo sua lógica
  const calcularMetricas = () => {
    if (dadosExibidos.length === 0) return null;
    const totalReceita = dadosExibidos.reduce(
      (acc, t) => acc + (t.salario || 0),
      0,
    );
    const totalDespesa = dadosExibidos.reduce(
      (acc, t) => acc + (t.despesa || 0),
      0,
    );
    const totalLucro = totalReceita - totalDespesa;

    return {
      totalReceita,
      totalDespesa,
      totalLucro,
      comprometimentoDespesa: (totalReceita > 0
        ? (totalDespesa / totalReceita) * 100
        : 0
      ).toFixed(1),
      marginLucro: (totalReceita > 0
        ? (totalLucro / totalReceita) * 100
        : 0
      ).toFixed(1),
    };
  };

  const metricas = calcularMetricas();

  return (
    <div className="home-dashboard-wrapper animacao-entrada">
      <header className="topo-dashboard">
        <div className="info-topo">
          <h2>
            {isAdmin
              ? "Painel de Controle Analítico"
              : "Visão Geral das Finanças"}
          </h2>
          <p>
            {usuarioFiltrado
              ? `Exibindo histórico exclusivo de: ${usuarioFiltrado}`
              : isAdmin
                ? "Visualizando transações de todos os clientes cadastrados"
                : "Controle financeiro permanente (Banco de Dados Ativo)"}
          </p>
        </div>
        {usuarioFiltrado && (
          <button
            className="botao-voltar-filtro"
            onClick={() => setUsuarioFiltrado(null)}
          >
            🔄 Ver Todos os Usuários
          </button>
        )}
      </header>

      <div className={isAdmin ? "grid-central-admin" : "grid-central"}>
        <GraficoComparativo dadosExibidos={dadosExibidos} metricas={metricas} />

        {!isAdmin && (
          <FormularioGasto
            token={token}
            transacoes={transacoes}
            setTransacoes={setTransacoes}
          />
        )}
      </div>

      <TabelaTransacoes
        dadosExibidos={dadosExibidos}
        isAdmin={isAdmin}
        usernameLogado={usernameLogado}
        usuarioFiltrado={usuarioFiltrado}
        setUsuarioFiltrado={setUsuarioFiltrado}
        token={token}
        transacoes={transacoes}
        setTransacoes={setTransacoes}
      />
    </div>
  );
}

export default DashboardMain;
