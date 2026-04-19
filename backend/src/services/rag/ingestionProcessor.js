const Course = require("../../models/Course");
const { ingestMaterial } = require("../pythonRagClient");

async function updateMaterialState(courseId, materialId, fields) {
  const setObject = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [`materials.$.${key}`, value]),
  );

  await Course.updateOne(
    { _id: courseId, "materials._id": materialId },
    { $set: setObject },
  );
}

async function markMaterialFailed(courseId, materialId, errorMessage) {
  await updateMaterialState(courseId, materialId, {
    status: "failed",
    indexingError: errorMessage,
  });
}

async function processIngestionData(jobData) {
  return ingestMaterial(jobData);
}

module.exports = {
  updateMaterialState,
  markMaterialFailed,
  processIngestionData,
};
