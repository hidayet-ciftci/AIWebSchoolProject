from pydantic import BaseModel, Field


class UserCtx(BaseModel):
    id: str | None = None
    role: str | None = None
    name: str | None = None
    surname: str | None = None


class RagContextRequest(BaseModel):
    message: str
    courseId: str | None = None
    user: UserCtx | None = None


class GenerateRequest(BaseModel):
    message: str
    user: UserCtx | None = None
    contextChunks: list[dict] = Field(default_factory=list)
    courseName: str = ""


class IngestRequest(BaseModel):
    courseId: str
    materialId: str
    filePath: str
    fileName: str = ""
    mimeType: str = ""


class DeleteMaterialRequest(BaseModel):
    materialId: str
