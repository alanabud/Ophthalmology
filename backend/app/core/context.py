from contextvars import ContextVar

_request_id_context: ContextVar[str | None] = ContextVar("request_id", default=None)


def set_request_id(request_id: str | None) -> None:
    _request_id_context.set(request_id)


def get_request_id() -> str | None:
    return _request_id_context.get()
