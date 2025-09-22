import { createWriteStream, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import cliProgress from "cli-progress";
import { faker } from "@faker-js/faker";
import type { Entity } from "../src/types";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
  .option("count", { type: "number", default: 10 })
  .parseSync();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOTAL = argv.count;
const filePath = resolve(__dirname, "../public/dataset.json");

async function initDataset() {
  const stream = createWriteStream(filePath, { encoding: "utf-8" });

  // Progress bar
  const bar = new cliProgress.SingleBar(
    { format: "Generating [{bar}] {percentage}% | {value}/{total}" },
    cliProgress.Presets.rect
  );
  bar.start(TOTAL, 0);

  async function writeChunk(chunk: string) {
    if (!stream.write(chunk)) {
      await once(stream, "drain");
    }
  }

  await writeChunk("[");
  for (let i = 0; i < TOTAL; i++) {
    const createdAt = faker.date.past();
    const entity: Entity = {
      id: faker.database.mongodbObjectId(),
      name: faker.company.name(),
      country: faker.location.country(),
      sector: faker.commerce.department(),
      updatedAt: faker.date
        .between({ from: createdAt, to: new Date() })
        .toISOString(),
      createdBy: faker.person.fullName(),
      createdAt: createdAt.toISOString(),
    };

    const json = JSON.stringify(entity);
    await writeChunk(i === 0 ? json : "," + json);
    bar.increment();
  }
  await writeChunk("]");
  stream.end();
  bar.stop();
}

initDataset();
