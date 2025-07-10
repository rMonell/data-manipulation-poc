import { createSharedComposable } from "@vueuse/core";

import type { Entity } from "dexie";
import type { Ref } from "vue";

const insertWorker = new Worker(
  new URL("../workers/data-fetching.ts", import.meta.url),
  { type: "module" }
);

export const useAppStorage = createSharedComposable(() => {
  const fetchData = async (source: Ref<Entity[]>): Promise<Entity[]> => {
    const resourceUrl = "/entities";

    return new Promise((resolve) => {
      insertWorker.onmessage = async (event) => {
        if (
          event.data.type === "done" &&
          source.value.length === event.data.totalCount
        ) {
          resolve(event.data);
          return;
        }
        source.value.push(...event.data.chunk);
      };
      insertWorker.postMessage({ resourceUrl });
    });
  };

  return {
    fetchData,
  };
});
