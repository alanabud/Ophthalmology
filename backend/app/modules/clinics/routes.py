import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.modules.audit.schemas import RequestAuditMetadata
from app.modules.auth.constants import PermissionCode
from app.modules.auth.dependencies import get_request_audit_metadata, require_permissions
from app.modules.auth.schemas import UserContextSnapshot
from app.modules.clinics.schemas import ClinicCreateRequest, ClinicResponse
from app.modules.clinics.service import ClinicService

router = APIRouter(prefix="/clinics", tags=["Clinics"])


@router.get("", response_model=list[ClinicResponse])
async def list_clinics(
    tenant_id: uuid.UUID | None = None,
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.CLINIC_VIEW.value)),
    db_session: AsyncSession = Depends(get_db_session),
) -> list[ClinicResponse]:
    service = ClinicService(db_session)
    return await service.list_clinics(current_user, tenant_id)


@router.get("/{clinic_id}", response_model=ClinicResponse)
async def get_clinic(
    clinic_id: uuid.UUID,
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.CLINIC_VIEW.value)),
    db_session: AsyncSession = Depends(get_db_session),
) -> ClinicResponse:
    service = ClinicService(db_session)
    return await service.get_clinic(clinic_id, current_user)


@router.post("", response_model=ClinicResponse, status_code=status.HTTP_201_CREATED)
async def create_clinic(
    payload: ClinicCreateRequest,
    current_user: UserContextSnapshot = Depends(require_permissions(PermissionCode.CLINIC_MANAGE.value)),
    request_metadata: RequestAuditMetadata = Depends(get_request_audit_metadata),
    db_session: AsyncSession = Depends(get_db_session),
) -> ClinicResponse:
    service = ClinicService(db_session)
    return await service.create_clinic(payload, current_user, request_metadata)
