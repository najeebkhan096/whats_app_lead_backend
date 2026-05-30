import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };

  const queue = new Queue('scan-jobs', { connection });

  try {
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();

    console.log({ waiting, active, completed, failed });

    const jobs = await queue.getJobs(['waiting', 'active']);
    console.log('Jobs:', jobs.map(j => ({ id: j.id, data: j.data })));
  } catch (err) {
    console.error('Queue check failed:', err);
  } finally {
    await queue.close();
    process.exit(0);
  }
}

check();
