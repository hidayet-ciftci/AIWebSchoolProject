const { Queue } = require("bullmq");
const IORedis = require("ioredis");
const {
  markMaterialFailed,
  processIngestionData,
} = require("../services/rag/ingestionProcessor");

const QUEUE_NAME = "rag-ingestion";
const QUEUE_PROVIDER = (process.env.QUEUE_PROVIDER || "local").toLowerCase();

let redisConnection = null;
let ingestionQueue = null;

function getRedisConnection() {
  if (redisConnection) return redisConnection;

  if (process.env.REDIS_URL) {
    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  } else {
    redisConnection = new IORedis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  redisConnection.on("error", (error) => {
    console.error("Redis bağlantı hatası:", error.message);
  });

  return redisConnection;
}

function getIngestionQueue() {
  if (ingestionQueue) return ingestionQueue;

  ingestionQueue = new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
  });

  return ingestionQueue;
}

function enqueueLocalFallback(jobData) {
  const jobId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  setImmediate(async () => {
    try {
      const result = await processIngestionData(jobData);
      console.log(`Yerel RAG job tamamlandı: ${jobId}`, result);
    } catch (error) {
      console.error(`Yerel RAG job hata verdi: ${jobId}`, error.message);
      await markMaterialFailed(
        jobData.courseId,
        jobData.materialId,
        error.message,
      ).catch(() => null);
    }
  });

  return {
    id: jobId,
    provider: "local",
  };
}

async function enqueueMaterialIngestion(jobData) {
  if (QUEUE_PROVIDER !== "bullmq") {
    return enqueueLocalFallback(jobData);
  }

  try {
    const queue = getIngestionQueue();

    return await queue.add("ingest-material", jobData, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  } catch (error) {
    console.error(
      "BullMQ kullanılamadı, yerel async fallback devreye alındı:",
      error.message,
    );
    return enqueueLocalFallback(jobData);
  }
}

module.exports = {
  QUEUE_NAME,
  QUEUE_PROVIDER,
  getRedisConnection,
  getIngestionQueue,
  enqueueMaterialIngestion,
};
