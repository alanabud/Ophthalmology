from enum import StrEnum


class PermissionCode(StrEnum):
    TENANT_VIEW = "tenant:view"
    TENANT_MANAGE = "tenant:manage"
    CLINIC_VIEW = "clinic:view"
    CLINIC_MANAGE = "clinic:manage"
    PATIENT_VIEW = "patient:view"
    SCHEDULING_VIEW = "scheduling:view"
    ENCOUNTER_VIEW = "encounter:view"
    BILLING_VIEW = "billing:view"
    AUDIT_VIEW = "audit:view"
    AUDIT_EXPORT = "audit:export"
    AUTH_SESSION_MANAGE = "auth:session_manage"


class RoleCode(StrEnum):
    PLATFORM_ADMIN = "platform_admin"
    TENANT_ADMIN = "tenant_admin"
    CLINIC_MANAGER = "clinic_manager"
    CLINIC_STAFF = "clinic_staff"


ALL_PERMISSION_CODES = tuple(permission.value for permission in PermissionCode)
DEFAULT_ROLE_PERMISSION_MAP = {
    RoleCode.PLATFORM_ADMIN.value: ALL_PERMISSION_CODES,
    RoleCode.TENANT_ADMIN.value: (
        PermissionCode.TENANT_VIEW.value,
        PermissionCode.TENANT_MANAGE.value,
        PermissionCode.CLINIC_VIEW.value,
        PermissionCode.CLINIC_MANAGE.value,
        PermissionCode.PATIENT_VIEW.value,
        PermissionCode.SCHEDULING_VIEW.value,
        PermissionCode.ENCOUNTER_VIEW.value,
        PermissionCode.BILLING_VIEW.value,
        PermissionCode.AUDIT_VIEW.value,
    ),
    RoleCode.CLINIC_MANAGER.value: (
        PermissionCode.CLINIC_VIEW.value,
        PermissionCode.CLINIC_MANAGE.value,
        PermissionCode.PATIENT_VIEW.value,
        PermissionCode.SCHEDULING_VIEW.value,
        PermissionCode.ENCOUNTER_VIEW.value,
        PermissionCode.BILLING_VIEW.value,
    ),
    RoleCode.CLINIC_STAFF.value: (
        PermissionCode.CLINIC_VIEW.value,
        PermissionCode.PATIENT_VIEW.value,
        PermissionCode.SCHEDULING_VIEW.value,
        PermissionCode.ENCOUNTER_VIEW.value,
    ),
}
