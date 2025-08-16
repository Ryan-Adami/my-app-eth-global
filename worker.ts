// eslint-disable-next-line
// @ts-ignore Generated during build
import { default as handler } from "./.open-next/worker.js";

export default {
  fetch: handler.fetch,
  async queue(batch): Promise<void> {
    for (const message of batch.messages) {
      try {
        // add logic
      } catch (error) {
        console.error(`Error processing message: ${message.id}`, error);
      }
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;

// eslint-disable-next-line
// @ts-ignore Generated during build
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
