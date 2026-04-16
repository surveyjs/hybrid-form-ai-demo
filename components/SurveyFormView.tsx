"use client";

import { useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";

interface SurveyFormViewProps {
  surveyJson: Record<string, unknown>;
  data: Record<string, unknown>;
}

export default function SurveyFormView({
  surveyJson,
  data,
}: SurveyFormViewProps) {
  const survey = useMemo(() => {
    const model = new Model(surveyJson);
    model.data = data;
    return model;
  }, [surveyJson, data]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Pre-filled SurveyJS Form
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          This is your original form definition pre-filled with the extracted
          data. You can review and edit the values.
        </p>
      </div>
      <Survey model={survey} />
    </div>
  );
}
