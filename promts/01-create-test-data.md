Add a **Test Data Selection** page to the setup wizard as the **second page** (between the current Setup page and Image Upload page).

**New page: "Test Data"**

Add a `radiogroup` question with the following behavior:

- **name:** `testData`
- **title:** "Select Test Data"
- **description:** "Choose a predefined test dataset or use your own custom images and form definition."
- **Default value:** `custom`
- **Choices:**
  1. `{ value: "custom", text: "Custom – I will provide my own images and JSON definition" }`
  2. `{ value: "test1", text: "Synoptic Operative Report" }`
  *(More test data options will be added later — design for extensibility.)*

**Behavior when a predefined test is selected (e.g. "test1"):**

- The **Image Upload** question (file question on the next page) becomes **read-only** and is automatically populated with the test image loaded from the server.
- The **SurveyJS JSON Definition** comment question on the last page becomes **read-only** and is automatically populated with the test JSON loaded from the server.
- Data is fetched from a new API route: `GET /api/test-data?id=test1`
  - Returns `{ images: [{ name, type, content (base64 data URL) }], surveyJson: string }`
  - Server reads files from a `data/` directory in the project root:
    - `data/test1.jpg` — the scanned form image
    - `data/test1.json` — the SurveyJS form definition JSON

**Behavior when "custom" is selected (or re-selected):**

- The Image Upload and SurveyJS JSON Definition questions become **editable** again.
- **Do NOT reset/clear** existing values — keep whatever the user had before.

**Implementation details:**

1. **New API route:** `app/api/test-data/route.ts`
   - Accepts `?id=test1` query parameter.
   - Validates the ID against an allowlist of known test datasets.
   - Reads the image file(s) from `data/{id}.jpg` (or multiple images if needed) and returns them as base64 data URLs.
   - Reads the JSON file from `data/{id}.json` and returns it as a string.
   - Returns 404 if the test data ID is not found.

2. **Test data registry** (for extensibility):
   - Create a simple registry/config (e.g. in `data/tests.ts` or similar) that maps test IDs to their metadata:
     ```ts
     export const TEST_DATASETS = [
       { id: "test1", text: "Synoptic Operative Report", images: ["test1.jpg"], json: "test1.json" },
       // More entries will be added here
     ];
     ```
   - Use this registry to:
     - Generate the radiogroup choices dynamically (fetch from server on load).
     - Validate test data IDs in the API route.

3. **Wizard changes in `SetupWizard.tsx`:**
   - Insert the new "Test Data" page as page 2 (after Setup, before Image Upload).
   - Use SurveyJS `readOnlyIf` property on the Image Upload and SurveyJS JSON Definition questions to handle read-only state declaratively:
     - `"readOnlyIf": "{testData} <> 'custom'"` — the question becomes read-only whenever a predefined test is selected, and editable when "Custom" is selected.
   - On `onValueChanged` for the `testData` question:
     - If value is not `"custom"`: fetch `/api/test-data?id={value}`, then:
       - Set the file question value with the returned image data.
       - Set the comment question value with the returned JSON string.
       - (Read-only state is handled automatically by `readOnlyIf`.)
     - If value is `"custom"`:
       - Do **not** clear/reset their current values — just let `readOnlyIf` make them editable again.

4. **Create placeholder test data files:**
   - `data/test1.json` — a sample SurveyJS form definition for a synoptic operative report.
   - `data/test1.jpg` — placeholder (note: actual test image must be provided separately).

**Do not change any existing behavior** — the wizard should work exactly as before when "Custom" is selected.
