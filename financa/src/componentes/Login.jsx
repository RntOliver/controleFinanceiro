import { useState } from "react";
import "../styles/Login.css";

// CORREÇÃO 1: Como você está usando Vite, a forma de ler a variável de ambiente é com import.meta.env
const API_URL = "https://rnt-finance-backend.onrender.com";

function Login({ onLoginSuccess }) {
  const [isCadastro, setIsCadastro] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const limparFormulario = () => {
    setUsername("");
    setEmail("");
    setSenha("");
  };

  // CORREÇÃO 2: Ajuste do nome para "executarCadastro"
  const executarCadastro = async (e) => {
    e.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const resposta = await fetch(`${API_URL}/auth/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, senha }),
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
    } catch (err) {
      setMensagemErro(err.message);
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
            <div className="grupo-input">
              <label>Nome de Usuário</label>
              <input
                type="text"
                placeholder="Ex: renatodev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
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
              Já possui uma conta?{" "}
              <button
                onClick={() => {
                  setIsCadastro(false);
                  limparFormulario();
                  setMensagemErro("");
                }}
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Novo por aqui?{" "}
              <button
                onClick={() => {
                  setIsCadastro(true);
                  limparFormulario();
                  setMensagemErro("");
                }}
              >
                Cadastre-se agora
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
