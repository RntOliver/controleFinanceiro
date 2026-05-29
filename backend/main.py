from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean # Adicionado Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import hashlib
import secrets

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# -----------------------------------------------------------------
# BANCO DE DADOS (Com nível de acesso)
# -----------------------------------------------------------------
DATABASE_URL = "sqlite:///./financas.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    senha_criptografada = Column(String)
    token_atual = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False) # 👑 TRUE para Administrador, FALSE para Cliente comum

    transacoes = relationship("FinancaDB", back_populates="dono")

class FinancaDB(Base):
    __tablename__ = "transacoes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    salario = Column(Float)
    despesa = Column(Float)
    lucro = Column(Float)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    dono = relationship("UsuarioDB", back_populates="transacoes")

Base.metadata.create_all(bind=engine)

# -----------------------------------------------------------------
# CONTRATOS DE DADOS
# -----------------------------------------------------------------
class Financa(BaseModel):
    nome: str
    salario: float = Field(..., ge=0)
    despesa: float = Field(..., ge=0)

    @field_validator('nome')
    def nome_nao_vazio(cls, v):
        if not v.strip():
            raise ValueError('O nome não pode estar vazio')
        return v.strip().upper()

class UsuarioAutenticacao(BaseModel):
    username: str
    senha: str
    is_admin: bool = False # Campo opcional no cadastro, padrão é cliente comum

    @field_validator('username')
    def limpar_username(cls, v):
        return v.strip().lower()

# -----------------------------------------------------------------
# FUNÇÕES DE SEGURANÇA
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
    usuario = db.query(UsuarioDB).filter(UsuarioDB.token_atual == token).first()
    db.close()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Sessão expirada ou token inválido.")
    
    return usuario

# -----------------------------------------------------------------
# ROTAS DE AUTENTICAÇÃO
# -----------------------------------------------------------------
@app.post("/auth/registrar")
async def registrar_usuario(usuario: UsuarioAutenticacao):
    db = SessionLocal()
    usuario_existente = db.query(UsuarioDB).filter(UsuarioDB.username == usuario.username).first()
    if usuario_existente:
        db.close()
        raise HTTPException(status_code=400, detail="Este nome de usuário já existe.")
    
    # 👑 Se o nome de usuário criado for 'admin', ele vira administrador automaticamente automaticamente
    tornar_admin = True if usuario.username == "admin" else usuario.is_admin

    novo_usuario = UsuarioDB(
        username=usuario.username, 
        senha_criptografada=gerar_hash_senha(usuario.senha),
        is_admin=tornar_admin
    )
    db.add(novo_usuario)
    db.commit()
    db.close()
    return {"mensagem": f"Usuário {'Administrador' if tornar_admin else 'Cliente'} registrado com sucesso!"}


@app.post("/auth/login")
async def login(usuario: UsuarioAutenticacao):
    db = SessionLocal()
    try:
        usuario_banco = db.query(UsuarioDB).filter(UsuarioDB.username == usuario.username).first()
        if not usuario_banco:
            raise HTTPException(status_code=400, detail="Usuário ou senha incorretos.")
        
        senha_teste_hash = gerar_hash_senha(usuario.senha)
        if usuario_banco.senha_criptografada != senha_teste_hash:
            raise HTTPException(status_code=400, detail="Usuário ou senha incorretos.")
        
        token_seguro = secrets.token_hex(24)
        usuario_banco.token_atual = token_seguro
        db.commit()
        
        # Retornamos também se ele é admin para o React saber como se comportar visualmente
        return {"token": token_seguro, "username": usuario_banco.username, "is_admin": usuario_banco.is_admin}
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        print(f"💥 Erro interno no Login: {e}")
        raise HTTPException(status_code=500, detail="Erro interno no servidor de autenticação.")
    finally:
        db.close()

# -----------------------------------------------------------------
# ROTAS FINANCEIRAS COM INTELIGÊNCIA DE NÍVEL DE ACESSO
# -----------------------------------------------------------------

@app.post("/calcular")
async def calcular(item: Financa, usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    lucro_calculado = item.salario - item.despesa
    db = SessionLocal()
    
    nova_transacao = FinancaDB(
        nome=item.nome,
        salario=item.salario,
        despesa=item.despesa,
        lucro=lucro_calculado,
        usuario_id=usuario_atual.id 
    )
    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)
    db.close() 
    return {"id": nova_transacao.id, "nome": nova_transacao.nome, "salario": nova_transacao.salario, "despesa": nova_transacao.despesa, "Lucro": nova_transacao.lucro}


@app.get("/transacoes")
async def obter_transacoes(usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    db = SessionLocal()
    
    # 🧠 A MÁGICA ACONTECE AQUI:
    if usuario_atual.is_admin:
        # Se for o Administrador Master, traz TODAS as transações de todos os clientes existentes
        historico = db.query(FinancaDB).all()
    else:
        # Se for um cliente comum (renato, ysabella), traz estritamente os dados dele
        historico = db.query(FinancaDB).filter(FinancaDB.usuario_id == usuario_atual.id).all()
        
    db.close()
    return [{"id": t.id, "nome": t.nome, "salario": t.salario, "despesa": t.despesa, "Lucro": t.lucro} for t in historico]


@app.delete("/transacoes/{id_transacao}")
async def deletar_transacao(id_transacao: int, usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    db = SessionLocal()
    
    # Administrador pode apagar qualquer linha do sistema. Cliente comum só apaga a sua.
    if usuario_atual.is_admin:
        item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao).first()
    else:
        item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao, FinancaDB.usuario_id == usuario_atual.id).first()
    
    if item_banco:
        db.delete(item_banco)
        db.commit()
        db.close()
        return {"mensagem": "Excluído com sucesso!"}
    
    db.close()
    raise HTTPException(status_code=404, detail="Registro não encontrado ou acesso não autorizado.")