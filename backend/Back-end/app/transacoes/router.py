from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from app.auth.models import UsuarioDB
from app.auth.utils import obter_usuario_atual
from app.transacoes.models import FinancaDB
from app.transacoes.schemas import Financa

router = APIRouter()

@router.post("/calcular")
async def calcular(item: Financa, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    salario_atual = usuario_atual.salario_base or 0.0 
    lucro_calculado = salario_atual - item.despesa 
    
    nova_transacao = FinancaDB(
        nome=usuario_atual.username.upper(), 
        mes=item.mes,
        dia=item.dia,
        salario=salario_atual,
        despesa=item.despesa,
        lucro=lucro_calculado,
        usuario_id=usuario_atual.id 
    )
    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao)
    
    return {
        "id": nova_transacao.id, 
        "nome": nova_transacao.nome, 
        "mes": nova_transacao.mes,
        "dia": nova_transacao.dia,
        "salario": nova_transacao.salario, 
        "despesa": nova_transacao.despesa, 
        "lucro": nova_transacao.lucro
    }

@router.get("")
async def listar_transacoes(usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    if usuario_atual.is_admin:
        transacoes = db.query(FinancaDB).all()
    else:
        transacoes = db.query(FinancaDB).filter(FinancaDB.usuario_id == usuario_atual.id).all()
        
    return [
        {
            "id": t.id,
            "nome": t.nome,
            "mes": t.mes,
            "dia": t.dia,
            "salario": t.salario,
            "despesa": t.despesa,
            "lucro": t.lucro
        }
        for t in transacoes
    ]

@router.delete("/{id_transacao}")
async def deletar_transacao(id_transacao: int, usuario_atual: UsuarioDB = Depends(obter_usuario_atual), db: Session = Depends(get_db)):
    if usuario_atual.is_admin:
        item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao).first()
    else:
        item_banco = db.query(FinancaDB).filter(FinancaDB.id == id_transacao, FinancaDB.usuario_id == usuario_atual.id).first()
    
    if item_banco:
        db.delete(item_banco)
        db.commit()
        return {"mensagem": "Excluído com sucesso!"}
    
    raise HTTPException(status_code=404, detail="Registro não encontrado ou acesso não autorizado.")