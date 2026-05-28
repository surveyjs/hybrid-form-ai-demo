import { NextRequest, NextResponse } from "next/server";
import { createExtractor } from "ai-form-response-extractor";
import { openai, anthropic, ollama } from "ai-form-response-extractor/providers";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();

    const provider = formData.get("provider") as string;
    const model = formData.get("model") as string;
    const surveyJsonStr = formData.get("surveyJson") as string;
    const temperatureStr = formData.get("temperature") as string | null;
    const maxTokensStr = formData.get("maxTokens") as string | null;

    if (!provider || !model || !surveyJsonStr) {
      return NextResponse.json(
        { error: "Missing required fields: provider, model, and surveyJson" },
        { status: 400 }
      );
    }

    const allowedProviders = ["openai", "anthropic", "ollama"];
    if (!allowedProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    let surveyJson: Record<string, unknown>;
    try {
      surveyJson = JSON.parse(surveyJsonStr);
      if (typeof surveyJson !== "object" || surveyJson === null) {
        throw new Error("Not an object");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid SurveyJS JSON definition" },
        { status: 400 }
      );
    }

    const imageFiles = formData.getAll("images") as File[];
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one image or PDF is required" },
        { status: 400 }
      );
    }

    const providerMap = { openai, anthropic, ollama } as const;
    const createProvider = providerMap[provider as keyof typeof providerMap];
    const providerInstance = createProvider(model);

    const extractor = createExtractor({
      provider: providerInstance,
      adapter: "surveyjs",
      options: {
        confidenceThreshold: 0.75,
        maxRetries: 2,
        ...(temperatureStr ? { temperature: parseFloat(temperatureStr) } : {}),
        ...(maxTokensStr ? { maxTokens: parseInt(maxTokensStr, 10) } : {}),
      },
    });

    const imageBuffers: Buffer[] = [];
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer();
      imageBuffers.push(Buffer.from(arrayBuffer));
    }

    let allData: Record<string, unknown> = {};
    let allConfidence: Record<string, number | null> = {};
    let uniqueId: string | undefined;
    let extractionError: string | undefined;

    for (const buffer of imageBuffers) {
      try {
        const result = await extractor.extractFromImage({
          image: buffer,
          formDefinition: surveyJson,
        });

        // result.confidence is FieldConfidence[] with { fieldName, confidence, flagged }.
        // confidence is `number | null`; null means "no signal" (e.g. the model
        // confidently returned the field as empty without a numeric score).
        const confidenceMap: Record<string, number | null> = {};
        for (const fc of result.confidence) {
          confidenceMap[fc.fieldName] = fc.confidence;
        }

        for (const [key, value] of Object.entries(result.data || {})) {
          const newConf = confidenceMap[key] ?? null;
          const existingConf = allConfidence[key] ?? null;
          // A numeric confidence always wins over null; among numerics, higher wins.
          // null is only kept when nothing better has been seen for this field.
          const newScore = newConf ?? -1;
          const existingScore = key in allConfidence ? existingConf ?? -1 : -Infinity;
          if (newScore >= existingScore) {
            allData[key] = value;
            allConfidence[key] = newConf;
          }
        }

        if (result.uniqueId && !uniqueId) {
          uniqueId = result.uniqueId;
        }
      } catch (err) {
        extractionError = err instanceof Error ? err.message : "Extraction failed";
        break;
      }
    }

    if (extractionError) {
      return NextResponse.json(
        { error: extractionError, partialData: allData },
        { status: 500 }
      );
    }

    const processingTime = Date.now() - startTime;

    // Only fields with a numeric confidence count toward the metric. Fields
    // scored null (correctly-empty / no signal) are excluded so they don't
    // drag the average down or get flagged as low-confidence.
    const scoredValues = Object.values(allConfidence).filter(
      (c): c is number => c !== null
    );
    const overallConfidence =
      scoredValues.length > 0
        ? scoredValues.reduce((a, b) => a + b, 0) / scoredValues.length
        : 0;

    const lowConfidenceFields = Object.entries(allConfidence)
      .filter(([, score]) => score !== null && score < 0.75)
      .map(([field]) => field);

    return NextResponse.json({
      data: allData,
      uniqueId,
      confidence: allConfidence,
      overallConfidence,
      lowConfidenceFields,
      processingTime,
      model,
      provider,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    const userMessage =
      message.includes('Digital PDF inputs require the optional "sharp" dependency to be installed')
        ? 'Digital PDF inputs require the optional "sharp" dependency. Install it in the app runtime environment and retry, or upload image files instead.'
        : message;
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
