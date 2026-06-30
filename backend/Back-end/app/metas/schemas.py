from pydantic import BaseModel
from typing import Optional

class MetaCreate(BaseModel):
    nome: str
    valor_alvo: float
    valor_atual: Optional[float] = 0.0
    prazo: Optional[str] = None

class MetaAporte(BaseModel):
    valor: float

class MetaStatusUpdate(BaseModel):
    status: str