import { initializeWorker } from './scanWorker';

/**
 * Main worker entry point
 */
async function main(): Promise<void> {
  await initializeWorker();
}

main().catch((error) => {
  console.error('Failed to start workers:', error);
  process.exit(1);
});

export default main;
