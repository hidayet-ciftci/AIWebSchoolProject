from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse, StreamingResponse

from .config import PY_RAG_SHARED_SECRET
from .errors import ApiError
from .parsing.ingestion_service import mark_material_failed, process_ingestion_data
from .llm.ollama_service import generate_reply, generate_stream
from .retrieval.qdrant_service import delete_material_chunks
from .retrieval.rag_service import get_rag_context
from .schemas import DeleteMaterialRequest, GenerateRequest, IngestRequest, RagContextRequest, StreamRequest


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


@app.post("/api/llm/stream")
async def llm_stream(payload: StreamRequest, x_rag_secret: str | None = Header(default=None)):
    """SSE streaming endpoint — yields tokens as 'data: <token>\\n\\n'."""
    _verify_secret(x_rag_secret)
    user = payload.user.model_dump() if payload.user else {}

    async def event_generator():
        try:
            async for token in generate_stream(
                message=payload.message,
                user=user,
                context_chunks=payload.contextChunks,
                course_name=payload.courseName,
            ):
                # Escape newlines inside token so SSE framing is not broken
                safe_token = token.replace("\n", "\\n")
                yield f"data: {safe_token}\n\n"
        except ApiError as exc:
            yield f"data: [ERROR] {exc.message}\n\n"
        except Exception as exc:
            yield f"data: [ERROR] {exc}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


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
