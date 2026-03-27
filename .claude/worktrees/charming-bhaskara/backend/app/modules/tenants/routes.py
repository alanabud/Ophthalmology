import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.modules.audit.schemas import RequestAuditMetadata
from app.modules.auth.constants import PermissionCode
from app.modules.auth.dependencies import get_request_audit_metadata, require_permissions
from app.modules.auth.schemas import UserContextSnapshot
from app.modules.tenants.schemas import TenantCreateRequest, TenantResponse
from app.modules.tenants.service import TenantService

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get("", response_model=list[TenantResponse])
async def list_tenants(
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.TENANT_VIEW.value)),
    db_session: AsyncSession = Depends(get_db_session),
) -> list[TenantResponse]:
    service = TenantService(db_session)
    return await service.list_tenants(current_user)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: uuid.UUID,
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.TENANT_VIEW.value)),
    db_session: AsyncSession = Depends(get_db_session),
) -> TenantResponse:
    service = TenantService(db_session)
    return await service.get_tenant(tenant_id, current_user)


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreateRequest,
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.TENANT_MANAGE.value)),
    request_metadata: RequestAuditMetadata = Depends(get_request_audit_metadata),
    db_session: AsyncSession = Depends(get_db_session),
) -> TenantResponse:
    service = TenantService(db_session)
    return await service.create_tenant(payload, current_user, request_metadata)
