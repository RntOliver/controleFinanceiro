
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

function GraficoComparativo({ dadosExibidos, metricas }) {
  return (
    <div className="bloco-grafico-real">
      <h3>Comparativo de Receitas x Despesas</h3>
      <div style={{ width: "100%", height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dadosExibidos}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="nome" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
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
            📊 Gastos comprometem{" "}
            <strong>{metricas.comprometimentoDespesa}%</strong> do orçamento.
            Margem:{" "}
            <strong
              className={
                parseFloat(metricas.totalLucro) >= 0
                  ? "texto-verde"
                  : "texto-vermelho"
              }
            >
              {metricas.margemLucro}%
            </strong>
            .
          </p>
          <div className="mini-resumo-valores">
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
                metricas.totalLucro >= 0 ? "texto-verde" : "texto-vermelho"
              }
            >
              Sobra: R$ {metricas.totalLucro.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GraficoComparativo;
