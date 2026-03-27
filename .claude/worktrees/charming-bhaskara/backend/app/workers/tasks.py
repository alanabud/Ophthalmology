import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="audit.export")
def export_audit_events(tenant_id: str) -> dict[str, str]:
    logger.info("audit_export_requested", extra={"event": "audit_export_requested", "tenant_id": tenant_id})
    return {"status": "queued", "tenant_id": tenant_id}


@celery_app.task(name="scheduling.send_reminder")
def send_appointment_reminder(appointment_id: str) -> dict[str, str]:
    logger.info(
        "appointment_reminder_requested",
        extra={"event": "appointment_reminder_requested", "appointment_id": appointment_id},
    )
    return {"status": "queued", "appointment_id": appointment_id}
