from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse

from .chroma_service import delete_material_chunks
from .config import PY_RAG_SHARED_SECRET
from .errors import ApiError
from .ingestion_service import mark_material_failed, process_ingestion_data
from .ollama_service import generate_reply
from .rag_service import get_rag_context
from .schemas import DeleteMaterialRequest, GenerateRequest, IngestRequest, RagContextRequest


app = FastAPI(title="AIWebSchool Python RAG Service", version="1.0.0")


def _verify_secret(secret: str | None):
    if PY_RAG_SHARED_SECRET and secret != PY_RAG_SHARED_SECRET:
        raise ApiError("Unauthorized python rag request.", 401)


@app.exception_handler(ApiError)
async def handle_api_error(_: Request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "code": exc.code,
        },
    )


@app.exception_handler(Exception)
async def handle_unknown_error(_: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": str(exc)},
    )


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/rag/context")
def rag_context(payload: RagContextRequest, x_rag_secret: str | None = Header(default=None)):
    _verify_secret(x_rag_secret)
    user = payload.user.model_dump() if payload.user else {}
    result = get_rag_context(
        message=payload.message,
        course_id=payload.courseId,
        user=user,
    )
    return result


@app.post("/api/llm/generate")
def llm_generate(payload: GenerateRequest, x_rag_secret: str | None = Header(default=None)):
    _verify_secret(x_rag_secret)
    user = payload.user.model_dump() if payload.user else {}
    reply = generate_reply(
        message=payload.message,
        user=user,
        context_chunks=payload.contextChunks,
        course_name=payload.courseName,
    )
    return {"reply": reply}


@app.post("/api/rag/ingest")
def rag_ingest(payload: IngestRequest, x_rag_secret: str | None = Header(default=None)):
    _verify_secret(x_rag_secret)
    try:
        result = process_ingestion_data(payload.model_dump())
        return result
    except Exception as exc:
        mark_material_failed(payload.courseId, payload.materialId, str(exc))
        raise


@app.post("/api/rag/delete-material")
def rag_delete_material(payload: DeleteMaterialRequest, x_rag_secret: str | None = Header(default=None)):
    _verify_secret(x_rag_secret)
    delete_material_chunks(payload.materialId)
    return {"deleted": True}
