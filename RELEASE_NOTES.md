# Release Notes - n8n-nodes-limitless

## Version 0.1.0 - 2025-05-16

🎉 **Initial Release**

This is the first public release of the `n8n-nodes-limitless` node, enabling integration with the Limitless AI API.

**Key Features:**

*   **Limitless AI API Integration:** Connects to the Limitless AI API to retrieve data.
*   **Get Lifelogs Operation:** Allows fetching of lifelogs based on various criteria.
*   **Comprehensive Query Parameter Support:**
    *   Filtering by date or start/end time.
    *   Timezone specification.
    *   Cursor-based pagination for handling large datasets.
    *   Limit the number of results.
*   **Secure Credential Handling:** Uses n8n's built-in credential system for API key management.
*   **User-Friendly Configuration:** All available API parameters can be configured through the n8n node interface.
*   **Robustness & Maintainability:**
    *   Resolved initial TypeScript type compatibility issues.
    *   Established a Jest testing framework with initial tests for core functionality and error handling.
*   **Documentation:** Includes a `README.md` file with installation instructions, usage examples, and feature overview.
