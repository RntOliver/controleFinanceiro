# app/auth/models.py
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

    nome_completo = Column(String, nullable=True)
    profissao = Column(String, nullable=True)
    salario_base = Column(Float, default=0.0)
    meta_economia = Column(Float, default=0.0)
    telefone = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=True)

    transacoes = relationship("FinancaDB", back_populates="dono")
    metas = relationship("MetaDB", back_populates="dono")