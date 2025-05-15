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

## Prerequisites

You need the following installed on your development machine:

* [git](https://git-scm.com/downloads)
* Node.js and pnpm. Minimum version Node 20. You can find instructions on how to install both using nvm (Node Version Manager) for Linux, Mac, and WSL [here](https://github.com/nvm-sh/nvm). For Windows users, refer to Microsoft's guide to [Install NodeJS on Windows](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).
* Install n8n with:
  ```
  npm install n8n -g
  ```
* Recommended: follow n8n's guide to [set up your development environment](https://docs.n8n.io/integrations/creating-nodes/build/node-development-environment/).
9. Replace this README with documentation for your node. Use the [README_TEMPLATE](README_TEMPLATE.md) to get started.
10. Update the LICENSE file to use your details.
11. [Publish](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) your package to npm.

## More information

Refer to our [documentation on creating nodes](https://docs.n8n.io/integrations/creating-nodes/) for detailed information on building your own nodes.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
