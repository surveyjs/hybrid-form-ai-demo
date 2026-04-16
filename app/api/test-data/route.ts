import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { TEST_DATASETS } from "@/data/tests";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing 'id' query parameter" }, { status: 400 });
  }

  const dataset = TEST_DATASETS.find((d) => d.id === id);
  if (!dataset) {
    return NextResponse.json({ error: `Test dataset '${id}' not found` }, { status: 404 });
  }

  const dataDir = path.join(process.cwd(), "data");

  try {
    const images = dataset.images.map((filename) => {
      const filePath = path.join(dataDir, filename);
      const buffer = readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase().slice(1);
      const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
      const base64 = buffer.toString("base64");
      return {
        name: filename,
        type: mimeType,
        content: `data:${mimeType};base64,${base64}`,
      };
    });

    const jsonPath = path.join(dataDir, dataset.json);
    const surveyJson = readFileSync(jsonPath, "utf-8");

    return NextResponse.json({ images, surveyJson });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read test data files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
