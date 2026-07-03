# ✅ Adicionar validação no MetaStatusUpdate
from pydantic import BaseModel, field_validator
from typing import Optional

class MetaStatusUpdate(BaseModel):
    status: str

    @field_validator('status')
    def status_valido(cls, v):
        permitidos = ["ativa", "concluida", "interrompida"]
        if v not in permitidos:
            raise ValueError(f"Status deve ser um de: {permitidos}")
        return v