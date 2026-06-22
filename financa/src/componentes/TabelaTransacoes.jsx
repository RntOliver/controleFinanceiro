import { useState } from "react";

function TabelaTransacoes({
  dadosExibidos,
  isAdmin,
  setUsuarioFiltrado,
  token,
  transacoes,
  setTransacoes,
}) {
  // Controla quais cards de cliente estão expandidos
  // É um Set (conjunto) de nomes — se o nome estiver no Set, o card está aberto
  const [clientesAbertos, setClientesAbertos] = useState(new Set());

  const toggleCliente = (nome) => {
    setClientesAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(nome)) {
        novo.delete(nome); // estava aberto → fecha
      } else {
        novo.add(nome); // estava fechado → abre
      }
      return novo;
    });
  };

  const excluirTransacao = async (idParaRemover) => {
    if (!confirm("⚠️ Deseja realmente excluir este registro?")) return;

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

  // ─── VISÃO DO CLIENTE (não-admin): lista simples de lançamentos ───
  if (!isAdmin) {
    return (
      <section className="secao-historico">
        <h3 className="titulo-historico">Meu Histórico</h3>

        {dadosExibidos.length === 0 ? (
          <p className="estado-vazio">
            Nenhum registro encontrado. Registre seu primeiro gasto acima!
          </p>
        ) : (
          <div className="lista-lancamentos">
            {dadosExibidos.map((t, index) => (
              <div key={t.id || index} className="linha-lancamento">
                <span className="lancamento-data">
                  📅 {t.dia} de {t.mes}
                </span>
                <span className="lancamento-gasto texto-vermelho">
                  💸 Gastou: R$ {t.despesa?.toFixed(2).replace(".", ",")}
                </span>
                <span
                  className={
                    t.salario - t.despesa >= 0
                      ? "lancamento-sobra lucro-positivo"
                      : "lancamento-sobra texto-vermelho"
                  }
                >
                  💰 Sobra: R${" "}
                  {(t.salario - t.despesa).toFixed(2).replace(".", ",")}
                </span>
                <button
                  className="botao-excluir"
                  onClick={() => excluirTransacao(t.id)}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ─── VISÃO DO ADMIN: agrupa os lançamentos por cliente ───

  // Reduz a lista plana num objeto { "NOME": [lancamento1, lancamento2, ...] }
  const clientesAgrupados = dadosExibidos.reduce((grupo, transacao) => {
    const nome = transacao.nome;
    if (!grupo[nome]) grupo[nome] = [];
    grupo[nome].push(transacao);
    return grupo;
  }, {});

  const nomesDosClientes = Object.keys(clientesAgrupados);

  return (
    <section className="secao-historico">
      <h3 className="titulo-historico">Banco de Dados Global</h3>

      {nomesDosClientes.length === 0 ? (
        <p className="estado-vazio">Nenhum registro encontrado.</p>
      ) : (
        <div className="lista-cards-clientes">
          {nomesDosClientes.map((nome) => {
            const lancamentos = clientesAgrupados[nome];
            const estaAberto = clientesAbertos.has(nome);

            // Calcula os totais do cliente para exibir no cabeçalho do card
            const totalGasto = lancamentos.reduce(
              (acc, t) => acc + (t.despesa || 0),
              0,
            );
            const totalSobra = lancamentos.reduce(
              (acc, t) => acc + (t.salario - t.despesa),
              0,
            );
            const qtdLancamentos = lancamentos.length;

            return (
              <div key={nome} className="card-cliente">
                {/* ── Cabeçalho clicável do card ── */}
                <div
                  className="card-cliente-cabecalho"
                  onClick={() => toggleCliente(nome)}
                >
                  <div className="card-cliente-identidade">
                    <div className="card-cliente-avatar">{nome.charAt(0)}</div>
                    <span className="card-cliente-nome">{nome}</span>
                  </div>

                  <div className="card-cliente-resumo">
                    <div className="resumo-item">
                      <span className="resumo-label">Lançamentos</span>
                      <span className="resumo-valor">{qtdLancamentos}</span>
                    </div>
                    <div className="resumo-item">
                      <span className="resumo-label">Total Gasto</span>
                      <span className="resumo-valor texto-vermelho">
                        R$ {totalGasto.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <div className="resumo-item">
                      <span className="resumo-label">Total Sobra</span>
                      <span
                        className={`resumo-valor ${
                          totalSobra >= 0 ? "lucro-positivo" : "texto-vermelho"
                        }`}
                      >
                        R$ {totalSobra.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <span className="card-chevron">
                      {estaAberto ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* ── Lista de lançamentos (só aparece quando o card está aberto) ── */}
                {estaAberto && (
                  <div className="card-cliente-lancamentos">
                    {lancamentos.map((t, index) => (
                      <div key={t.id || index} className="linha-lancamento">
                        <span className="lancamento-data">
                          📅 {t.dia} de {t.mes}
                        </span>
                        <span className="lancamento-gasto texto-vermelho">
                          💸 Gastou: R${" "}
                          {t.despesa?.toFixed(2).replace(".", ",")}
                        </span>
                        <span
                          className={
                            t.salario - t.despesa >= 0
                              ? "lancamento-sobra lucro-positivo"
                              : "lancamento-sobra texto-vermelho"
                          }
                        >
                          💰 Sobra: R${" "}
                          {(t.salario - t.despesa).toFixed(2).replace(".", ",")}
                        </span>
                        <button
                          className="botao-excluir"
                          onClick={() => excluirTransacao(t.id)}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TabelaTransacoes;
