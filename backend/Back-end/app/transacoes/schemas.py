from pydantic import BaseModel, Field, field_validator

class Financa(BaseModel):
    mes: str
    dia: int = Field(..., ge=1, le=31)  
    despesa: float = Field(..., ge=0)   

    @field_validator('mes')
    def mes_nao_vazio(cls, v):
        if not v.strip():
            raise ValueError('O mês precisa ser selecionado')
        return v.strip().upper()