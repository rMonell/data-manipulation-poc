import { createWriteStream, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import cliProgress from "cli-progress";
import { faker } from "@faker-js/faker";
import type { ColumnMetaData, TableItem } from "../src/types";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("count", { type: "number", default: 10 })
  .option("cols", { type: "number", default: 5 })
  .parseSync();

const ITEMS_COUNT = argv.count;
const COLUMNS_COUNT = argv.cols;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dirPath = resolve(__dirname, "../public");
const filePath = resolve(dirPath, "dataset.json");

const columnsType: ColumnMetaData["type"][] = ["date", "number", "text", "set"];

const columns = Array.from({ length: COLUMNS_COUNT }).reduce<ColumnMetaData[]>(
  (acc) => {
    return [
      ...acc,
      {
        id: faker.database.mongodbObjectId(),
        label: faker.lorem.words({ min: 1, max: 3 }),
        type: faker.helpers.arrayElement(columnsType),
      },
    ];
  },
  []
);

const categories = columns.reduce<Record<string, string[]>>((acc, column) => {
  return {
    ...acc,
    [column.id]: faker.helpers.arrayElement([
      faker.helpers.uniqueArray(faker.animal.cetacean, 50),
      faker.helpers.uniqueArray(faker.commerce.department, 50),
      faker.helpers.uniqueArray(faker.commerce.product, 50),
      faker.helpers.uniqueArray(faker.location.country, 15),
    ]),
  };
}, {});

mkdirSync(dirPath, { recursive: true });

writeFileSync(
  resolve(dirPath, "columns-metadata.json"),
  JSON.stringify(columns),
  "utf-8"
);

async function initDataset() {
  const stream = createWriteStream(filePath, { encoding: "utf-8" });

  const progressBar = new cliProgress.SingleBar(
    { format: "Generating [{bar}] {percentage}% | {value}/{total}" },
    cliProgress.Presets.rect
  );
  progressBar.start(ITEMS_COUNT, 0);

  async function writeChunk(chunk: string) {
    if (!stream.write(chunk)) {
      await once(stream, "drain");
    }
  }

  await writeChunk("[");
  for (let i = 0; i < ITEMS_COUNT; i++) {
    const entity: TableItem = columns.reduce<TableItem>(
      (acc, column) => {
        let value: TableItem[string];

        if (column.type === "set") {
          value = faker.helpers.arrayElement(categories[column.id]);
        }
        if (column.type === "text") {
          value = faker.lorem.words({ min: 1, max: 5 });
        }
        if (column.type === "number") {
          value = faker.helpers.arrayElement([
            faker.number.int(),
            faker.number.float({ fractionDigits: 1, min: 0, max: 200 }),
          ]);
        }
        if (column.type === "date") {
          value = faker.date.past();
        }

        return { ...acc, [column.id]: value };
      },
      { id: faker.database.mongodbObjectId() }
    );

    const json = JSON.stringify(entity);
    await writeChunk(i === 0 ? json : "," + json);
    progressBar.increment();
  }

  await writeChunk("]");

  stream.end();
  progressBar.stop();
}

initDataset();
