import { faker } from "@faker-js/faker";
import { random, capitalize, camelCase } from "lodash-es";

import type { Entity, Indicator } from "../types";
import { processStepsAsync } from "../utils";

export const DATA_COUNT = 500_000;
const CHUNK_COUNT = 100;
const BATCH_SIZE = DATA_COUNT / CHUNK_COUNT;

export const FAKE_INDICATOR_GROUP: Indicator[] = Array.from(
  Array(2).keys()
).map(() => {
  const name = faker.company.buzzPhrase();
  return {
    id: faker.database.mongodbObjectId(),
    name: capitalize(name),
    providerName: "msci",
    technicalName: camelCase(name),
    technicalType: "integer",
    type: "raw",
  };
});

const generateFakeEntity = (): Entity => {
  return {
    id: faker.database.mongodbObjectId(),
    name: faker.company.name(),
    country: faker.location.country(),
    sector: faker.commerce.department(),
    type: ["entity"],
    indicators: FAKE_INDICATOR_GROUP.map((i) => ({
      ...i,
      value: faker.number
        .float({ fractionDigits: 2, min: 1, max: 10 })
        .toString(),
    })),
    linkedLists: Array.from(Array(random(0, 2)).keys()).map(() => ({
      id: faker.database.mongodbObjectId(),
      name: faker.company.catchPhrase(),
    })),
    linkedListsCount: 0,
  };
};

self.onmessage = async () => {
  console.time("Dataset generation");
  await processStepsAsync(
    CHUNK_COUNT,
    (stepIndex) => {
      self.postMessage({
        chunk: Array.from({ length: BATCH_SIZE }, generateFakeEntity),
        totalCount: DATA_COUNT,
      });
    },
    {
      onComplete: () => {
        self.postMessage({ type: "done", totalCount: DATA_COUNT });
        console.timeEnd("Dataset generation");
      },
    }
  );
};
