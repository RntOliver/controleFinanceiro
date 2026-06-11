from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field, field_validator, EmailStr
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
    
    # 🔒 NOVA REGRA DE NEGÓCIO: Adicionado o campo e-mail estruturado como ÚNICO no banco
    email = Column(String, unique=True, index=True, nullable=False)
    
    senha_criptografada = Column(String)
    token_atual = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False) 

    transacoes = relationship("FinancaDB", back_populates="dono")

class FinancaDB(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    salario = Column(Float)
    despesa = Column(Float)
    lucro = Column(Float)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    mes = Column(String) # 📅 NOVA COLUNA ADICIONADA AQUI!
    
    dono = relationship("UsuarioDB", back_populates="transacoes")

# 🛠️ GERADOR AUTOMÁTICO: O SQLAlchemy lê as classes acima e ergue as tabelas do zero com as regras novas
Base.metadata.create_all(bind=engine)

# -----------------------------------------------------------------
# CONTRATOS DE DADOS E VALIDAÇÕES (Pydantic V2)
# -----------------------------------------------------------------
class Financa(BaseModel):
    salario: float = Field(..., ge=0)
    despesa: float = Field(..., ge=0)
    mes: str = Field(..., min_length=3) # 📅 RECEBE O MÊS (Ex: "Janeiro")

    # O CÓDIGO ABAIXO FOI COMENTADO PORQUE AGORA O NOME VAI VIR DO USUÁRIO LOGADO, ENTÃO NÃO PRECISAMOS VALIDAR O NOME QUE O USUÁRIO DIGITA NO FORMULÁRIO DE FINANÇAS

    # @field_validator('nome')
    # def nome_nao_vazio(cls, v):
    #    if not v.strip():
    #        raise ValueError('O nome não pode estar vazio')
    #    return v.strip().upper()

# 📧 NOVO CONTRATO: Usado especificamente no momento de criar uma conta
class UsuarioCadastro(BaseModel):
    username: str
    email: str  # Campo obrigatório para o cadastro
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

# 🔑 NOVO CONTRATO: Usado no Login (Substitui o Username pelo E-mail)
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
    usuario = db.query(UsuarioDB).filter(UsuarioDB.token_atual == token).first()
    db.close()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Sessão expirada ou token inválido.")
    
    return usuario

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
    
    # 1. 🔍 VALIDAÇÃO: Procura no banco se o e-mail que está tentando se cadastrar já existe
    email_existente = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
    if email_existente:
        db.close()
        raise HTTPException(status_code=400, detail="Este endereço de e-mail já está cadastrado.")
    
    # 2. 👑 REGRA DE OURO DO ADMIN:
    # Criamos uma variável com o seu e-mail de verdade. 
    # Mude o texto abaixo para o seu e-mail pessoal real (ex: 'renato@gmail.com')
    EMAIL_MESTRE_RENATO = "re83375741@gmail.com"

    # O Python checa: "O e-mail digitado é o do Renato? Ou começa com admin@?" 
    # Se sim, dá o cargo de Admin (True). Se não, mantém o cargo que veio no formulário (Geralmente False).
    if usuario.email == EMAIL_MESTRE_RENATO or usuario.email.startswith("admin@"):
        tornar_admin = True
    else:
        tornar_admin = usuario.is_admin

    # 3. 💾 MONTAGEM DO OBJETO: Insere os dados tratados na tabela do banco
    novo_usuario = UsuarioDB(
        username=usuario.username,
        email=usuario.email,
        senha_criptografada=gerar_hash_senha(usuario.senha),
        is_admin=tornar_admin
    )
    
    db.add(novo_usuario)
    db.commit()
    db.close()
    
    return {"mensagem": f"Usuário {'Administrador' if tornar_admin else 'Cliente'} registrado com sucesso!"}


@app.post("/auth/login")
async def login(usuario: UsuarioLogin):
    db = SessionLocal()
    try:
        # 🔑 AUTENTICAÇÃO POR E-MAIL: O sistema agora procura o registro pelo e-mail fornecido
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
    
    nova_transacao = FinancaDB(
        nome=usuario_atual.username.upper(),
        salario=item.salario,
        despesa=item.despesa,
        lucro=lucro_calculado,
        usuario_id=usuario_atual.id,
        mes=item.mes.upper() # 📅 INJETA O MÊS SALVANDO EM MAIÚSCULO
    )
    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)
    db.close() 
    
    return {
        "id": nova_transacao.id, 
        "nome": nova_transacao.nome, 
        "salario": nova_transacao.salario, 
        "despesa": nova_transacao.despesa, 
        "Lucro": nova_transacao.lucro,
        "mes": nova_transacao.mes # Retorna para o React colocar na tabela na hora
    }


@app.get("/transacoes")
async def obter_transacoes(usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    db = SessionLocal()
    if usuario_atual.is_admin:
        historico = db.query(FinancaDB).all()
    else:
        historico = db.query(FinancaDB).filter(FinancaDB.usuario_id == usuario_atual.id).all()
        
    db.close()
    return [{"id": t.id, "nome": t.nome, "salario": t.salario, "despesa": t.despesa, "Lucro": t.lucro} for t in historico]


@app.delete("/transacoes/{id_transacao}")
async def deletar_transacao(id_transacao: int, usuario_atual: UsuarioDB = Depends(obter_usuario_atual)):
    db = SessionLocal()
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