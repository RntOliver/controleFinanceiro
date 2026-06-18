import { useState } from "react";
import "../styles/Perfil.css";

export default function Perfil({ token, usuarioLogado }) {
  // Estado isolado para o formulário
  const [perfil, setPerfil] = useState({
    nomeCompleto: "",
    profissao: "",
    salarioBase: "",
    metaEconomia: "",
    email: "",
    telefone: "",
    fotoPerfil: "",
  });

  // Função para capturar a digitação
  const mudancaPerfil = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  // Função para salvar os dados no backend
  const salvarPerfil = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://rnt-finance-backend.onrender.com/perfil",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome_completo: perfil.nomeCompleto,
            profissao: perfil.profissao,
            salario_base: parseFloat(perfil.salarioBase) || 0,
            meta_economia: parseFloat(perfil.metaEconomia) || 0,
            email: perfil.email,
            telefone: perfil.telefone,
            foto_perfil: perfil.fotoPerfil,
          }),
        },
      );

      if (response.ok) {
        alert("✅ Perfil atualizado com sucesso!");
      } else {
        alert("❌ Erro ao atualizar o perfil.");
      }
    } catch (error) {
      console.error("Erro ao salvar o perfil:", error);
    }
  };

  return (
    <div className="perfil-container animacao-entrada">
      <div className="perfil-topo">
        <div className="perfil-conteudo">
          <h2>Meu Perfil</h2>
          <p>
            Seja bem-vindo! Gerencie aqui suas informações pessoais e
            financeiras para alcançar suas metas de economia.
          </p>
        </div>
      </div>

      {/* LADO ESQUERDO: CARTÃO DE VISITA */}
      <div className="perfil-layout">
        <div className="perfil-cartao">
          <div className="perfil-avatar">
            {usuarioLogado?.username?.substring(0, 2).toUpperCase()}
          </div>
          <h3>{usuarioLogado?.username?.toUpperCase()}</h3>
          {usuarioLogado?.is_admin ? (
            <span className="perfil-admin">ADMINISTRADOR</span>
          ) : (
            <span className="perfil-usuario">USUÁRIO</span>
          )}
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <form className="formulario-inputs" onSubmit={salvarPerfil}>
          <div className="grupo-formulario">
            <label>Nome completo</label>
            <input
              type="text"
              name="nomeCompleto"
              value={perfil.nomeCompleto}
              onChange={mudancaPerfil}
              placeholder="Digite seu nome completo"
            />

            <label>Profissão</label>
            <input
              type="text"
              name="profissao"
              value={perfil.profissao}
              onChange={mudancaPerfil}
              placeholder="Digite sua profissão"
            />

            <label>Salário Base</label>
            <input
              type="number"
              name="salarioBase"
              value={perfil.salarioBase}
              onChange={mudancaPerfil}
              placeholder="Digite seu salário base"
            />

            <label>Meta de Economia</label>
            <input
              type="number"
              name="metaEconomia"
              value={perfil.metaEconomia}
              onChange={mudancaPerfil}
              placeholder="Digite sua meta de economia"
            />

            <label>E-mail</label>
            <input
              type="email"
              name="email"
              value={perfil.email}
              onChange={mudancaPerfil}
              placeholder="seu-email@dominio.com"
            />

            <label>Telefone</label>
            <input
              type="text"
              name="telefone"
              value={perfil.telefone}
              onChange={mudancaPerfil}
              placeholder="(00) 00000-0000"
            />
          </div>

          <button type="submit">Salvar alterações</button>
        </form>
      </div>
    </div>
  );
}
