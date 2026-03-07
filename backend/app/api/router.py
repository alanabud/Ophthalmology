from fastapi import APIRouter

from app.modules.audit.routes import router as audit_router
from app.modules.auth.routes import router as auth_router
from app.modules.clinics.routes import router as clinics_router
from app.modules.tenants.routes import router as tenants_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(clinics_router)
api_router.include_router(audit_router)
