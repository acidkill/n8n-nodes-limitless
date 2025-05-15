![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-limitless

## Overview

This node provides integration with the Limitless AI API, allowing you to retrieve lifelogs data from the Limitless platform. It implements the full API functionality based on the Limitless Developer API OpenAPI specification.

The node supports all query parameters provided by the API, including:

- Date and time filtering
- Timezone specification
- Pagination with cursors
- Sorting direction
- Content inclusion options
- Result limits

## Installation

### Option 1: n8n Community Node (Recommended)

Run the following command in your n8n installation directory:

```
npm install n8n-nodes-limitless
```

### Option 2: Custom Node

Copy the node files to your n8n custom nodes directory:

```
~/.n8n/custom/
```

## How to Use the Node
1.  **Install**: Add the node to your n8n instance
2.  **Configure Credentials**: Create new credentials with your Limitless API key
3.  **Add Node to Workflow**: Add the Limitless AI node to your workflow
4.  **Configure Operations**:
    *   Select the "Lifelogs" resource
    *   Choose the "Get Lifelogs" operation
    *   Set any additional parameters like date range, timezone, etc.
5.  **Connect to Other Nodes**: Connect output to other nodes for further processing

## Example Usage
Here's an example of how you could use this node in a workflow to retrieve lifelogs from a specific date and then process them:

**Limitless AI node:**

*   Resource: Lifelogs
*   Operation: Get Lifelogs
*   Additional Fields:
    *   Date: 2025-05-01
    *   Timezone: Europe/Oslo
    *   Limit: 20
    *   Direction: desc

**Connect to a Function node to process the data:**

```javascript
// Example function to process lifelogs
const lifelogsData = items[0].json.data.lifelogs;
const processedData = lifelogsData.map(log => {
  return {
    id: log.id,
    title: log.title,
    date: log.startTime,
    content: log.markdown
  };
});

return [{json: {processedData}}];
```

## Implementation Notes
*   **Error Handling**: The implementation includes proper error catching and handling
*   **Pagination Support**: Cursor-based pagination is supported
*   **API Versioning**: Uses the v1 endpoint as specified in the OpenAPI doc
*   **Parameter Validation**: All parameters are typed and validated
*   **Flexible Configuration**: All API parameters can be configured in the n8n UI

## Next Steps
*   Create a custom icon file (limitless.svg) for the node
*   Add the node to your n8n instance
*   Test with your API key
*   Consider contributing to the n8n community nodes repository

## Resources
*   Limitless API Documentation
*   n8n Node Development Documentation

This implementation provides full support for the Limitless API as defined in the OpenAPI specification, with the proper structure and functionality required for n8n integration.

## More information

Refer to our [documentation on creating nodes](https://docs.n8n.io/integrations/creating-nodes/) for detailed information on building your own nodes.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
