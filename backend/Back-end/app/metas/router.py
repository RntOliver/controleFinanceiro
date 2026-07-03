from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.auth.utils import obter_usuario_atual
from app.metas.models import UsuarioDB, MetaDB
from app.metas.schemas import MetaCreate, MetaAporte, MetaStatusUpdate

router = APIRouter()

@router.get("")
async def listar_metas(usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    return db.query(MetaDB).filter(MetaDB.usuario_id == usuario_atual.id).all()

@router.post("")
async def criar_meta(meta: MetaCreate, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    nova_meta = MetaDB(
        nome=meta.nome,
        valor_alvo=meta.valor_alvo,
        valor_atual=meta.valor_atual,
        prazo=meta.prazo,
        usuario_id=usuario_atual.id
    )
    db.add(nova_meta)
    db.commit()
    db.refresh(nova_meta)
    return nova_meta

@router.put("/{id_meta}/aporte")
async def fazer_aporte(id_meta: int, aporte: MetaAporte, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    meta = db.query(MetaDB).filter(MetaDB.id == id_meta, MetaDB.usuario_id == usuario_atual.id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada.")
    
    meta.valor_atual += aporte.valor
    
    if meta.valor_atual >= meta.valor_alvo:
        meta.status = "concluida"
        
    db.commit()
    db.refresh(meta)
    return meta

@router.put("/{id_meta}/status")
async def atualizar_status(id_meta: int, status_data: MetaStatusUpdate, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    meta = db.query(MetaDB).filter(MetaDB.id == id_meta, MetaDB.usuario_id == usuario_atual.id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada.")
    
    meta.status = status_data.status
    db.commit()
    return {"mensagem": f"Status atualizado para {status_data.status}"}

@router.delete("/{id_meta}")
async def deletar_meta(id_meta: int, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    meta = db.query(MetaDB).filter(MetaDB.id == id_meta, MetaDB.usuario_id == usuario_atual.id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada.")
    
    db.delete(meta)
    db.commit()
    return {"mensagem": "Meta removida com sucesso."}