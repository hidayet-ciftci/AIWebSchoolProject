class ApiError(Exception):
    def __init__(self, message: str, status_code: int = 500, code: str | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def is_runner_terminated_message(message: str) -> bool:
    normalized = (message or "").lower()
    return "runner process has terminated" in normalized
