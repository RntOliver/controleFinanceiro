import hashlib
import secrets
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False) 
    senha_criptografada = Column(String)
    token_atual = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False) 

    # Campos de Perfil
    nome_completo = Column(String, nullable=True)
    profissao = Column(String, nullable=True)
    salario_base = Column(Float, default=0.0)
    meta_economia = Column(Float, default=0.0)
    telefone = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=True)

    transacoes = relationship("FinancaDB", back_populates="dono")
    metas = relationship("MetaDB", back_populates="dono")

def gerar_hash_senha(senha_pura: str) -> str:
    SALT = "rnt_finance_secret_key_2026"
    senha_com_salt = senha_pura + SALT
    return hashlib.sha256(senha_com_salt.encode()).hexdigest()

async def obter_usuario_atual(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Acesso negado. Token ausente.")
    
    token = authorization.replace("Bearer ", "").strip()
    
    usuario = db.query(UsuarioDB).filter(UsuarioDB.token_atual == token).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Sessão expirada ou token inválido.")
    return usuario