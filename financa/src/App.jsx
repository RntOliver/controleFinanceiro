import { useState } from "react";
import Login from "./componentes/Login";
import Dashboard from "./componentes/Dashboard";
import "./App.css";

function App() {
  // 🔒 ESTADOS DE AUTENTICAÇÃO CENTRALIZADOS
  const [token, setToken] = useState(localStorage.getItem("rnt_token") || null);
  const [usernameLogado, setUsernameLogado] = useState(
    localStorage.getItem("rnt_user") || "",
  );
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("rnt_is_admin") === "true",
  );

  // Alimenta os estados e o cache ao logar com sucesso
  const efetuarLogin = (novoToken, usuario, adminStatus) => {
    localStorage.setItem("rnt_token", novoToken);
    localStorage.setItem("rnt_user", usuario);
    localStorage.setItem("rnt_is_admin", adminStatus);

    setToken(novoToken);
    setUsernameLogado(usuario);
    setIsAdmin(adminStatus);
  };

  // Limpa tudo no logout ou se o backend disparar 401
  const efetuarLogout = () => {
    localStorage.removeItem("rnt_token");
    localStorage.removeItem("rnt_user");
    localStorage.removeItem("rnt_is_admin");

    setToken(null);
    setUsernameLogado("");
    setIsAdmin(false);
  };

  // 🚦 ROTEAMENTO DE TELA
  if (!token) {
    return <Login onLoginSuccess={efetuarLogin} />;
  }

  return (
    <Dashboard
      token={token}
      usernameLogado={usernameLogado}
      isAdmin={isAdmin}
      onLogout={efetuarLogout}
    />
  );
}

export default App;
