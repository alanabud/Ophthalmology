import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthorizationError
from app.db.session import get_db_session
from app.modules.audit.schemas import AuditLogResponse
from app.modules.audit.service import AuditService
from app.modules.auth.constants import PermissionCode
from app.modules.auth.dependencies import require_permissions
from app.modules.auth.schemas import UserContextSnapshot

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs", response_model=list[AuditLogResponse])
async def list_audit_logs(
    tenant_id: uuid.UUID | None = None,
    clinic_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    resource_type: str | None = None,
    action: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.AUDIT_VIEW.value)),
    db_session: AsyncSession = Depends(get_db_session),
) -> list[AuditLogResponse]:
    if tenant_id is not None and not current_user.user.is_superuser and tenant_id not in current_user.accessible_tenant_ids:
        raise AuthorizationError("Requested tenant is not accessible.")
    if clinic_id is not None and not current_user.user.is_superuser and clinic_id not in current_user.accessible_clinic_ids:
        raise AuthorizationError("Requested clinic is not accessible.")

    service = AuditService(db_session)
    return await service.list_events(
        tenant_id=tenant_id,
        clinic_id=clinic_id,
        actor_user_id=actor_user_id,
        resource_type=resource_type,
        action=action,
        limit=limit,
        offset=offset,
        allowed_tenant_ids=None if current_user.user.is_superuser else current_user.accessible_tenant_ids,
    )
