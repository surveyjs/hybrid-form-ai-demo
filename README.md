# AI Form Response Extractor Demo

Interactive demo for the [`ai-form-response-extractor`](https://github.com/surveyjs/ai-form-response-extractor) library — extract structured data from scanned/photographed paper forms and digital PDFs using multimodal LLMs.

## Features

- **Multi-step wizard** — Configure provider, upload images/PDFs, paste a SurveyJS form definition
- **Built-in sample data** — Predefined test datasets with scanned form images and SurveyJS definitions
- **Multi-provider support** — OpenAI, Anthropic, and local inference via Ollama
- **Real-time validation** — Basic JSON validation and runtime checks for provider configuration
- **Rich extraction results** — Overall and per-field confidence scores, extracted JSON output, SurveyJS form preview with pre-filled data

> Note: Feature details depend on the configured LLM provider and model capabilities.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure LLM providers

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` to configure at least one provider:

```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

### 3. (Optional) Set up Ollama for local inference

Ollama lets you run vision-capable models locally without API keys:

1. Install from [ollama.ai](https://ollama.ai)
2. Start the local server:
   ```bash
   ollama serve
   ```
3. Pull a vision model (example):
   ```bash
   ollama pull llama3.2-vision
   ```

The demo auto-detects whether Ollama is running on startup.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Provider setup** — Select an LLM provider and model. API keys are read from server-side environment variables and are never exposed to the client.
2. **Input selection** — Choose a built-in test dataset or provide your own files and SurveyJS schema.
3. **Upload step** — Upload scanned form images or digital PDFs, or use preloaded samples.
4. **Schema definition** — Provide a SurveyJS JSON definition describing expected fields, or use a sample schema.
5. **Processing** — The backend sends the input to `ai-form-response-extractor`, which uses a vision-language model to extract structured data.
6. **Review** — The output includes extracted JSON, confidence metrics, and a SurveyJS form preview populated with the extracted values.

## PDF Processing Note

Some PDF workflows may require image conversion capabilities (commonly provided via optional dependencies such as `sharp` in Node.js environments). If you encounter errors related to PDF processing dependencies, ensure required native modules are installed in the runtime environment where the application is executed.

## Project Structure

The repository follows a typical Next.js application structure:

```
app/
  layout.tsx           – Root layout
  page.tsx             – Main client page (state machine)
  globals.css          – Tailwind CSS imports
  api/
    providers/route.ts – GET: detect available LLM providers
    process/route.ts   – POST: run extraction via ai-form-response-extractor
    test-data/route.ts – GET: serve sample test images and JSON
components/
  NoProviders.tsx      – Setup instructions when no providers found
  SetupWizard.tsx      – SurveyJS-powered multi-page wizard
  Navigation.tsx       – Tab bar (Setup | Result | SurveyJS Form)
  Processing.tsx       – Full-screen loading spinner
  ResultView.tsx       – Metrics cards + extracted JSON
  SurveyFormView.tsx   – Pre-filled SurveyJS form preview
  ErrorView.tsx        – Error display with retry
data/                  – Sample datasets (see below)
types/
  index.ts             – Shared TypeScript types
```

## Sample Data

This demo includes multiple built-in test datasets in the [`data/`](./data/) directory. These datasets let you try the extraction pipeline without supplying your own files.

When you select a dataset in the wizard, the corresponding document or image(s) and SurveyJS JSON definition are loaded automatically. While a dataset is selected, the upload and JSON inputs are read-only.

To add your own datasets, create a subfolder in `data/` that contains a `form.json` file with the SurveyJS schema and the document or image(s) to process that correspond to this schema.

## Environment Variables

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OLLAMA_BASE_URL` | URL of local Ollama instance (default: `http://localhost:11434`) |

## License

[MIT](./LICENSE)
