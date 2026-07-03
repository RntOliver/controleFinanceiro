import hashlib
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from app.auth.models import UsuarioDB


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