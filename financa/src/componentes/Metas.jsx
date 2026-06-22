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
    const calculoProgresso = (meta) => {
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
    }
}