require("dotenv").config();
const mongoose = require("mongoose");
const { Worker } = require("bullmq");
const {
  QUEUE_NAME,
  QUEUE_PROVIDER,
  getRedisConnection,
} = require("../queue/ragIngestionQueue");
const {
  markMaterialFailed,
  processIngestionData,
} = require("../services/rag/ingestionProcessor");

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("RAG worker MongoDB bağlantısı kuruldu.");
}

async function processIngestionJob(job) {
  return processIngestionData(job.data);
}

async function startWorker() {
  if (QUEUE_PROVIDER !== "bullmq") {
    console.log(
      `QUEUE_PROVIDER=${QUEUE_PROVIDER}. Yerel async mod aktif, ayrı worker zorunlu değil.`,
    );
    return null;
  }

  await connectDatabase();

  const worker = new Worker(QUEUE_NAME, processIngestionJob, {
    connection: getRedisConnection(),
    concurrency: 1,
  });

  worker.on("completed", (job, result) => {
    console.log(`RAG job tamamlandı: ${job.id}`, result);
  });

  worker.on("failed", async (job, error) => {
    console.error(`RAG job hata verdi: ${job?.id}`, error.message);

    if (job?.data?.courseId && job?.data?.materialId) {
      await markMaterialFailed(
        job.data.courseId,
        job.data.materialId,
        error.message,
      ).catch((updateError) => {
        console.error("Material status güncellenemedi:", updateError.message);
      });
    }
  });

  console.log("RAG worker hazır ve queue dinliyor.");
  return worker;
}

if (require.main === module) {
  startWorker().catch((error) => {
    console.error("RAG worker başlatılamadı:", error);
    process.exit(1);
  });
}

module.exports = {
  startWorker,
};
