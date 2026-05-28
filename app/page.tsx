"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Model } from "survey-core";
import type {
  ProviderInfo,
  ProcessResult,
  SetupData,
  AppState,
  TabName,
} from "@/types";
import NoProviders from "@/components/NoProviders";
import Navigation from "@/components/Navigation";
import SetupWizard from "@/components/SetupWizard";
import Processing from "@/components/Processing";
import ResultView from "@/components/ResultView";
import SurveyFormView from "@/components/SurveyFormView";
import ErrorView from "@/components/ErrorView";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [testDatasets, setTestDatasets] = useState<{ id: string; text: string }[]>([]);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("setup");
  const [processingModel, setProcessingModel] = useState("");
  const [wizardKey, setWizardKey] = useState(0);
  const [surveyDataVersion, setSurveyDataVersion] = useState(0);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch("/api/providers");
        const data = await res.json();
        setProviders(data.providers);
        if (data.testDatasets) {
          setTestDatasets(data.testDatasets);
        }
        setAppState(data.hasAvailable ? "setup" : "no-providers");
      } catch {
        setAppState("no-providers");
      }
    }
    fetchProviders();
  }, []);

  const handleProcess = useCallback(async (data: SetupData) => {
    setSetupData(data);
    setProcessingModel(data.model);
    setAppState("processing");

    try {
      const formData = new FormData();
      formData.append("provider", data.provider);
      formData.append("model", data.model);
      formData.append("surveyJson", JSON.stringify(data.surveyJson));
      if (data.temperature !== undefined) {
        formData.append("temperature", data.temperature.toString());
      }
      if (data.maxTokens !== undefined) {
        formData.append("maxTokens", data.maxTokens.toString());
      }

      for (const img of data.images) {
        const base64 = img.content.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const file = new File([bytes], img.name, { type: img.type });
        formData.append("images", file);
      }

      const res = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        setError(responseData.error || "Processing failed");
        setAppState("error");
        setActiveTab("error");
        return;
      }

      setResult(responseData);
      setAppState("result");
      setActiveTab("result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setAppState("error");
      setActiveTab("error");
    }
  }, []);

  const surveyModel = useMemo(() => {
    if (appState === "result" && result && setupData) {
      const model = new Model(setupData.surveyJson);
      model.data = result.data;
      model.onValueChanged.add(() => {
        setSurveyDataVersion((v) => v + 1);
      });
      return model;
    }
    return null;
  }, [appState === "result" && result && setupData ? result : null]);

  const handleReset = useCallback(() => {
    setWizardKey((k) => k + 1);
    setAppState("setup");
    setResult(null);
    setError(null);
    setSetupData(null);
    setActiveTab("setup");
    setSurveyDataVersion(0);
  }, []);

  if (appState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (appState === "no-providers") {
    return <NoProviders />;
  }

  if (appState === "processing") {
    return <Processing model={processingModel} />;
  }

  const showNav = appState === "result" || appState === "error";

  return (
    <main className="min-h-screen bg-gray-50">
      {showNav && (
        <Navigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          appState={appState}
          onReset={handleReset}
        />
      )}

      {appState === "setup" && (
        <SetupWizard
          key={wizardKey}
          providers={providers}
          testDatasets={testDatasets}
          onComplete={handleProcess}
        />
      )}

      {(appState === "result" || appState === "error") &&
        activeTab === "setup" && (
          <SetupWizard
            key={`post-${wizardKey}`}
            providers={providers}
            testDatasets={testDatasets}
            onComplete={handleProcess}
          />
        )}

      {appState === "result" && activeTab === "result" && result && (
        <ResultView result={result} surveyModel={surveyModel} surveyDataVersion={surveyDataVersion} />
      )}

      {appState === "result" &&
        activeTab === "surveyForm" &&
        surveyModel && (
          <SurveyFormView model={surveyModel} />
        )}

      {appState === "error" && activeTab === "error" && (
        <ErrorView error={error || "Unknown error"} onRetry={handleReset} />
      )}
    </main>
  );
}
