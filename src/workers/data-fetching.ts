import Dexie from "dexie";

import { processStepsAsync } from "../utils";
import { DATA_COUNT } from "./dataset-generation";

const CHUNK_COUNT = 25;

const initWorker = new Worker(
  new URL("./dataset-generation.ts", import.meta.url),
  { type: "module" }
);

self.onmessage = async ({ data }) => {
  const resourceUrl = data.resourceUrl as string;

  const database = new Dexie(resourceUrl);

  database.version(1).stores({ chunks: "id" });

  await database.open();

  const chunksTable = database.table<{ id: string; items: any[] }>("chunks");
  const chunksTableCount = await chunksTable.count();

  const isResourceInitialized = chunksTableCount > 0;

  if (isResourceInitialized) {
    const chunks = await chunksTable.toArray();
    const totalCount = DATA_COUNT;

    console.log("Chunks detected");

    processStepsAsync(
      chunks.length,
      (stepIndex) => {
        self.postMessage({ chunk: chunks[stepIndex].items, totalCount });
      },
      {
        onComplete: async () => {
          console.log("Chunks transferred successfully");
          self.postMessage({
            type: "done",
            totalCount,
          });
        },
      }
    );
    return;
  }

  let itemsToInsert: any = [];

  const generateDataset = () => {
    return new Promise((resolve) => {
      initWorker.onmessage = (_event) => {
        if (_event.data.type === "done") {
          self.postMessage({
            type: "done",
            totalCount: _event.data.totalCount,
          });
          resolve("done");
          return;
        }

        const parsedChunk = _event.data.chunk.map((item: unknown) =>
          JSON.stringify(item)
        );

        itemsToInsert = itemsToInsert.concat(parsedChunk);

        self.postMessage({
          chunk: parsedChunk,
          totalCount: _event.data.totalCount,
        });
      };
      initWorker.postMessage(null);
    });
  };

  console.log("Dataset generation");

  await generateDataset();

  const batchSize = itemsToInsert.length / CHUNK_COUNT;

  console.log("DB insertion");

  processStepsAsync(CHUNK_COUNT, async (stepIndex) => {
    const offset = stepIndex * batchSize;
    const limit = offset + batchSize;
    const itemsChunk = itemsToInsert.slice(offset, limit);
    await database.table("chunks").add({ id: stepIndex, items: itemsChunk });
  });
};
