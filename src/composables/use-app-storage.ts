import { createSharedComposable } from "@vueuse/core";

const insertWorker = new Worker(
  new URL("../workers/data-fetching.ts", import.meta.url),
  { type: "module" }
);

export const useAppStorage = createSharedComposable(() => {
  const fetchData = async (): Promise<string[]> => {
    const resourceUrl = "/entities";

    const items: string[] = [];

    return new Promise((resolve) => {
      insertWorker.onmessage = async (event) => {
        if (
          event.data.type === "done" &&
          items.length === event.data.totalCount
        ) {
          resolve(items);
          return;
        }
        items.push(...event.data.chunk);
      };
      insertWorker.postMessage({ resourceUrl });
    });
  };

  return {
    fetchData,
  };
});
