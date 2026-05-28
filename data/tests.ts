import { readdirSync, statSync } from "fs";
import path from "path";

export interface TestDataset {
  id: string;
  text: string;
}

const DATA_DIR = path.join(process.cwd(), "data");

function dirNameToTitle(dirName: string): string {
  return dirName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Pdf", "PDF");
}

export function getTestDatasets(): TestDataset[] {
  const entries = readdirSync(DATA_DIR);
  const datasets: TestDataset[] = [];
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9]/.test(entry)) continue;
    const fullPath = path.join(DATA_DIR, entry);
    if (statSync(fullPath).isDirectory()) {
      const formPath = path.join(fullPath, "form.json");
      try {
        statSync(formPath);
      } catch {
        continue;
      }
      datasets.push({
        id: entry,
        text: dirNameToTitle(entry),
      });
    }
  }
  return datasets;
}
