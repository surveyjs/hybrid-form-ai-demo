"use client";

import { useState } from "react";
import type { Model } from "survey-core";
import type { ProcessResult } from "@/types";

type DataTab = "response" | "extracted";

interface ResultViewProps {
  result: ProcessResult;
  surveyModel: Model | null;
  surveyDataVersion: number;
}

export default function ResultView({ result, surveyModel, surveyDataVersion }: ResultViewProps) {
  const [activeDataTab, setActiveDataTab] = useState<DataTab>("response");
  // surveyDataVersion is used to trigger re-render when survey data changes
  void surveyDataVersion;

  const signatureWarnings = Object.entries(result.data).filter(([field, value]) => {
    if (!/signature/i.test(field)) {
      return false;
    }

    if (typeof value !== "string") {
      return true;
    }

    const normalized = value.trim().toLowerCase();
    return (
      normalized.length === 0 ||
      normalized.includes("base64-encoded-signature-image-string") ||
      normalized.includes("<base64")
    );
  });

  const confidenceColor =
    result.overallConfidence >= 0.85
      ? "text-green-600 bg-green-50 border-green-200"
      : result.overallConfidence >= 0.6
        ? "text-yellow-600 bg-yellow-50 border-yellow-200"
        : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-lg border p-4 ${confidenceColor}`}>
          <p className="text-sm font-medium opacity-75">Overall Confidence</p>
          <p className="text-3xl font-bold">
            {(result.overallConfidence * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Processing Time</p>
          <p className="text-3xl font-bold text-gray-900">
            {(result.processingTime / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Fields Extracted</p>
          <p className="text-3xl font-bold text-gray-900">
            {Object.keys(result.data).length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">
            Low Confidence Fields
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {result.lowConfidenceFields.length}
          </p>
        </div>
      </div>

      {/* Provider Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-500">
          Processed with{" "}
          <span className="font-medium text-gray-700">{result.provider}</span> /{" "}
          <span className="font-medium text-gray-700">{result.model}</span>
          {result.uniqueId && (
            <>
              {" "}
              · Detected ID:{" "}
              <span className="font-mono font-medium text-blue-600">
                {result.uniqueId}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Low Confidence Warning */}
      {result.lowConfidenceFields.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠ Low Confidence Fields
          </h3>
          <p className="text-sm text-yellow-700">
            The following fields had confidence below 75% and may need manual
            review:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {result.lowConfidenceFields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded"
              >
                {field} ({((result.confidence[field] || 0) * 100).toFixed(0)}%)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Signature Extraction Warning */}
      {signatureWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            Signature Could Not Be Reliably Extracted
          </h3>
          <p className="text-sm text-amber-700">
            One or more signature fields are empty or placeholder-like in the extracted JSON.
            The raw extractor output is shown as-is, so review these fields manually in the SurveyJS Form tab.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {signatureWarnings.map(([field]) => (
              <span
                key={field}
                className="px-2 py-1 bg-amber-100 text-amber-900 text-xs font-medium rounded"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-field Confidence */}
      {Object.keys(result.confidence).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Field Confidence Scores
          </h3>
          <div className="space-y-3">
            {Object.entries(result.confidence)
              .sort(([, a], [, b]) => b - a)
              .map(([field, score]) => {
                const pct = score * 100;
                const barColor =
                  pct >= 85
                    ? "bg-green-500"
                    : pct >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500";
                return (
                  <div key={field} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-40 truncate">
                      {field}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-500 w-12 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Data Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex space-x-1 border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveDataTab("response")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeDataTab === "response"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Response Data
          </button>
          <button
            onClick={() => setActiveDataTab("extracted")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeDataTab === "extracted"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Extracted Data
          </button>
        </div>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
          {activeDataTab === "response"
            ? JSON.stringify(surveyModel?.data ?? {}, null, 2)
            : JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
