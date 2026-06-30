from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

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
    
    dono = relationship("app.auth.utils.UsuarioDB", back_populates="transacoes")