"use client";

import { useMemo, useRef } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import type { ProviderInfo, SetupData } from "@/types";

interface TestDatasetChoice {
  id: string;
  text: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  ollama: "Ollama",
};

interface SetupWizardProps {
  providers: ProviderInfo[];
  testDatasets: TestDatasetChoice[];
  onComplete: (data: SetupData) => void;
}

export default function SetupWizard({
  providers,
  testDatasets,
  onComplete,
}: SetupWizardProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const survey = useMemo(() => {
    const providerChoices = providers.map((p) => ({
      value: p.name,
      text:
        (PROVIDER_LABELS[p.name] || p.name) + (p.warning ? " ⚠️" : ""),
    }));

    const ollamaProvider = providers.find((p) => p.name === "ollama");
    const ollamaWarning = ollamaProvider?.warning;

    const testDataChoices = [
      { value: "custom", text: "Custom - I will provide my own images/PDFs and JSON definition" },
      ...testDatasets.map((d) => ({ value: d.id, text: d.text })),
    ];

    const surveyJson = {
      title: "Hybrid Form AI Demo - Test Paper Form Extraction",
      description:
        "Configure your LLM provider, upload scanned images or digital PDFs, and provide a SurveyJS JSON definition to see intelligent extraction in action.",
      showProgressBar: "top",
      progressBarType: "pages",
      completeText: "Process with AI",
      pages: [
        {
          name: "setup",
          title: "Setup",
          elements: [
            {
              type: "dropdown",
              name: "provider",
              title: "Choose LLM Provider",
              description:
                "Select the AI provider to use for form extraction." +
                (ollamaWarning
                  ? ` ⚠️ ${ollamaWarning}`
                  : ""),
              isRequired: true,
              choices: providerChoices,
            },
            {
              type: "text",
              name: "model",
              title: "Model Name",
              description:
                "The model to use for extraction. A default is set based on your provider selection.",
              isRequired: true,
            },
            {
              type: "html",
              name: "apiKeyInfo",
              html: '<div style="padding:8px 12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;color:#065f46;font-size:14px;">✓ API Key is configured securely on the server</div>',
            },
            {
              type: "text",
              name: "temperature",
              title: "Temperature",
              description:
                "Controls randomness in the output (0-2). Lower values produce more deterministic results.",
              inputType: "number",
              defaultValue: 0.1,
              min: 0,
              max: 2,
              step: 0.1,
            },
            {
              type: "text",
              name: "maxTokens",
              title: "Max Tokens",
              description:
                "Maximum number of tokens in the LLM response.",
              inputType: "number",
              defaultValue: 16384,
              min: 100,
              max: 128000,
            },
          ],
        },
        {
          name: "testData",
          title: "Test Data",
          elements: [
            {
              type: "radiogroup",
              name: "testData",
              title: "Select Test Data",
              description:
                "Choose a predefined test dataset or use your own custom images/PDFs and form definition.",
              isRequired: true,
              defaultValue: "custom",
              choices: testDataChoices,
            },
          ],
        },
        {
          name: "images",
          title: "Image/PDF Upload",
          elements: [
            {
              type: "file",
              name: "images",
              title: "Upload Scanned Form Images or Digital PDFs",
              description:
                "Drag & drop or click to upload scanned/photographed forms or digital PDFs. Supports PNG, JPG, TIFF, PDF, and other common formats.",
              acceptedTypes: "image/*,.pdf,application/pdf",
              allowMultiple: true,
              isRequired: true,
              storeDataAsText: true,
              maxSize: 10485760,
              waitForUpload: true,
              enableIf: "{testData} = 'custom'",
            },
          ],
        },
        {
          name: "surveyJson",
          title: "SurveyJS Form Definition",
          elements: [
            {
              type: "comment",
              name: "surveyJsonText",
              title: "SurveyJS JSON Definition",
              description:
                "Paste a valid SurveyJS JSON form definition. This defines the fields that should be extracted from uploaded images/PDFs.",
              isRequired: true,
              rows: 20,
              placeholder:
                '{\n  "pages": [\n    {\n      "elements": [\n        {\n          "type": "text",\n          "name": "firstName",\n          "title": "First Name"\n        },\n        {\n          "type": "text",\n          "name": "lastName",\n          "title": "Last Name"\n        }\n      ]\n    }\n  ]\n}',
              enableIf: "{testData} = 'custom'",
            },
          ],
        },
      ],
    };

    const model = new Model(surveyJson);

    // Set default provider and model
    if (providers.length > 0) {
      const firstAvailable =
        providers.find((p) => p.available && !p.warning) || providers[0];
      model.setValue("provider", firstAvailable.name);
      model.setValue("model", firstAvailable.defaultModel);
    }

    // Update model name when provider changes
    model.onValueChanged.add((sender, options) => {
      if (options.name === "provider") {
        const selected = providers.find((p) => p.name === options.value);
        if (selected) {
          sender.setValue("model", selected.defaultModel);
        }
      }

      // Load test data when a predefined test is selected
      if (options.name === "testData" && options.value !== "custom") {
        fetch(`/api/test-data?id=${encodeURIComponent(options.value)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.images) {
              sender.setValue("images", data.images);
            }
            if (data.surveyJson) {
              sender.setValue("surveyJsonText", data.surveyJson);
            }
          })
          .catch(() => {
            // Silently fail — user can still provide data manually
          });
      }
    });

    // Validate JSON on the third page
    model.onValidateQuestion.add((_sender, options) => {
      if (options.name === "surveyJsonText") {
        try {
          const parsed = JSON.parse(options.value);
          if (typeof parsed !== "object" || parsed === null) {
            options.error = "Must be a valid JSON object";
          }
        } catch {
          options.error = "Invalid JSON. Please check your syntax.";
        }
      }
    });

    // Intercept completion to prevent "thank you" page
    model.onCompleting.add((sender, options) => {
      options.allow = false;

      const data = sender.data;
      onCompleteRef.current({
        provider: data.provider,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        images: data.images || [],
        surveyJson: JSON.parse(data.surveyJsonText),
      });
    });

    return model;
  }, [providers, testDatasets]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Survey model={survey} />
    </div>
  );
}
