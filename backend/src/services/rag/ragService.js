const { getPythonRagContext } = require("../pythonRagClient");

async function getRagContext({ message, courseId, user }) {
  return getPythonRagContext({
    message,
    courseId,
    user,
  });
}

module.exports = {
  getRagContext,
};
