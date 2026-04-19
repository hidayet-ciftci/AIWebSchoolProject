const { getPythonRagContext } = require("../pythonRagClient");

async function assertCourseAccess() {
  const err = new Error(
    "assertCourseAccess is moved to python rag service and is not callable from Node.",
  );
  err.statusCode = 500;
  throw err;
}

async function getRagContext({ message, courseId, user }) {
  return getPythonRagContext({
    message,
    courseId,
    user,
  });
}

module.exports = {
  assertCourseAccess,
  getRagContext,
};
