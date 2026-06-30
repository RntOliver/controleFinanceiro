from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine

# Importação dos Routers Compartimentados
from app.auth.router import router as auth_router
from app.transacoes.router import router as transacoes_router
from app.metas.router import router as metas_router

app = FastAPI(title="RNT FINANCE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Inicializa as tabelas do banco de dados unificado
Base.metadata.create_all(bind=engine)

# Inclusão dos Compartimentos na API
app.include_router(auth_router, prefix="/auth", tags=["Autenticação & Perfil"])
app.include_router(transacoes_router, prefix="/transacoes", tags=["Transações Financeiras"])
app.include_router(metas_router, prefix="/metas", tags=["Metas de Economia"])

@app.get("/")
def home():
    return {"status": "RNT Finance API rodando 100% de forma modular!"}