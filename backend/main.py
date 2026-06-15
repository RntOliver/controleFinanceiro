from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import hashlib
import secrets

# -----------------------------------------------------------------
# CONFIGURAÇÃO E CONEXÃO DO BANCO DE DADOS (SQLAlchemy)
# -----------------------------------------------------------------
DATABASE_URL = "sqlite:///./financas.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -----------------------------------------------------------------
# MODELOS DE MODELAGEM DO BANCO DE DADOS (ORM)
# -----------------------------------------------------------------
class UsuarioDB(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_criptografada = Column(String)
    token_atual = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False) 

    transacoes = relationship("FinancaDB", back_populates="dono")

class FinancaDB(Base):
    __tablename__ = "transacoes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    salario = Column(Float)
    despesa = Column(Float)
    lucro = Column(Float)
    # 📅 CORREÇÃO BUG 1: Adicionado o campo mes na tabela física do banco de dados
    mes = Column(String, default="Geral")
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    dono = relationship("UsuarioDB", back_populates="transacoes")

# Ergue as tabelas atualizadas com o campo novo
Base.metadata.create_all(bind=engine)

# -----------------------------------------------------------------
# CONTRATOS DE DADOS E VALIDAÇÕES (Pydantic V2)
# -----------------------------------------------------------------
class Financa(BaseModel):
    # Opcional para o Admin que digita o nome manualmente pelo Dashboard
    nome: str | None = None 
    salario: float = Field(..., ge=0)
    despesa: float = Field(..., ge=0)
    # 📅 CORREÇÃO BUG 2: mes agora tem valor padrão para não quebrar requisições sem o campo
    mes: str = Field(default="GERAL", min_length=3) 

class UsuarioCadastro(BaseModel):
    username: str
    email: str  
    senha: str
    is_admin: bool = False

    @field_validator('username')
    def limpar_username(cls, v):
        return v.strip().lower()

    @field_validator('email')
    def validar_e_limpar_email(cls, v):
        if "@" not in v or "." not in v:
            raise ValueError("O formato do e-mail inserido é inválido.")
        return v.strip().lower()

class UsuarioLogin(BaseModel):
    email: str
    senha: str

    @field_validator('email')
    def limpar_email(cls, v):
        return v.strip().lower()

# -----------------------------------------------------------------
# FUNÇÕES DE SEGURANÇA E AUXILIARES
# -----------------------------------------------------------------
def gerar_hash_senha(senha_pura: str) -> str:
    SALT = "rnt_finance_secret_key_2026"
    senha_com_salt = senha_pura + SALT
    return hashlib.sha256(senha_com_salt.encode()).hexdigest()

async def obter_usuario_atual(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Acesso negado. Token ausente.")
    
    token = authorization.replace("Bearer ", "").strip()
    
    db = SessionLocal()
    try:
        usuario = db.query(UsuarioDB).filter(UsuarioDB.token_atual == token).first()
        if not usuario:
            raise HTTPException(status_code=401, detail="Sessão expirada ou token inválido.")
        return usuario
    finally:
        db.close()

# -----------------------------------------------------------------
# CONFIGURAÇÃO DO SERVIDOR E ROTAS DE API
# -----------------------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.post("/auth/registrar")
async def registrar_usuario(usuario: UsuarioCadastro):
    db = SessionLocal()
    try:
        email_existente = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
        if email_existente:
            raise HTTPException(status_code=400, detail="Este endereço de e-mail já está cadastrado.")
        
        tornar_admin = True if usuario.email.startswith("admin@") else usuario.is_admin

        novo_usuario = UsuarioDB(
            username=usuario.username,
            email=usuario.email,
            senha_criptografada=gerar_hash_senha(usuario.senha),
            is_admin=tornar_admin
        )
        
        db.add(novo_usuario)
        db.commit()
        return {"mensagem": f"Usuário {'Administrador' if tornar_admin else 'Cliente'} registrado com sucesso!"}
    finally:
        db.close()

@app.post("/auth/login")
async def login(usuario: UsuarioLogin):
    db = SessionLocal()
    try:
        usuario_banco = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
        if not usuario_banco:
            raise HTTPException(status_code=400, detail="E-mail ou senha incorretos.")
        
        senha_teste_hash = gerar_hash_senha(usuario.senha)
        if usuario_banco.senha_criptografada != senha_teste_hash:
            raise HTTPException(status_code=400, detail="E-mail ou senha incorretos.")
        
        token_seguro = secrets.token_hex(24)
        usuario_banco.token_atual = token_seguro
        db.commit()
        
        return {
            "token": token_seguro, 
            "username": usuario_banco.username, 
            "is_admin": usuario_banco.is_admin
        }
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"💥 Erro interno no Login: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor de autenticação.")
    finally:
        db.close()

# -----------------------------------------------------------------
# ROTAS FINANCEIRAS
# -----------------------------------------------------------------
@app.post("/calcular")
async def calcular(item: Financa, usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    lucro_calculado = item.salario - item.despesa
    db = SessionLocal()
    try:
        # Define se o nome vem do input (Admin) ou do próprio usuário logado (Cliente)
        nome_final = item.nome.upper() if item.nome else usuario_atual.username.upper()

        nova_transacao = FinancaDB(
            nome=nome_final,
            salario=item.salario,
            despesa=item.despesa,
            lucro=lucro_calculado,
            usuario_id=usuario_atual.id,
            mes=item.mes.upper()
        )
        db.add(nova_transacao)
        db.commit()
        db.refresh(nova_transacao)
        
        return {
            "id": nova_transacao.id, 
            "nome": nova_transacao.nome, 
            "salario": nova_transacao.salario, 
            "despesa": nova_transacao.despesa, 
            "Lucro": nova_transacao.lucro, # "Lucro" com L maiúsculo para espelhar a tabela fake do React
            "mes": nova_transacao.mes 
        }
    finally:
        db.close()

@app.get("/transacoes")
async def obtener_transacoes(usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    db = SessionLocal()
    try:
        if usuario_atual.is_admin:
            historico = db.query(FinancaDB).all()
        else:
            historico = db.query(FinancaDB).filter(FinancaDB.usuario_id == usuario_atual.id).all()
            
        return [{"id": t.id, "nome": t.nome, "salario": t.salario, "despesa": t.despesa, "Lucro": t.lucro, "mes": t.mes} for t in historico]
    finally:
        db.close()

@app.delete("/transacoes/{id_transacao}")
async def deletar_transacao(id_transacao: int, usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    db = SessionLocal()
    try:
        if usuario_atual.is_admin:
            item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao).first()
        else:
            item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao, FinancaDB.usuario_id == usuario_atual.id).first()
        
        if item_banco:
            db.delete(item_banco)
            db.commit()
            return {"mensagem": "Excluído com sucesso!"}
        
        raise HTTPException(status_code=404, detail="Registro não encontrado ou acesso não autorizado.")
    finally:
        db.close()