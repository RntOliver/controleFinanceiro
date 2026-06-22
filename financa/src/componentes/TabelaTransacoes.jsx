function TabelaTransacoes({
  dadosExibidos,
  isAdmin,
  usuarioFiltrado,
  setUsuarioFiltrado,
  token,
  transacoes,
  setTransacoes,
}) {
  const excluirTransacao = async (idParaRemover) => {
    if (!confirm("⚠️ Deseja realmente excluir este registro global?")) return;

    try {
      const resposta = await fetch(
        `https://rnt-finance-backend.onrender.com/transacoes/${idParaRemover}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!resposta.ok) {
        alert("Não autorizado ou registro inexistente.");
        return;
      }

      const listaAtualizada = transacoes.filter((t) => t.id !== idParaRemover);
      setTransacoes(listaAtualizada);
      setUsuarioFiltrado(null);
    } catch (error) {
      console.error("Erro ao deletar item:", error);
    }
  };

  return (
    <footer>
      <h3>{isAdmin ? "Banco de Dados Global" : "Meu Histórico"}</h3>
      <div className="tabela-fake">
        {dadosExibidos.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
            Nenhum registro encontrado.
          </p>
        ) : (
          dadosExibidos.map((t, index) => (
            <div
              key={t.id || index}
              className={`linha-tabela ${usuarioFiltrado ? "linha-focada" : ""} ${isAdmin ? "linha-admin-clicavel" : ""}`}
              onClick={() => isAdmin && setUsuarioFiltrado(t.nome)}
            >
              <span>
                <strong>👤 {t.nome}</strong>
              </span>
              <span>
                📅 {t.dia} de {t.mes}
              </span>
              <span className="texto-vermelho">
                💸 Gastou: R$ {t.despesa?.toFixed(2)}
              </span>
              <span
                className={
                  t.salario - t.despesa >= 0
                    ? "lucro-positivo"
                    : "texto-vermelho"
                }
              >
                💰 Sobra: R$ {(t.salario - t.despesa).toFixed(2)}
              </span>

              <button
                className="botao-excluir"
                onClick={(e) => {
                  e.stopPropagation();
                  excluirTransacao(t.id);
                }}
              >
                ❌
              </button>
            </div>
          ))
        )}
      </div>
    </footer>
  );
}

export default TabelaTransacoes;
