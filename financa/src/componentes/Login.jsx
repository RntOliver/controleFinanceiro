import { useState } from "react";

function Login({ onLoginSuccess }) {
  const [authUsername, setAuthUsername] = useState("");
  const [authSenha, setAuthSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);

  const gerenciarAutenticacao = async (e) => {
    e.preventDefault();
    if (!authUsername.trim() || !authSenha.trim()) {
      alert("⚠️ Preencha todos os campos!");
      return;
    }

    const rota = modoCadastro ? "registrar" : "login";

    try {
      const resposta = await fetch(`http://127.0.0.1:8000/auth/${rota}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: authUsername, senha: authSenha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        alert(`❌ Erro: ${dados.detail || "Falha na operação"}`);
        return;
      }

      if (modoCadastro) {
        alert(
          "✨ Conta criada com sucesso! Agora informe seus dados para logar.",
        );
        setModoCadastro(false);
        setAuthSenha("");
      } else {
        // Envia as credenciais de sucesso para o componente pai (App.jsx)
        onLoginSuccess(dados.token, dados.username, dados.is_admin);
      }
    } catch (error) {
      // Agora capturamos o erro real e mantemos o alerta amigável
      console.error("O ERRO REAL FOI ESTE:", error);
      alert("Sistema indisponível. Verifique se o Back-end está rodando.");
    }
  }; // <-- A função agora fecha corretamente aqui antes do return

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>RNT FINANCE</h2>
        <p>
          {modoCadastro
            ? "Crie sua conta administrativa permanente"
            : "Faça login para gerenciar suas finanças"}
        </p>

        <form onSubmit={gerenciarAutenticacao} className="auth-form">
          <input
            type="text"
            placeholder="Nome de usuário"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Sua senha secreta"
            value={authSenha}
            onChange={(e) => setAuthSenha(e.target.value)}
          />
          <button type="submit">
            {modoCadastro ? "CADASTRAR CONTA" : "ENTRAR NO SISTEMA"}
          </button>
        </form>

        <span
          className="auth-toggle-link"
          onClick={() => setModoCadastro(!modoCadastro)}
        >
          {modoCadastro
            ? "Já tem uma conta? Faça Login"
            : "Não tem cadastro? Crie uma conta aqui"}
        </span>
      </div>
    </div>
  );
}

export default Login;
