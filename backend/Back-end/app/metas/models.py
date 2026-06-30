from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class MetaDB(Base):
    __tablename__ = "metas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    valor_alvo = Column(Float, nullable=False)
    valor_atual = Column(Float, default=0.0)
    prazo = Column(String, nullable=True) 
    status = Column(String, default="ativa") # ativa, concluida, interrompida
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    dono = relationship("app.auth.utils.UsuarioDB", back_populates="metas")