# Hybrid Form AI Demo

Interactive demo for the [`hybrid-form-ai`](https://github.com/surveyjs/hybrid-form-ai) npm package — extract structured data from scanned/photographed paper forms and digital PDFs using multimodal LLMs.

## Features

- **Multi-step wizard** — configure provider, upload images/PDFs, paste a SurveyJS form definition
- **Built-in sample data** — predefined test datasets with scanned form images and SurveyJS definitions
- **Multi-provider support** — OpenAI, Anthropic, and Ollama (local)
- **Real-time validation** — JSON syntax checking, provider availability detection
- **Rich results** — confidence scores, per-field metrics, extracted JSON, pre-filled SurveyJS form preview

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure LLM providers

Copy the example environment file and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with at least one provider:

```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

### 3. (Optional) Set up Ollama for local inference

Ollama lets you run vision models locally with no API key:

1. Install from [ollama.ai](https://ollama.ai)
2. Start the server:
   ```bash
   ollama serve
   ```
3. Pull a vision model:
   ```bash
   ollama pull llama3.2-vision
   ```

The demo auto-detects whether Ollama is running on startup.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Setup** — Pick a provider and model. API keys are read from server environment variables and never exposed to the browser.
2. **Test Data** — Choose a built-in sample dataset or provide your own images and form definition.
3. **Upload** — Drag & drop scanned form images or digital PDFs (PNG, JPG, TIFF, PDF, etc.), or use pre-loaded test files.
4. **Define** — Paste the SurveyJS JSON definition that describes your form fields, or use the pre-loaded test definition.
5. **Process** — The server calls `hybrid-form-ai` to extract structured data from the images.
6. **Review** — See extraction results with confidence scores and a pre-filled SurveyJS form.

### Digital PDF Note

Digital PDF processing requires the optional `sharp` dependency used by `hybrid-form-ai` for PDF-to-image conversion.
If you see an error about `Digital PDF inputs require the optional "sharp" dependency to be installed`, install `sharp` in the runtime environment where this app executes.

## Project Structure

```
app/
  layout.tsx          – Root layout
  page.tsx            – Main client page (state machine)
  globals.css         – Tailwind CSS imports
  api/
    providers/route.ts – GET: detect available LLM providers
    process/route.ts   – POST: run extraction via hybrid-form-ai
    test-data/route.ts – GET: serve sample test images and JSON
components/
  NoProviders.tsx     – Setup instructions when no providers found
  SetupWizard.tsx     – SurveyJS-powered multi-page wizard
  Navigation.tsx      – Tab bar (Setup | Result | SurveyJS Form)
  Processing.tsx      – Full-screen loading spinner
  ResultView.tsx      – Metrics cards + extracted JSON
  SurveyFormView.tsx  – Pre-filled SurveyJS form preview
  ErrorView.tsx       – Error display with retry
data/
  tests.ts            – Test dataset registry
  test1.jpg           – Sample scanned form image (Synoptic Operative Report)
  test1.json          – SurveyJS form definition for test1
types/
  index.ts            – Shared TypeScript types
```

## Sample Data

The demo ships with built-in test datasets so you can try it immediately without preparing your own images.

| ID | Name | Description |
| --- | --- | --- |
| `test1` | Synoptic Operative Report | A scanned surgical operative report form with patient info, surgery details, and outcome fields |

When you select a test dataset in the wizard, the corresponding image and SurveyJS JSON definition are loaded automatically. The upload and JSON fields become read-only while a test dataset is selected.

To add your own test datasets, add entries to `data/tests.ts` and place the image/JSON files in the `data/` directory.

## Environment Variables

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OLLAMA_BASE_URL` | Ollama server URL (default: `http://localhost:11434`) |

## License

MIT
