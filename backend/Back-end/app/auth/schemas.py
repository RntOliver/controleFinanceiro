from pydantic import BaseModel, Field, field_validator
from typing import Optional

class UsuarioCadastro(BaseModel):
    username: str
    nome_completo: str
    email: str
    senha: str
    salario_base: float = Field(..., ge=0)
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