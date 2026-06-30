import { useState } from "react";
import "../styles/Metas.css";

export default function Metas() {
    const [metas, setMetas] = useState([
        {id: 1, nome: "Viagem", alvo: 15000, prazo:"12 meses", status: "ativo"},
        {id: 2, nome: "Compra de Casa", alvo: 100000, prazo:"48 meses", status: "ativo"}
    ]);

    const [novaMeta, setNovaMeta] = useState({ 
        nome: "", alvo: "", prazo: "" 
    });

    //Calculo sobre o progresso da meta
    const calcularProgresso = (meta) => {
        const progresso = (meta.alvo / 15000) * 100 //exemplo de calculo
        return progresso > 100 ? 100 : progresso;
    };

    const adicionarAporte = () => {
        const aporte = parseFloat(prompt("Digite o valor do aporte: R$"));
        if (!isNaN(aporte) && aporte > 0) {
            const metaAtualizada = metas.map(meta => {
                if (meta.id === 1) { // Exemplo: adicionando aporte à primeira meta
                    return { ...meta, alvo: meta.alvo - aporte };
                }
                return meta;
            });
            setMetas(metaAtualizada);
        }
    };

    const criarMeta = (e) => {
        e.preventDefault();
        const nova = {
            ...novaMeta,
            id: Date.now(),
            alvo: parseFloat(novaMeta.alvo),
            atual: parseFloat(novaMeta.atual),
            status: "ativa"
        };
        setMetas([...metas, nova]);
        setNovaMeta({ nome: "", alvo: "", atua: "", prazo: "" });
    };

    return (
      <div className="metas-container">
        <header className="metas-header">
          <h2>Minha Metas</h2>
          <p>
            Transforme suas metas em realidade e veja seu progresso sempre
            aumentar.
          </p>
        </header>

        {/* FOMRULARIO DE CRIAÇÃO */}
        <section className="secao-metas">
          <h3>Nova Meta</h3>
          <form onSubmit={criarMeta} className="metas-form">
            <input
              type="text"
              placeholder="Nome da Meta (ex: trocar de carro)"
              value={novaMeta.nome}
              onChange={(e) =>
                setNovaMeta({ ...novaMeta, nome: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Alvo (R$)"
              value={novaMeta.alvo}
              onChange={(e) =>
                setNovaMeta({ ...novaMeta, alvo: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Já tenho poupado (R$)"
              value={novaMeta.atual}
              onChange={(e) =>
                setNovaMeta({ ...novaMeta, atual: e.target.value })
              }
            />

            <input
              type="month"
              value={novaMeta.prazo}
              onChange={(e) =>
                setNovaMeta({ ...novaMeta, prazo: e.target.value })
              }
            />

            <button type="submit" className="btn-criar-meta">
              Criar meta
            </button>
          </form>
        </section>

        {/* METAS ATIVAS */}
        <section className="secao-metas">
          {metas
            .filter((m) => m.status === "ativa")
            .map((meta) => {
              const progresso = calcularProgresso(meta.atual, meta.alvo);
              return (
                <div key={meta.id} className="meta-card">
                  <div className="meta-info">
                    <h4>{meta.nome}</h4>
                    <span className="meta-prazo">
                      {meta.prazo} ? `Limite: {meta.prazo}` :{" "}
                      {"Sem prazo definido"}
                    </span>
                  </div>

                  <div className="meta-valores">
                    <span>R$ {meta.atual.toLocaleString()}</span>
                    <span>R$ {meta.alvo.toLocaleString()}</span>
                  </div>

                  <div
                    className="meta-progresso"
                    style={{ width: `${progresso}%` }}
                  >
                    {progresso}%
                  </div>

                  <div className="meta-acoes">
                    <button
                      onClick={() => adicionarAporte(meta.id)}
                      className="btn-aporte"
                    >
                      💰 Poupar
                    </button>
                    <button className="btn-interromper">🛑 Parar</button>
                  </div>
                </div>
              );
            })}
        </section>

        {/* HISTÓRICO */}
        <section className="metas-historico">
          <h3>📜 Histórico de Metas</h3>
          <div className="historico-lista">
            {metas.filter((m) => m.status !== "ativa").map((meta) => (
                <div key={meta.id} className={`historico-item ${meta.status}`}>
                  <span>{meta.nome}</span>

                  <span className="status-badge">
                    {meta.status === "concluida" ? "✅ Alcançada" : "❌ Interrompida"}
                  </span>

                  <span>R$ {meta.alvo.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    );
}