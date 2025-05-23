# Limitless API TypeScript Examples

## Overview

This directory contains TypeScript examples demonstrating various utilities and potential interactions relevant to a Limitless API context (though direct Limitless API calls are not implemented in these specific examples). The scripts focus on data manipulation, external service integration (like n8n for LLM summarization), and environment management.

Currently, this includes:

*   `export_markdown.ts`: Demonstrates how to convert data structures (arrays of objects) into Markdown tables and how to format objects into structured Markdown sections.
*   `summarize_day.ts`: Shows how to take local data (mock daily activities), send it to an external n8n workflow designed to call an LLM, and then process the returned summary.

## Prerequisites

*   **Node.js**: Version 18.x or later (any recent LTS version should work).
*   **npm** or **yarn**: Package managers for Node.js.

## Setup

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd <repository-name>/typescript
    ```
2.  **Navigate to the `typescript` directory**:
    If you've already cloned and are in the repository root:
    ```bash
    cd typescript
    ```
3.  **Install dependencies**:
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```
    This will install `axios`, `moment-timezone`, `dotenv`, and `typescript` along with `ts-node` as dev dependencies based on a typical `package.json` setup for these scripts.

## Environment Configuration

For the scripts to run correctly, especially `summarize_day.ts`, you need to configure environment variables.

1.  **Create a `.env` file**:
    In the `typescript` directory, copy the example environment file to a new `.env` file:
    ```bash
    cp ../.env.example .env
    ```
    *(Note: The previous subtask created `.env.example` in the root. Assuming it should be used here, adjust path if it was intended to be in `typescript/.env.example`)*

2.  **Edit `.env`**:
    Open the `.env` file and fill in your actual credentials and endpoints.

    *   `LIMITLESS_API_KEY`: Your API key for the Limitless service. While not directly used by `export_markdown.ts` or `summarize_day.ts`, it's good practice to have it if other scripts might use it.
        *   Example: `LIMITLESS_API_KEY=your_actual_limitless_api_key`
    *   `N8N_LLM_ENDPOINT_URL`: **Required for `summarize_day.ts`**. This is the full URL of your n8n workflow webhook that receives a prompt and returns an LLM-generated summary.
        *   Example: `N8N_LLM_ENDPOINT_URL=https://your-n8n-instance.com/webhook/your-llm-summary-path`
    *   `N8N_LLM_API_KEY`: **Optional, for `summarize_day.ts`**. If your n8n workflow endpoint is protected by an API key (e.g., using Bearer token authentication), provide it here.
        *   Example: `N8N_LLM_API_KEY=your_n8n_workflow_api_key`

3.  **Important**:
    *   Ensure the `.env` file is located in the `typescript` directory.
    *   Add `.env` to your project's `.gitignore` file (if not already present in a global gitignore) to prevent committing your secret keys. The root `.gitignore` should ideally cover `typescript/.env`.

## Running the Examples

Ensure you have run `npm install` (or `yarn install`) and configured your `.env` file. The scripts can be executed using `npm run <script-name>` or `yarn <script-name>`, assuming you have corresponding entries in your `package.json`'s `scripts` section (see example `package.json` structure below).

**Example `package.json` scripts section:**
```json
{
  "scripts": {
    "export-markdown": "ts-node export_markdown.ts",
    "summarize-day": "ts-node summarize_day.ts"
  }
}
```

*   **`export_markdown.ts`**
    *   **Purpose**: A script to demonstrate converting data into Markdown format. It includes examples for creating tables from arrays of objects and generating structured Markdown sections from individual objects.
    *   **How to run**:
        ```bash
        npm run export-markdown
        ```
        or
        ```bash
        yarn export-markdown
        ```

*   **`summarize_day.ts`**
    *   **Purpose**: This script simulates fetching daily activity data, sending it to a configured n8n workflow which in turn calls an LLM for summarization, and then prints the returned summary. It's a practical example of integrating with any LLM service managed via an n8n webhook.
    *   **How to run**:
        ```bash
        npm run summarize-day
        ```
        or
        ```bash
        yarn summarize-day
        ```
    *   **Important**: For `summarize_day.ts` to work:
        *   Ensure your `N8N_LLM_ENDPOINT_URL` in the `.env` file points to a live and correctly configured n8n webhook.
        *   The n8n workflow should be designed to accept a JSON payload like:
            ```json
            {"prompt": "your text to summarize..."}
            ```
        *   It should return a JSON response containing the summary, for example:
            ```json
            {"summary": "This is the summarized text."}
            ```
            or, if it mimics OpenAI's structure:
            ```json
            {"choices": [{"text": "This is the summarized text."}]}
            ```
            The script is designed to check both `response.data.summary` and `response.data.choices[0].text`.

## (Optional) Other Examples

This directory may be expanded with other examples over time. Always refer to the `package.json` file in this directory for a list of currently available and runnable example scripts. Each script should ideally have comments explaining its specific purpose and usage.
