const { generatePythonReply } = require("./pythonRagClient");

async function generateReply({
  message,
  user,
  contextChunks = [],
  courseName = "",
}) {
  return generatePythonReply({
    message,
    user,
    contextChunks,
    courseName,
  });
}

module.exports = {
  generateReply,
};
