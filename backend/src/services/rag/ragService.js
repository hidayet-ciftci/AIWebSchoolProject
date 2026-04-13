const Course = require("../../models/Course");
const { embedTexts } = require("../llmService");
const { queryRelevantChunks } = require("./chromaService");

const DEFAULT_TOP_K = Number(process.env.RAG_TOP_K || 4);
const MAX_DISTANCE = Number(process.env.RAG_MAX_DISTANCE || 0.9);

async function assertCourseAccess({ courseId, user }) {
  const course = await Course.findById(courseId).select(
    "name teacher students",
  );

  if (!course) {
    const err = new Error("İlgili ders bulunamadı.");
    err.statusCode = 404;
    throw err;
  }

  const userId = String(user?.id || "");
  const isAdmin = user?.role === "admin";
  const isTeacher =
    user?.role === "teacher" && String(course.teacher || "") === userId;
  const isStudent =
    user?.role === "student" &&
    Array.isArray(course.students) &&
    course.students.some((studentId) => String(studentId) === userId);

  if (!isAdmin && !isTeacher && !isStudent) {
    const err = new Error("Bu dersin materyallerine erişim yetkiniz yok.");
    err.statusCode = 403;
    throw err;
  }

  return course;
}

async function getRagContext({ message, courseId, user }) {
  if (!courseId) {
    return {
      useRag: false,
      reason: "no-course-id",
      chunks: [],
    };
  }

  const course = await assertCourseAccess({ courseId, user });

  try {
    const embeddings = await embedTexts([message]);
    const queryEmbedding = embeddings[0];

    if (!queryEmbedding) {
      return {
        useRag: false,
        reason: "empty-query-embedding",
        chunks: [],
        course,
      };
    }

    const results = await queryRelevantChunks({
      embedding: queryEmbedding,
      courseId,
      topK: DEFAULT_TOP_K,
    });

    if (!results.length) {
      return {
        useRag: false,
        reason: "no-results",
        chunks: [],
        course,
      };
    }

    const relevantChunks = results.filter((item) => {
      if (typeof item.distance !== "number") return true;
      return item.distance <= MAX_DISTANCE;
    });

    if (!relevantChunks.length) {
      return {
        useRag: false,
        reason: "low-similarity",
        chunks: [],
        course,
      };
    }

    return {
      useRag: true,
      reason: "ok",
      course,
      chunks: relevantChunks.slice(0, DEFAULT_TOP_K).map((item) => ({
        text: item.document,
        distance: item.distance,
        metadata: item.metadata,
      })),
    };
  } catch (error) {
    console.error("RAG retrieval fallback devreye girdi:", error.message);
    return {
      useRag: false,
      reason: "rag-unavailable",
      chunks: [],
      course,
    };
  }
}

module.exports = {
  assertCourseAccess,
  getRagContext,
};
