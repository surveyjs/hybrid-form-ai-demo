import { NextResponse } from "next/server";
import type { ProviderInfo } from "@/types";
import { TEST_DATASETS } from "@/data/tests";

export const dynamic = "force-dynamic";

export async function GET() {
  const providers: ProviderInfo[] = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      available: true,
      defaultModel: "gpt-4o",
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: "anthropic",
      available: true,
      defaultModel: "claude-4-sonnet",
    });
  }

  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  let ollamaReachable = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    ollamaReachable = res.ok;
  } catch {
    ollamaReachable = false;
  }

  providers.push({
    name: "ollama",
    available: ollamaReachable,
    defaultModel: "llama3.2-vision",
    ...(ollamaReachable
      ? {}
      : {
          warning:
            "Ollama server not detected. Run `ollama serve` to start it.",
        }),
  });

  const hasAvailable =
    !!process.env.OPENAI_API_KEY ||
    !!process.env.ANTHROPIC_API_KEY ||
    ollamaReachable;

  const testDatasets = TEST_DATASETS.map((d) => ({ id: d.id, text: d.text }));

  return NextResponse.json({ providers, hasAvailable, testDatasets });
}
