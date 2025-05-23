![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-Nodes-Limitless

## Overview

This node provides integration with the Limitless AI API, allowing you to interact with your lifelogs data from the Limitless platform. It supports fetching lifelogs, exporting them in markdown format, and summarizing a day's activities using AI.

The node aims to implement the full API functionality based on the Limitless Developer API, offering flexibility in how you access and utilize your data.

Key supported features include:
- Date and time filtering for data retrieval.
- Timezone specification to ensure accuracy.
- Pagination with cursors for the "Get Lifelogs" operation.
- Sorting direction for exports.
- Content inclusion options (like fetching markdown).
- Result limits for controlling data volume.
- AI-powered summarization of daily lifelogs using configurable Chat Models.

## Installation

### Option 1: n8n Community Node (Recommended if available)

If published, run the following command in your n8n installation directory:

```
npm install n8n-nodes-limitless
```

### Option 2: Custom Node

Copy the node files (typically the `dist` folder after building, or the source `nodes` folder if your n8n setup supports it directly) to your n8n custom nodes directory:

```
~/.n8n/custom/
```
(The exact path might vary based on your n8n version and configuration.)

## Global Settings

### API Endpoint Path

This node includes a global setting "API Endpoint Path" which is available for all operations.
*   **Description**: The specific API path for lifelog operations (e.g., 'v1/lifelogs'). This is appended to your base API URL (from credentials) after normalization (removing any trailing slashes from the base URL). This is useful if the API version or base path for lifelogs changes in the future.
*   **Default Value**: `v1/lifelogs`

You can typically leave this to its default unless the Limitless API documentation indicates a change to the lifelogs endpoint path.

## How to Use the Node

1.  **Install**: Add the node to your n8n instance.
2.  **Configure Credentials**: Create new credentials under "Limitless API" with your API key and the base URL for the Limitless API (e.g., `https://api.limitless.com`).
3.  **Add Node to Workflow**: Add the "Limitless" node to your workflow.
4.  **Configure Operations**:
    *   Select the desired "Operation" (see details below).
    *   Configure the "API Endpoint Path" if necessary (usually defaults are fine).
    *   Set operation-specific parameters.
5.  **Connect to Other Nodes**: Connect the output to other nodes for further processing.

## Operations

The Limitless node supports the following operations:

### 1. Get Lifelogs

*   **Description**: Fetches a list of lifelogs based on a specified time range or date, with support for pagination. This is useful for general data retrieval and exploration.
*   **Parameters**:
    *   **Timezone**: IANA timezone for date interpretation (e.g., 'America/New_York'). Defaults to 'UTC'.
    *   **Filtering Method**:
        *   `By Date`: Filters lifelogs for a specific day.
            *   **Date**: The specific date to fetch lifelogs for.
        *   `By Start/End Time`: Filters lifelogs within a specific time range.
            *   **Start Time**: Start datetime in ISO-8601 format.
            *   **End Time**: End datetime in ISO-8601 format.
    *   **Additional Fields (Collection)**:
        *   **Cursor**: For pagination, use the `nextCursor` from a previous response.
        *   **Limit (for Get Lifelogs)**: Max number of results per page (default 50).
*   **Output**: An array of items, where each item contains a `data` object (the API response including the `lifelogs` array) and a `pagination` object (with `nextCursor` if available).

### 2. Export Markdown

*   **Description**: Fetches lifelogs for a specified date or the most recent entries and returns their full content, with a primary focus on the markdown format. This is useful for backups, exporting content for other systems, or detailed review.
*   **Parameters**:
    *   **Date**: Specifies the date (YYYY-MM-DD) for which to export entries. If left empty, it fetches the most recent entries based on the "Direction" parameter.
    *   **Timezone**: IANA timezone for date interpretation. Defaults to 'UTC'.
    *   **Direction**: Order to retrieve lifelogs:
        *   `Ascending`: Oldest first.
        *   `Descending`: Most recent first (default).
    *   **Limit (for Export Markdown)**: Maximum number of lifelog entries to return (default 10).
*   **Output**: An array of lifelog objects, each item being a complete lifelog entry including its `markdown` field and other associated data.

### 3. Summarize Day

*   **Description**: Fetches all relevant lifelogs for a specified date, combines their textual content (markdown), and then uses a selected Chat Model (Language Model) to generate a concise summary of the day's events, activities, and key topics.
*   **Parameters**:
    *   **Date (Required)**: The specific date (YYYY-MM-DD) for which to summarize lifelogs. This field is mandatory for this operation.
    *   **Timezone**: IANA timezone for date interpretation. Defaults to 'UTC'.
    *   **Lifelog Fetch Limit**: Maximum number of lifelog entries to fetch from the API for summarization (default 100). Be mindful of the context window limits of your chosen Chat Model.
    *   **Chat Model (Required)**: Select your pre-configured Chat Model credential (e.g., OpenAI, Ollama, Azure OpenAI) to use for the summarization task. The available models depend on what you have set up in your n8n credentials.
    *   **Summarization Prompt**: The prompt template to use for summarization. The prompt should include the placeholder `{text}` where the combined content of the day's lifelogs will be automatically inserted by the node before sending to the Chat Model.
        *   Default: `"You are a helpful assistant that summarizes transcripts. Summarize the following transcripts into a concise overview of the day's events, activities, and key topics discussed:\n\n{text}"`
*   **Output**: A single item containing the generated `summary` field (string) from the Chat Model.

## Example Usage (Get Lifelogs)

Here's an example of how you could use this node in a workflow to retrieve lifelogs from a specific date and then process them:

**Limitless node ("Get Lifelogs" operation):**

*   Operation: Get Lifelogs
*   Filtering Method: By Date
*   Date: 2025-05-01
*   Timezone: Europe/Oslo
*   Additional Fields:
    *   Limit: 20

**Connect to a Function node to process the data:**

```javascript
// Example function to process lifelogs
// Assuming the output structure from "Get Lifelogs"
const responseData = items[0].json.data; // API response is in 'data'
const lifelogs = responseData.lifelogs; // Lifelogs array

const processedData = lifelogs.map(log => {
  return {
    id: log.id,
    title: log.title, // Adjust field names based on actual API response
    date: log.startTime,
    content: log.markdown
  };
});

return [{json: {processedData}}];
```

## Implementation Notes
*   **Error Handling**: The node includes error catching and handling, surfacing issues as `NodeOperationError`.
*   **Pagination Support**: Cursor-based pagination is supported for the "Get Lifelogs" operation.
*   **API Versioning**: Uses the v1 endpoint by default but can be configured via "API Endpoint Path".
*   **Parameter Validation**: Basic parameter validation is done through n8n's type system.
*   **Flexible Configuration**: Most relevant API parameters can be configured in the n8n UI.

## Resources
*   Limitless API Documentation (Refer to the official Limitless site)
*   n8n Node Development Documentation

This implementation provides versatile support for the Limitless API, catering to various data retrieval and processing needs.

## More information

Refer to our [documentation on creating nodes](https://docs.n8n.io/integrations/creating-nodes/) for detailed information on building your own nodes.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
