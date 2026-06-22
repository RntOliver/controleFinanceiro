import { useState } from "react";

function FormularioGasto({ token, transacoes, setTransacoes }) {
  const [mes, setMes] = useState("");
  const [dia, setDia] = useState("");
  const [despesa, setDespesa] = useState("");

  const formatarMoeda = (valor) => {
    let limpo = valor.replace(/\D/g, "");
    if (!limpo) return "";
    let resultado = (parseFloat(limpo) / 100).toFixed(2).replace(".", ",");
    resultado = resultado.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return `R$ ${resultado}`;
  };

  const converterParaNumeroPuro = (valorFormatado) => {
    if (!valorFormatado) return 0;
    let limpo = valorFormatado
      .replace("R$ ", "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(limpo) || 0;
  };

  const adicionarTransacao = async () => {
    if (!mes.trim() || !dia.trim()) {
      alert("⚠️ Preencha o mês e o dia do gasto!");
      return;
    }

    const valorDespesa = converterParaNumeroPuro(despesa);

    try {
      const resposta = await fetch(
        "rnt-finance-backend.onrender.com/calcular",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mes: mes,
            dia: parseInt(dia),
            despesa: valorDespesa,
          }),
        },
      );

      if (!resposta.ok) {
        alert("Erro ao registrar o gasto diário.");
        return;
      }

      const dadosRecebidos = await resposta.json();
      setTransacoes([...transacoes, dadosRecebidos]);
      setDia("");
      setDespesa("");
    } catch (error) {
      console.error("Erro ao lançar dados", error);
    }
  };

  return (
    <div className="bloco-formulario">
      <h3>Lançamento de Gasto Diário</h3>
      <div className="formulario-inputs">
        <select value={mes} onChange={(e) => setMes(e.target.value)}>
          <option value="">Selecione o Mês</option>
          <option value="JANEIRO">Janeiro</option>
          <option value="FEVEREIRO">Fevereiro</option>
          <option value="MARÇO">Março</option>
          <option value="ABRIL">Abril</option>
          <option value="MAIO">Maio</option>
          <option value="JUNHO">Junho</option>
          <option value="JULHO">Julho</option>
          <option value="AGOSTO">Agosto</option>
          <option value="SETEMBRO">Setembro</option>
          <option value="OUTUBRO">Outubro</option>
          <option value="NOVEMBRO">Novembro</option>
          <option value="DEZEMBRO">Dezembro</option>
        </select>

        <input
          type="number"
          placeholder="Dia (ex: 15)"
          min="1"
          max="31"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
        />

        <input
          type="text"
          placeholder="Valor gasto (R$)"
          value={despesa}
          onChange={(e) => setDespesa(formatarMoeda(e.target.value))}
        />

        <button onClick={adicionarTransacao}>REGISTRAR GASTO</button>
      </div>
    </div>
  );
}

export default FormularioGasto;
