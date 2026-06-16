import { useState } from "react";
import "../styles/Login.css"; // Certifique-se de que o CSS está apontado corretamente

function Login({ onLoginSuccess }) {
  // 1. ESTADOS DO REACT (Memória local do componente)
  const [isCadastro, setIsCadastro] = useState(false); // Controla se mostra a tela de Login (false) ou Cadastro (true)
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Função auxiliar para resetar o formulário completamente
  const limparFormulario = () => {
    setUsername("");
    setEmail("");
    setSenha("");
  };

  // 2. FUNÇÃO DE CADASTRO (Disparada no envio do formulário de registro)
  const ejecutarCadastro = async (e) => {
    e.preventDefault(); // Evita o recarregamento padrão da página
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const resposta = await fetch("http://localhost:8000/auth/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.detail || "Erro ao realizar cadastro.");
      }

      setMensagemSucesso(dados.mensagem || "Cadastro realizado com sucesso!");
      setIsCadastro(false); // Retorna para a tela de login automaticamente
      limparFormulario(); // Limpa todos os campos por segurança e usabilidade
    } catch (err) {
      setMensagemErro(err.message);
    }
  };

  // 3. FUNÇÃO DE LOGIN (Disparada no envio do formulário de login)
  const executarLogin = async (e) => {
    e.preventDefault();
    setMensagemErro("");
    setMensagemSucesso("");

    try {
      const resposta = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.detail || "E-mail ou senha incorretos.");
      }

      // Garantimos o mapeamento seguro das chaves vindas do ecossistema Python FastAPI
      const token = dados.token || dados.access_token;
      const userLogado = dados.username || username;
      const papelAdmin = dados.is_admin ?? false;

      onLoginSuccess(token, userLogado, papelAdmin);
    } catch (err) {
      setMensagemErro(err.message);
    }
  };

  // 4. RENDERIZAÇÃO VISUAL (HTML Dinâmico)
  return (
    <div className="login-wrapper">
      <div className="card-autenticacao">
        <h2>{isCadastro ? "Criar Conta Premium" : "Acessar RNT FINANCE"}</h2>
        <p className="subtitulo-card">
          {isCadastro
            ? "Preencha os dados abaixo"
            : "Insira suas credenciais de acesso"}
        </p>

        {/* FEEDBACKS VISUAIS */}
        {mensagemErro && <div className="alerta-erro">⚠️ {mensagemErro}</div>}
        {mensagemSucesso && (
          <div className="alerta-sucesso">✅ {mensagemSucesso}</div>
        )}

        {/* FORMULÁRIO DINÂMICO */}
        <form onSubmit={isCadastro ? ejecutarCadastro : executarLogin}>
          {/* Campo de Username (Exclusivo do Cadastro) */}
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

          {/* Campo de E-mail */}
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

          {/* Campo de Senha */}
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

        {/* BOTÃO ALTERNADOR DE TELAS */}
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
