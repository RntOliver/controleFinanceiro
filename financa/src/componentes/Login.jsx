import { useState } from "react";
import "../styles/Login.css";

const API_URL = "https://rnt-finance-backend.onrender.com";

const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null || valor === "") return ""; 
  const apenasNumeros = String(valor).replace(/\D/g, "");
  if (!apenasNumeros) return ""; 
  const opcoes = { minumimFractionDigits: 2, maximumFractionDigits: 2};
  return `R$ ${new Intl.NumberFormat("pt-BR", opcoes).format(apenasNumeros / 100)}`; 
};

const converterParaFloat = (valorFormatado) => {
  if (!valorFormatado) return 0; 
  const limpo = valorFormatado 
  .replace("R$", "")
  .replace(/\./g, "")
  .replace("," , ".")
  .trim();
  return parseFloat(limpo) || 0.0;
}

function Login({ onLoginSuccess }) {
  const [isCadastro, setIsCadastro] = useState(false);
  const [username, setUsername] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [salario, setSalario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const limparFormulario = () => {
    setUsername("");
    setEmail("");
    setSenha("");
    setNomeCompleto("");
    setSalario("");
  };

  const executarCadastro = async (e) => {
    e.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const resposta = await fetch(`${API_URL}/auth/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username,
          nome_completo: nomeCompleto,
          email,
          senha,
          salario_base: converterParaFloat(salario),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.detail || "Erro ao realizar cadastro.");
      }

      setMensagemSucesso(dados.mensagem || "Cadastro realizado com sucesso!");
      setIsCadastro(false);
      limparFormulario();
    } catch (err) {
      setMensagemErro(err.message);
    }
  };

  const executarLogin = async (e) => {
    e.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.detail || "E-mail ou senha incorretos.");
      }

      const token = dados.token || dados.access_token;
      const userLogado = dados.username || username;
      const papelAdmin = dados.is_admin ?? false;

      onLoginSuccess(token, userLogado, papelAdmin);
    } catch (error) {
      setMensagemErro(error.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card-autenticacao">
        <h2>{isCadastro ? "Criar Conta Premium" : "Acessar RNT FINANCE"}</h2>
        <p className="subtitulo-card">
          {isCadastro
            ? "Preencha os dados abaixo"
            : "Insira suas credenciais de acesso"}
        </p>

        {mensagemErro && <div className="alerta-erro">⚠️ {mensagemErro}</div>}
        {mensagemSucesso && (
          <div className="alerta-sucesso">✅ {mensagemSucesso}</div>
        )}

        <form onSubmit={isCadastro ? executarCadastro : executarLogin}>
          {isCadastro && (
            <>
              <div className="grupo-input">
                <label>Nome de Usuário</label>
                <input
                  type="text"
                  placeholder="Ex: João"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="grupo-input">
                <label>Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>

              <div className="grupo-input">
                <label>Salário base</label>
                <input
                  type="number"
                  placeholder="Ex: 2500.00"
                  value={salario}
                  onChange={(e) => setSalario(formatarMoeda(e.target.value))}
                  required
                />
              </div>
            </>
          )}

          <div className="grupo-input">
            <label>Endereço de E-mail</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grupo-input">
            <label>Senha de Segurança</label>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="botao-acao-principal">
            {isCadastro ? "Concluir Registro" : "Entrar no Sistema"}
          </button>
        </form>

        <div className="alternador-tela">
          {isCadastro ? (
            <p>
              {" "}
              Já possui uma conta?{" "}
              <button
                onClick={() => {
                  setIsCadastro(false);
                  limparFormulario();
                  setMensagemErro("");
                }}
              >
                {" "}
                Fazer Login{" "}
              </button>
            </p>
          ) : (
            <p>
              {" "}
              Novo por aqui?{" "}
              <button
                onClick={() => {
                  setIsCadastro(true);
                  limparFormulario();
                  setMensagemErro("");
                }}
              >
                {" "}
                Cadastre-se agora{" "}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;