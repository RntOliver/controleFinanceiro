import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Dashboard({ token, usernameLogado, isAdmin, onLogout }) {
  const [nome, setNome] = useState("");
  const [salario, setSalario] = useState("");
  const [despesa, setDespesa] = useState("");
  const [transacoes, setTransacoes] = useState([]);
  const [usuarioFiltrado, setUsuarioFiltrado] = useState(null);

  useEffect(() => {
    if (!token) return;

    const carregarDadosDoBanco = async () => {
      try {
        const resposta = await fetch("http://127.0.0.1:8000/transacoes", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resposta.status === 401) {
          onLogout(); // Desloga automaticamente se o token for rejeitado
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

  // 🛠️ FUNÇÕES AUXILIARES DE FORMATAÇÃO
  const formatarMoeda = (valor) => {
    let limpo = valor.replace(/\D/g, "");
    if (!limpo) return "";
    let resultado = (parseFloat(limpo) / 100).toFixed(2);
    resultado = resultado.replace(".", ",");
    resultado = resultado.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return `R$ ${resultado}`;
  };

  const converterParaNumeroPuro = (valorFormatated) => {
    if (!valorFormatated) return 0;
    let limpo = valorFormatated
      .replace("R$ ", "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(limpo) || 0;
  };

  const dadosExibidos = usuarioFiltrado
    ? transacoes.filter((t) => t.nome === usuarioFiltrado)
    : transacoes;

  const calcularMetricas = () => {
    if (dadosExibidos.length === 0) return null;
    const totalReceita = dadosExibidos.reduce((acc, t) => acc + t.salario, 0);
    const totalDespesa = dadosExibidos.reduce((acc, t) => acc + t.despesa, 0);
    const totalLucro = totalReceita - totalDespesa;
    const comprometimentoDespesa =
      totalReceita > 0 ? (totalDespesa / totalReceita) * 100 : 0;
    const margemLucro =
      totalReceita > 0 ? (totalLucro / totalReceita) * 100 : 0;

    return {
      totalReceita,
      totalDespesa,
      totalLucro,
      comprometimentoDespesa: comprometimentoDespesa.toFixed(1),
      margemLucro: margemLucro.toFixed(1),
    };
  };

  const metricas = calcularMetricas();

  // 🛠️ OPERAÇÕES FINANCEIRAS PROTEGIDAS
  const adicionarTransacao = async () => {
    if (!nome.trim()) {
      alert("⚠️ Digite o nome do cliente antes de registrar!");
      return;
    }

    const valorSalario = converterParaNumeroPuro(salario);
    const valorDespesa = converterParaNumeroPuro(despesa);

    try {
      const resposta = await fetch("http://127.0.0.1:8000/calcular", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nome,
          salario: valorSalario,
          despesa: valorDespesa,
        }),
      });

      if (!resposta.ok) {
        alert("Sua sessão expirou ou os dados são inválidos.");
        return;
      }

      const dadosRecebidos = await resposta.json();
      setTransacoes([...transacoes, dadosRecebidos]);
      setNome("");
      setSalario("");
      setDespesa("");
    } catch (error) {
      console.error("Erro ao lançar dados", error);
    }
  };

  const excluirTransacao = async (idParaRemover, indexNoReact) => {
    try {
      const resposta = await fetch(
        `http://127.0.0.1:8000/transacoes/${idParaRemover}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!resposta.ok) {
        alert("Não autorizado ou registro inexistente.");
        return;
      }

      const listaAtualizada = transacoes.filter(
        (_, index) => index !== indexNoReact,
      );
      setTransacoes(listaAtualizada);
      setUsuarioFiltrado(null);
    } catch (error) {
      console.error("Erro ao deletar item:", error);
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="perfil-usuario">
          <div className="avatar">
            {usernameLogado.substring(0, 1).toUpperCase()}
          </div>
          <h3>{usernameLogado.toUpperCase()}</h3>
          <p>{isAdmin ? "👑 DIRETOR ADM" : "👤 CLIENTE RNT"}</p>
        </div>
        <nav className="menu-lateral">
          <span className="ativo">DASHBOARD</span>
          <span>CONTAS</span>
          <span>METAS</span>
          <span>GRÁFICOS</span>
          <span>RELATÓRIOS</span>
        </nav>
        <button className="botao-logout" onClick={onLogout}>
          🚪 SAIR DO SISTEMA
        </button>
      </aside>

      <main className="conteudo-principal">
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
          <div className="bloco-grafico-real">
            <h3>Comparativo de Receitas x Despesas</h3>
            <div style={{ width: "100%", height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosExibidos}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="nome"
                    stroke="#64748b"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                  <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                  <Bar
                    dataKey="salario"
                    name="Receita (R$)"
                    fill="#27ae60"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="despesa"
                    name="Despesa (R$)"
                    fill="#e74c3c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {metricas && (
              <div className="bloco-estatisticas-dinamico">
                <p>
                  📊{" "}
                  {usuarioFiltrado
                    ? `Análise de ${usuarioFiltrado}:`
                    : isAdmin
                      ? "Balanço Geral de Todos os Clientes:"
                      : "Análise Geral das Minhas Finanças:"}{" "}
                  Os gastos atuais comprometem{" "}
                  <strong>{metricas.comprometimentoDespesa}%</strong> do
                  orçamento total. A margem de lucro operacional é de{" "}
                  <strong
                    className={
                      metricas.totalLucro >= 0
                        ? "texto-verde"
                        : "texto-vermelho"
                    }
                  >
                    {metricas.margemLucro}%
                  </strong>
                  .
                </p>
                <div className="mini-resumo-valores">
                  <span>Balancete Geral: </span>
                  <span className="texto-verde">
                    Receitas: R$ {metricas.totalReceita.toFixed(2)}
                  </span>
                  {" | "}
                  <span className="texto-vermelho">
                    Despesas: R$ {metricas.totalDespesa.toFixed(2)}
                  </span>
                  {" | "}
                  <span
                    className={
                      metricas.totalLucro >= 0
                        ? "texto-verde"
                        : "texto-vermelho"
                    }
                  >
                    Sobra: R$ {metricas.totalLucro.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="bloco-formulario">
              <h3>Novo lançamento</h3>
              <div className="formulario-inputs">
                <input
                  placeholder="Nome do cliente"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Valor da receita"
                  value={salario}
                  onChange={(e) => setSalario(formatarMoeda(e.target.value))}
                />
                <input
                  type="text"
                  placeholder="Valor da despesa"
                  value={despesa}
                  onChange={(e) => setDespesa(formatarMoeda(e.target.value))}
                />
                <button onClick={adicionarTransacao}>REGISTRAR</button>
              </div>
            </div>
          )}
        </div>

        <footer>
          <div className="titulo-historico-container">
            <h3>
              {isAdmin
                ? "Banco de Dados Global de Clientes"
                : "Meu Histórico de Lançamentos"}
            </h3>
            {isAdmin && (
              <span className="dica-clique">
                * Clique na linha de um cliente para isolar a auditoria dele no
                gráfico
              </span>
            )}
          </div>

          <div className="tabela-fake">
            {dadosExibidos.length === 0 ? (
              <p
                style={{
                  color: "#64748b",
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                Nenhum registro encontrado no momento.
              </p>
            ) : (
              dadosExibidos.map((t, index) => (
                <div
                  key={index}
                  className={`linha-tabela ${usuarioFiltrado ? "linha-focada" : ""} ${isAdmin ? "linha-admin-clicavel" : ""}`}
                  onClick={() => isAdmin && setUsuarioFiltrado(t.nome)}
                  title={isAdmin ? "Clique para auditar este cliente" : ""}
                >
                  <span>
                    <strong>{t.nome}</strong>
                  </span>
                  <span>Receita: R$ {t.salario.toFixed(2)}</span>
                  <span>Despesa: R$ {t.despesa.toFixed(2)}</span>
                  <span
                    className={
                      t.Lucro >= 0 ? "lucro-positivo" : "lucro-negativo"
                    }
                  >
                    Lucro: R$ {t.Lucro.toFixed(2)}
                  </span>

                  <button
                    className="botao-excluir"
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirTransacao(t.id, index);
                    }}
                    title="Excluir Lançamento"
                  >
                    ❌
                  </button>
                </div>
              ))
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
