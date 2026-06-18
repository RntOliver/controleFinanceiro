import { useState } from "react";
import "../styles/Perfil.css";

// Linha 4: Recebendo as props normalmente
export default function Perfil({ token, usuarioLogado }) {
  const [perfil, setPerfil] = useState({
    // 🌟 CORREÇÃO: Usamos o usuarioLogado aqui para iniciar o campo com o nome do usuário!
    nomeCompleto: usuarioLogado || "",
    profissao: "",
    salarioBase: "",
    metaEconomia: "",
    email: "",
    telefone: "",
    fotoPerfil: "",
  });

  const mudancaPerfil = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  // ... resto do seu código igualzinho ...
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

  // Captura a hora atual apenas para efeito visual no layout profissional
  const horaAtual = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="perfil-container animacao-entrada">
      {/* TOPO DA TELA COM INFOS E REFRESH */}
      <div className="perfil-topo">
        <div className="perfil-conteudo">
          <h2>Meu Perfil</h2>
          <p>Gerencie suas informações pessoais e financeiras</p>
        </div>
        <div className="perfil-status-atualizacao">
          <span>Última atualização: Hoje, {horaAtual}</span>
          <button type="button" className="btn-sync">
            🔄
          </button>
        </div>
      </div>

      {/* FORMULÁRIO GERAL NO LAYOUT DA OPÇÃO 3 */}
      <form className="perfil-layout-profissional" onSubmit={salvarPerfil}>
        {/* BLOCO 1: INFORMAÇÕES PESSOAIS */}
        <div className="perfil-secao-card">
          <div className="secao-cabecalho">
            <h3>
              <span className="secao-icon">👤</span> Informações Pessoais
            </h3>
            <button type="button" className="btn-secao-editar">
              Editar
            </button>
          </div>

          <div className="secao-corpo grid-tres-colunas">
            <div className="campo-grupo">
              <label>Nome completo</label>
              <input
                type="text"
                name="nomeCompleto"
                value={perfil.nomeCompleto}
                onChange={mudancaPerfil}
                placeholder="Renato Exemplo"
              />
            </div>

            <div className="campo-grupo">
              <label>Profissão</label>
              <input
                type="text"
                name="profissao"
                value={perfil.profissao}
                onChange={mudancaPerfil}
                placeholder="Administrador"
              />
            </div>

            <div className="campo-grupo">
              <label>E-mail</label>
              <input
                type="email"
                name="email"
                value={perfil.email}
                onChange={mudancaPerfil}
                placeholder="renato@exemplo.com"
              />
            </div>

            <div className="campo-grupo">
              <label>Telefone</label>
              <input
                type="text"
                name="telefone"
                value={perfil.telefone}
                onChange={mudancaPerfil}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* BLOCO 2: INFORMAÇÕES FINANCEIRAS */}
        <div className="perfil-secao-card">
          <div className="secao-cabecalho">
            <h3>
              <span className="secao-icon">💰</span> Informações Financeiras
            </h3>
            <button type="button" className="btn-secao-editar">
              Editar
            </button>
          </div>

          <div className="secao-corpo grid-duas-colunas">
            <div className="campo-grupo">
              <label>Salário Base</label>
              <input
                type="number"
                name="salarioBase"
                value={perfil.salarioBase}
                onChange={mudancaPerfil}
                placeholder="R$ 5.000,00"
              />
            </div>

            <div className="campo-grupo">
              <label>Meta de Economia</label>
              <input
                type="number"
                name="metaEconomy" /* Alinhado com o estado mapeado */
                name="metaEconomia"
                value={perfil.metaEconomia}
                onChange={mudancaPerfil}
                placeholder="R$ 1.500,00"
              />
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR FIXADO ABAIXO À DIREITA */}
        <div className="perfil-rodape-acoes">
          <button type="submit" className="btn-salvar-master">
            Salvar todas as alterações
          </button>
        </div>
      </form>
    </div>
  );
}
