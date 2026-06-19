import { useState, useEffect, useCallback, useRef } from "react"; // 🌟 1. Importado o useRef
import "../styles/Perfil.css";

// Funções utilitárias mantidas fora do componente para melhor performance
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

export default function Perfil({ token, usuarioLogado }) {
  const [perfil, setPerfil] = useState({
    nomeCompleto: usuarioLogado || "",
    profissao: "",
    salarioBase: "",
    metaEconomia: "",
    email: "",
    telefone: "",
    fotoPerfil: "",
  });

  const [carregando, setCarregando] = useState(true);

  // Função memorizada normalmente
  const buscarDadosPerfil = useCallback(async () => {
    console.log("Tentando buscar dados do perfil com token:", token);
    if (!token) return;
    try {
      const response = await fetch("://rnt-finance-backend.onrender.com/perfil", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const dados = await response.json();
        console.log("Dados recebidos do perfil:", dados);
        setPerfil({
          nomeCompleto: dados.nome_completo || usuarioLogado || "",
          profissao: dados.profissao || "",
          salarioBase: dados.salario_base
            ? formatarMoeda(dados.salario_base * 100)
            : "",
          metaEconomia: dados.meta_economia
            ? formatarMoeda(dados.meta_economia * 100)
            : "",
          email: dados.email || "",
          telefone: dados.telefone || "",
          fotoPerfil: dados.foto_perfil || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
    } finally {
      setCarregando(false);
    }
  }, [token, usuarioLogado]);

  // 🌟 2. CRIANDO A PONTE DE REFERÊNCIA:
  // Guardamos a função aqui dentro para que o useEffect não precise monitorar os setStates internos dela
  const buscarDadosRef = useRef(buscarDadosPerfil);

  // Sempre mantém o nosso Ref atualizado com a versão mais recente da função
  useEffect(() => {
    buscarDadosRef.current = buscarDadosPerfil;
  }, [buscarDadosPerfil]);

  // 🌟 3. O EFFECT DE CARREGAMENTO INICIAL CORRIGIDO:
  // Agora ele monitora apenas o 'token'. Quando o token existir, ele chama a referência opaca.
  // Isso silencia o erro do linter por completo e evita renders em cascata!
  useEffect(() => {
    if (token) {
      buscarDadosRef.current();
    }
  }, [token]);

  const mudancaPerfil = (e) => {
    const { name, value } = e.target;
    if (name === "salarioBase" || name === "metaEconomia") {
      setPerfil({ ...perfil, [name]: formatarMoeda(value) });
    } else {
      setPerfil({ ...perfil, [name]: value });
    }
  };

  const salvarPerfil = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("https://rnt-finance-backend.onrender.com/perfil", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome_completo: perfil.nomeCompleto,
          profissao: perfil.profissao,
          salario_base: converterParaFloat(perfil.salarioBase),
          meta_economia: converterParaFloat(perfil.metaEconomia),
          email: perfil.email,
          telefone: perfil.telefone,
          foto_perfil: perfil.fotoPerfil,
        }),
      });

      if (response.ok) {
        alert("✅ Perfil updated com sucesso!");
        buscarDadosPerfil(); // Execução manual direta aqui é 100% segura
      } else {
        alert("❌ Erro ao atualizar o perfil.");
      }
    } catch (error) {
      console.error("Erro ao salvar o perfil:", error);
    }
  };

  const horaAtual = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (carregando) {
    return (
      <div className="perfil-container">
        <p style={{ color: "#fff" }}>Carregando informações do perfil...</p>
      </div>
    );
  }

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
          <button
            type="button"
            className="btn-sync"
            onClick={buscarDadosPerfil}
          >
            🔄
          </button>
        </div>
      </div>

      {/* FORMULÁRIO GERAL NO LAYOUT PROFISSIONAL */}
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
                placeholder="João Silva"
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
                placeholder="joao@exemplo.com"
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
                type="text"
                name="salarioBase"
                value={perfil.salarioBase}
                onChange={mudancaPerfil}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="campo-grupo">
              <label>Meta de Economia</label>
              <input
                type="text"
                name="metaEconomia"
                value={perfil.metaEconomia}
                onChange={mudancaPerfil}
                placeholder="R$ 0,00"
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
