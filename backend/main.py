from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
import hashlib
import secrets
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# -----------------------------------------------------------------
# BANCO DE DADOS 
# -----------------------------------------------------------------
DATABASE_URL = "sqlite:///./financas.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False) 
    senha_criptografada = Column(String)
    token_atual = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False) 

    nome_completo = Column(String, nullable=True)
    profissao = Column(String, nullable=True)
    salario_base = Column(Float, default=0.0)
    meta_economia = Column(Float, default=0.0)
    telefone = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=True)

    transacoes = relationship("FinancaDB", back_populates="dono")

class FinancaDB(Base):
    __tablename__ = "transacoes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)      
    mes = Column(String, index=True)       
    dia = Column(Integer)                  
    salario = Column(Float, default=0.0)   
    despesa = Column(Float)
    lucro = Column(Float)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    
    dono = relationship("UsuarioDB", back_populates="transacoes")

Base.metadata.create_all(bind=engine)

# -----------------------------------------------------------------
# CONTRATOS DE DADOS (Pydantic V2)
# -----------------------------------------------------------------
class Financa(BaseModel):
    mes: str
    dia: int = Field(..., ge=1, le=31)  
    despesa: float = Field(..., ge=0)   

    @field_validator('mes')
    def mes_nao_vazio(cls, v):
        if not v.strip():
            raise ValueError('O mês precisa ser selecionado')
        return v.strip().upper()

class UsuarioCadastro(BaseModel):
    username: str
    email: str
    senha: str
    is_admin: bool = False

    @field_validator('username', 'email')
    def limpar_campos(cls, v):
        return v.strip().lower()

class UsuarioLogin(BaseModel):
    email: str
    senha: str

    @field_validator('email')
    def limpar_email(cls, v):
        return v.strip().lower()

class UsuarioPerfil(BaseModel):
    nome_completo: Optional[str] = None
    profissao: Optional[str] = None
    salario_base: float = 0.0
    meta_economia: float = 0.0
    email: Optional[str] = None
    telefone: Optional[str] = None
    foto_perfil: Optional[str] = None

# -----------------------------------------------------------------
# FUNÇÕES DE SEGURANÇA E DEPENDÊNCIAS
# -----------------------------------------------------------------
def gerar_hash_senha(senha_pura: str) -> str:
    SALT = "rnt_finance_secret_key_2026"
    senha_com_salt = senha_pura + SALT
    return hashlib.sha256(senha_com_salt.encode()).hexdigest()

# ⚡ Boa prática: Injetor de sessão limpo para as rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def obter_usuario_atual(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Acesso negado. Token ausente.")
    
    token = authorization.replace("Bearer ", "").strip()
    
    usuario = db.query(UsuarioDB).filter(UsuarioDB.token_atual == token).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Sessão expirada ou token inválido.")
    return usuario

# -----------------------------------------------------------------
# ROTAS DE AUTENTICAÇÃO
# -----------------------------------------------------------------
@app.post("/auth/registrar")
async def registrar_usuario(usuario: UsuarioCadastro, db: Session = Depends(get_db)): 
    seu_email_admin = "re83375741@gmail.com"
    
    email_existente = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
    if email_existente:
        raise HTTPException(status_code=400, detail="Este endereço de e-mail já está cadastrado.")
    
    tornar_admin = True if usuario.email.lower() == seu_email_admin else usuario.is_admin

    novo_usuario = UsuarioDB(
        username=usuario.username,
        email=usuario.email,
        senha_criptografada=gerar_hash_senha(usuario.senha),
        is_admin=tornar_admin
    )
    db.add(novo_usuario)
    db.commit()
    
    return {"mensagem": f"Usuário {'Administrador' if tornar_admin else 'Cliente'} registrado com sucesso!"}

@app.post("/auth/login")
async def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
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

# -----------------------------------------------------------------
# 🌟 GERENCIAMENTO DO PERFIL
# -----------------------------------------------------------------

@app.get("/perfil")
async def obter_perfil(usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    # Buscamos usando a sessão ativa da rota para evitar objetos desconectados
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_atual.id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    return {
        "nome_completo": usuario.nome_completo or "",
        "profissao": usuario.profissao or "",
        "salario_base": usuario.salario_base or 0.0,
        "meta_economia": usuario.meta_economia or 0.0,
        "email": usuario.email,
        "telefone": usuario.telefone or "",
        "foto_perfil": usuario.foto_perfil or ""
    }

@app.put("/perfil")
async def atualizar_perfil(perfil: UsuarioPerfil, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    try:
        # Usa a sessão 'db' ativa injetada na rota
        usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_atual.id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
        # Validação de troca de e-mail por duplicidade
        if perfil.email and perfil.email.strip().lower() != usuario.email.lower():
            email_duplicado = db.query(UsuarioDB).filter(UsuarioDB.email == perfil.email.strip().lower()).first()
            if email_duplicado:
                raise HTTPException(status_code=400, detail="Este e-mail já está sendo usado por outro usuário.")
            usuario.email = perfil.email.strip().lower()
        
        # Mapeamento seguro dos campos vindos do Pydantic
        usuario.nome_completo = perfil.nome_completo
        usuario.profissao = perfil.profissao
        usuario.salario_base = perfil.salario_base
        usuario.meta_economia = perfil.meta_economia
        usuario.telefone = perfil.telefone
        usuario.foto_perfil = perfil.foto_perfil

        db.commit()
        return {"mensagem": "Perfil updated com sucesso!"}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        db.rollback()  # Desfaz qualquer alteração incompleta se quebrar
        print(f"💥 Erro crítico ao salvar perfil: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao salvar informações do perfil: {str(e)}")

# -----------------------------------------------------------------
# ROTAS FINANCEIRAS
# -----------------------------------------------------------------
@app.post("/calcular")
async def calcular(item: Financa, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_atual.id).first()
    salario_atual = usuario.salario_base or 0.0 
    lucro_calculado = salario_atual - item.despesa 
    
    nova_transacao = FinancaDB(
        nome=usuario.username.upper(), 
        mes=item.mes,
        dia=item.dia,
        salario=salario_atual,
        despesa=item.despesa,
        lucro=lucro_calculado,
        usuario_id=usuario.id 
    )
    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)
    
    return {
        "id": nova_transacao.id, 
        "nome": nova_transacao.nome, 
        "mes": nova_transacao.mes,
        "dia": nova_transacao.dia,
        "salario": nova_transacao.salario, 
        "despesa": nova_transacao.despesa, 
        "lucro": nova_transacao.lucro
    }

@app.get("/transacoes")
async def listar_transacoes(usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    if usuario_atual.is_admin:
        transacoes = db.query(FinancaDB).all()
    else:
        transacoes = db.query(FinancaDB).filter(FinancaDB.usuario_id == usuario_atual.id).all()
        
    return [
        {
            "id": t.id,
            "nome": t.nome,
            "mes": t.mes,
            "dia": t.dia,
            "salario": t.salario,
            "despesa": t.despesa,
            "lucro": t.lucro
        }
        for t in transacoes
    ]

@app.delete("/transacoes/{id_transacao}")
async def deletar_transacao(id_transacao: int, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    if usuario_atual.is_admin:
        item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao).first()
    else:
        item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao, FinancaDB.usuario_id == usuario_atual.id).first()
    
    if item_banco:
        db.delete(item_banco)
        db.commit()
        return {"mensagem": "Excluído com sucesso!"}
    
    raise HTTPException(status_code=404, detail="Registro não encontrado ou acesso não autorizado.")