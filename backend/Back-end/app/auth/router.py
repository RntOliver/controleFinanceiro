import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.auth.models import UsuarioDB
from app.auth.utils import UsuarioDB, gerar_hash_senha, obter_usuario_atual
from app.auth.schemas import UsuarioCadastro, UsuarioLogin, UsuarioPerfil

router = APIRouter()

@router.post("/registrar")
async def registrar_usuario(usuario: UsuarioCadastro, db: Session = Depends(get_db)): 
    seu_email_admin = "re83375741@gmail.com"
    
    email_existente = db.query(UsuarioDB).filter(UsuarioDB.email == usuario.email).first()
    if email_existente:
        raise HTTPException(status_code=400, detail="Este endereço de e-mail já está cadastrado.")
    
    tornar_admin = True if usuario.email.lower() == seu_email_admin else usuario.is_admin

    novo_usuario = UsuarioDB(
        username=usuario.username,
        email=usuario.email,
        senha_criptografada=gerar_hash_senha(usuario.senha),
        is_admin=tornar_admin,
        nome_completo=usuario.nome_completo,
        salario_base=usuario.salario_base
    )
    db.add(novo_usuario)
    db.commit()
    
    return {"mensagem": f"Usuário {'Administrador' if tornar_admin else 'Cliente'} registrado com sucesso!"}

@router.post("/login")
async def login(usuario: UsuarioLogin, db: Session = Depends(get_db)):
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

@router.get("/perfil")
async def obter_perfil(usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_atual.id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    return {
        "nome_completo": usuario.nome_completo or "",
        "profissao": usuario.profissao or "",
        "salario_base": usuario.salario_base or 0.0,
        "meta_economia": usuario.meta_economia or 0.0,
        "email": usuario.email,
        "telefone": usuario.telefone or "",
        "foto_perfil": usuario.foto_perfil or ""
    }

@router.put("/perfil")
async def atualizar_perfil(perfil: UsuarioPerfil, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_atual.id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    if perfil.email and perfil.email.strip().lower() != usuario.email.lower():
        email_duplicado = db.query(UsuarioDB).filter(UsuarioDB.email == perfil.email.strip().lower()).first()
        if email_duplicado:
            raise HTTPException(status_code=400, detail="Este e-mail já está sendo usado por outro usuário.")
        usuario.email = perfil.email.strip().lower()
    
    usuario.nome_completo = perfil.nome_completo
    usuario.profissao = perfil.profissao
    usuario.salario_base = perfil.salario_base
    usuario.meta_economia = perfil.meta_economia
    usuario.telefone = perfil.telefone
    usuario.foto_perfil = perfil.foto_perfil

    db.commit()
    return {"mensagem": "Perfil updated com sucesso!"}