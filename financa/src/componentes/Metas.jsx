import { useState, useEffect, useCallback } from "react";
import "./Metas.css";

const API_URL = "https://rnt-finance-backend.onrender.com/metas";

// Formata número para moeda brasileira
const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null || valor === "") return "";
  const apenasNumeros = String(valor).replace(/\D/g, "");
  if (!apenasNumeros) return "";
  const opcoes = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `R$ ${new Intl.NumberFormat("pt-BR", opcoes).format(apenasNumeros / 100)}`;
};

const converterParaFloat = (valorFormatado) => {
  if (!valorFormatado) return 0.0;
  const limpo = valorFormatado
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  return parseFloat(limpo) || 0.0;
};

// Apenas os textos de exibição ficaram aqui. As cores foram para o CSS!
const STATUS_LABELS = {
  ativa: "Em andamento",
  concluida: "Concluída ✓",
  interrompida: "Interrompida",
};

export default function Metas({ token }) {
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Estados do formulário de criação
  const [nome, setNome] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [criando, setCriando] = useState(false);

  // Controla o valor de aporte de cada card individualmente
  const [valorAporte, setValorAporte] = useState({});

  // ── Carregar metas do back-end ──
  const carregarMetas = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const dados = await response.json();
        setMetas(dados);
      }
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) carregarMetas();
  }, [token, carregarMetas]);

  // ── Criar nova meta ──
  const handleCriarMeta = async (e) => {
    e.preventDefault();
    const valorNumerico = converterParaFloat(valorAlvo);

    if (!nome.trim()) {
      setErro("O nome da meta é obrigatório.");
      return;
    }
    if (valorNumerico <= 0) {
      setErro("Informe um valor alvo maior que R$ 0,00.");
      return;
    }

    setCriando(true);
    setErro("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nome.trim(),
          valor_alvo: valorNumerico,
          valor_atual: 0.0,
          prazo: prazo || null,
        }),
      });

      if (response.ok) {
        setNome("");
        setValorAlvo("");
        setPrazo("");
        carregarMetas();
      } else {
        const data = await response.json();
        setErro(data.detail || "Erro ao criar meta.");
      }
    } catch (error) {
      setErro("Erro de conexão com o servidor.");
      console.error(error);
    } finally {
      setCriando(false);
    }
  };

  // ── Fazer aporte em uma meta ──
  const handleFazerAporte = async (idMeta) => {
    const valor = converterParaFloat(valorAporte[idMeta] || "");
    if (!valor || valor <= 0) return;

    try {
      const response = await fetch(`${API_URL}/${idMeta}/aporte`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ valor }),
      });

      if (response.ok) {
        setValorAporte({ ...valorAporte, [idMeta]: "" });
        carregarMetas();
      }
    } catch (error) {
      console.error("Erro ao fazer aporte:", error);
    }
  };

  // ── Deletar uma meta ──
  const handleDeletarMeta = async (idMeta) => {
    if (!window.confirm("Tem certeza que deseja excluir esta meta?")) return;

    try {
      const response = await fetch(`${API_URL}/${idMeta}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) carregarMetas();
    } catch (error) {
      console.error("Erro ao deletar meta:", error);
    }
  };

  if (carregando) {
    return (
      <div className="metas-container">
        <p className="metas-carregando">Carregando suas metas...</p>
      </div>
    );
  }

  return (
    <div className="metas-container animacao-entrada">
      {/* ── CABEÇALHO ── */}
      <div className="metas-topo">
        <div>
          <h2>Metas de Economia</h2>
          <p>Defina objetivos, acompanhe o progresso e conquiste suas metas.</p>
        </div>
        <div className="metas-resumo-topo">
          <div className="resumo-topo-item">
            <span>{metas.length}</span>
            <label>Total</label>
          </div>
          <div className="resumo-topo-item destaque-verde">
            <span>{metas.filter((m) => m.status === "concluida").length}</span>
            <label>Concluídas</label>
          </div>
          <div className="resumo-topo-item destaque-laranja">
            <span>{metas.filter((m) => m.status === "ativa").length}</span>
            <label>Em andamento</label>
          </div>
        </div>
      </div>

      {/* ── FORMULÁRIO DE CRIAÇÃO ── */}
      <div className="metas-form-card">
        <h3>🎯 Nova Meta</h3>
        {erro && <p className="metas-erro">⚠️ {erro}</p>}
        <form onSubmit={handleCriarMeta} className="metas-form-grid">
          <div className="campo-grupo">
            <label>Nome da meta</label>
            <input
              type="text"
              placeholder="Ex: Reserva de emergência, Viagem..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="campo-grupo">
            <label>Valor alvo</label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={valorAlvo}
              onChange={(e) => setValorAlvo(formatarMoeda(e.target.value))}
              required
            />
          </div>

          <div className="campo-grupo">
            <label>Prazo (opcional)</label>
            <input
              type="month"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-criar-meta" disabled={criando}>
            {criando ? "Criando..." : "Adicionar Meta"}
          </button>
        </form>
      </div>

      {/* ── LISTA DE CARDS DE METAS ── */}
      {metas.length === 0 ? (
        <div className="metas-vazio">
          <p>🎯 Você ainda não tem metas cadastradas.</p>
          <span>Use o formulário acima para criar sua primeira meta!</span>
        </div>
      ) : (
        <div className="metas-grid">
          {metas.map((meta) => {
            const porcentagem = Math.min(
              (meta.valor_atual / meta.valor_alvo) * 100,
              100,
            ).toFixed(1);

            const falta = Math.max(meta.valor_alvo - meta.valor_atual, 0);

            return (
              <div key={meta.id} className={`card-meta status-${meta.status}`}>
                {/* Cabeçalho do card */}
                <div className="card-meta-header">
                  <h4>{meta.nome}</h4>
                  <button
                    className="btn-deletar-meta"
                    onClick={() => handleDeletarMeta(meta.id)}
                    title="Excluir meta"
                  >
                    🗑️
                  </button>
                </div>

                {/* Valores */}
                <div className="card-meta-valores">
                  <span className="valor-atual">
                    R$ {meta.valor_atual.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="valor-separador">de</span>
                  <span className="valor-alvo">
                    R$ {meta.valor_alvo.toFixed(2).replace(".", ",")}
                  </span>
                </div>

                {/* Barra de progresso — Cor injetada dinamicamente via classe no CSS */}
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${porcentagem}%` }}
                  />
                </div>

                <div className="card-meta-rodape-progresso">
                  <span>{porcentagem}% concluído</span>
                  {meta.status === "ativa" && (
                    <span className="falta-valor">
                      Falta: R$ {falta.toFixed(2).replace(".", ",")}
                    </span>
                  )}
                </div>

                {/* Prazo e status */}
                <div className="card-meta-info">
                  {meta.prazo && (
                    <span className="meta-prazo">📅 {meta.prazo}</span>
                  )}
                  <span className="meta-status-badge">
                    {STATUS_LABELS[meta.status] || STATUS_LABELS.ativa}
                  </span>
                </div>

                {/* Área de aporte */}
                {meta.status === "ativa" && (
                  <div className="card-meta-aporte">
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      value={valorAporte[meta.id] || ""}
                      onChange={(e) =>
                        setValorAporte({
                          ...valorAporte,
                          [meta.id]: formatarMoeda(e.target.value),
                        })
                      }
                    />
                    <button onClick={() => handleFazerAporte(meta.id)}>
                      Depositar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
