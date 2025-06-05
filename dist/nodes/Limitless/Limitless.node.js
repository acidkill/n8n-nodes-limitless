"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Limitless = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const chains_1 = require("langchain/chains");
const prompts_1 = require("@langchain/core/prompts");
class Limitless {
    constructor() {
        this.description = {
            displayName: 'Limitless',
            name: 'limitless',
            icon: 'file:limitless.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Interact with Limitless API',
            defaults: {
                name: 'Limitless',
            },
            inputs: [{ type: "main" }],
            outputs: [{ type: "main" }],
            credentials: [
                {
                    name: 'limitlessApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    options: [
                        {
                            name: 'Get Lifelogs',
                            value: 'getLifelogs',
                            action: 'Returns a list of lifelogs based on specified time range or date',
                            description: 'Returns a list of lifelogs based on specified time range or date',
                        },
                        {
                            name: 'Export Markdown',
                            value: 'exportMarkdown',
                            action: 'Exports lifelogs as markdown for a specified date',
                            description: 'Exports lifelogs as markdown for a specified date',
                        },
                        {
                            name: 'Summarize Day',
                            value: 'summarizeDay',
                            action: 'Summarizes the lifelogs for a given day using an AI model',
                            description: 'Summarizes the lifelogs for a given day using an AI model',
                        },
                    ],
                    default: 'getLifelogs',
                    noDataExpression: true,
                },
                {
                    displayName: 'Timezone',
                    name: 'timezone',
                    type: 'string',
                    default: 'UTC',
                    description: 'IANA timezone specifier. If missing, UTC is used.',
                    displayOptions: {
                        show: {
                            operation: [
                                'getLifelogs',
                                'exportMarkdown',
                                'summarizeDay',
                            ],
                        },
                    },
                },
                {
                    displayName: 'Filtering Method',
                    name: 'filteringMethod',
                    type: 'options',
                    options: [
                        {
                            name: 'By Date',
                            value: 'byDate',
                        },
                        {
                            name: 'By Start/End Time',
                            value: 'byStartEnd',
                        },
                    ],
                    default: 'byDate',
                    displayOptions: {
                        show: {
                            operation: [
                                'getLifelogs',
                            ],
                        },
                    },
                },
                {
                    displayName: 'Date',
                    name: 'date',
                    type: 'dateTime',
                    default: '',
                    description: 'Will return all entries beginning on a date in the given timezone (YYYY-MM-DD)',
                    displayOptions: {
                        show: {
                            operation: [
                                'getLifelogs',
                                'exportMarkdown',
                                'summarizeDay',
                            ],
                        },
                        hide: {
                            operation: [
                                'getLifelogs',
                            ],
                            filteringMethod: [
                                'byStartEnd',
                            ],
                        },
                    },
                },
                {
                    displayName: 'Start Time',
                    name: 'start',
                    type: 'dateTime',
                    default: '',
                    description: 'Start datetime in ISO-8601 format. Timezones/offsets will be ignored.',
                    displayOptions: {
                        show: {
                            operation: [
                                'getLifelogs',
                            ],
                            filteringMethod: [
                                'byStartEnd',
                            ],
                        },
                    },
                },
                {
                    displayName: 'End Time',
                    name: 'end',
                    type: 'dateTime',
                    default: '',
                    description: 'End datetime in ISO-8601 format. Timezones/offsets will be ignored.',
                    displayOptions: {
                        show: {
                            operation: [
                                'getLifelogs',
                            ],
                            filteringMethod: [
                                'byStartEnd',
                            ],
                        },
                    },
                },
                {
                    displayName: 'Additional Fields',
                    name: 'additionalFields',
                    type: 'collection',
                    placeholder: 'Add Field',
                    default: {},
                    displayOptions: {
                        show: {
                            operation: [
                                'getLifelogs',
                            ],
                        },
                    },
                    options: [
                        {
                            displayName: 'Cursor',
                            name: 'cursor',
                            type: 'string',
                            default: '',
                            description: 'Cursor for pagination',
                        },
                        {
                            displayName: 'Limit',
                            name: 'limit',
                            type: 'number',
                            typeOptions: {
                                minValue: 1,
                            },
                            default: 50,
                            description: 'Max number of results to return',
                        },
                    ],
                },
                {
                    displayName: 'Direction',
                    name: 'direction',
                    type: 'options',
                    options: [
                        {
                            name: 'Ascending',
                            value: 'asc',
                        },
                        {
                            name: 'Descending',
                            value: 'desc',
                        },
                    ],
                    default: 'desc',
                    description: 'The direction to sort the lifelogs',
                    displayOptions: {
                        show: {
                            operation: ['exportMarkdown'],
                        },
                    },
                },
                {
                    displayName: 'Limit',
                    name: 'limit',
                    type: 'number',
                    default: 10,
                    description: 'The maximum number of lifelogs to return',
                    displayOptions: {
                        show: {
                            operation: ['exportMarkdown'],
                        },
                    },
                },
                {
                    displayName: 'Lifelog Limit',
                    name: 'lifelogLimit',
                    type: 'number',
                    default: 100,
                    description: 'The maximum number of lifelogs to fetch for summarization',
                    displayOptions: {
                        show: {
                            operation: ['summarizeDay'],
                        },
                    },
                },
                {
                    displayName: 'Prompt',
                    name: 'prompt',
                    type: 'string',
                    default: "You are a helpful assistant that summarizes transcripts. Summarize the following transcripts into a concise overview of the day's events, activities, and key topics discussed:\n\n{{$json.lifelogsText}}",
                    description: 'The prompt to use for summarization. Use {{$json.lifelogsText}} as a placeholder for the lifelogs text.',
                    displayOptions: {
                        show: {
                            operation: ['summarizeDay'],
                        },
                    },
                },
                {
                    displayName: 'Chat Model',
                    name: 'chatModel',
                    type: 'options',
                    typeOptions: {
                        credentialType: 'chatModel',
                    },
                    default: '',
                    description: 'The chat model to use for summarization',
                    displayOptions: {
                        show: {
                            operation: ['summarizeDay'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i);
            const timezone = this.getNodeParameter('timezone', i);
            const filteringMethod = this.getNodeParameter('filteringMethod', i);
            const date = this.getNodeParameter('date', i, '');
            const start = this.getNodeParameter('start', i, '');
            const end = this.getNodeParameter('end', i, '');
            const additionalFields = this.getNodeParameter('additionalFields', i, {});
            let responseData;
            if (operation === 'getLifelogs') {
                const credentials = await this.getCredentials('limitlessApi');
                const apiUrl = credentials.apiUrl;
                const normalizedApiUrl = apiUrl.replace(/\/$/, "");
                const apiEndpointPath = 'v1/lifelogs';
                const options = {
                    method: 'GET',
                    uri: `${normalizedApiUrl}/${apiEndpointPath.startsWith('/') ? apiEndpointPath.substring(1) : apiEndpointPath}`,
                    qs: {
                        date: '',
                        start: '',
                        end: '',
                        timezone: '',
                        cursor: '',
                        limit: 0
                    },
                    json: true,
                };
                if (filteringMethod === 'byDate' && date) {
                    options.qs.date = date.split('T')[0];
                }
                else if (filteringMethod === 'byStartEnd') {
                    if (start)
                        options.qs.start = start;
                    if (end)
                        options.qs.end = end;
                }
                if (timezone) {
                    options.qs.timezone = timezone;
                }
                if (additionalFields.cursor) {
                    options.qs.cursor = additionalFields.cursor;
                }
                if (additionalFields.limit) {
                    options.qs.limit = additionalFields.limit;
                }
                try {
                    responseData = await this.helpers.requestWithAuthentication.call(this, 'limitlessApi', options);
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
                }
                returnData.push({
                    json: {
                        data: responseData,
                        pagination: (responseData === null || responseData === void 0 ? void 0 : responseData.pagination) || {}
                    }
                });
            }
            else if (operation === 'exportMarkdown') {
                const date = this.getNodeParameter('date', i, '');
                const timezone = this.getNodeParameter('timezone', i, 'UTC');
                const direction = this.getNodeParameter('direction', i, 'desc');
                const limit = this.getNodeParameter('limit', i, 10);
                const credentials = await this.getCredentials('limitlessApi');
                const apiUrl = credentials.apiUrl;
                const normalizedApiUrl = apiUrl.replace(/\/$/, "");
                const apiEndpointPath = 'v1/lifelogs';
                const options = {
                    method: 'GET',
                    uri: `${normalizedApiUrl}/${apiEndpointPath.startsWith('/') ? apiEndpointPath.substring(1) : apiEndpointPath}`,
                    qs: {
                        limit: limit.toString(),
                        direction: direction,
                        includeMarkdown: 'true',
                        timezone: timezone,
                    },
                    json: true,
                };
                if (date) {
                    options.qs.date = date.split('T')[0];
                }
                try {
                    responseData = await this.helpers.requestWithAuthentication.call(this, 'limitlessApi', options);
                    if (Array.isArray(responseData)) {
                        for (const lifelog of responseData) {
                            returnData.push({ json: lifelog });
                        }
                    }
                    else if (responseData && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data)) {
                        for (const lifelog of responseData.data) {
                            returnData.push({ json: lifelog });
                        }
                    }
                    else {
                        returnData.push({ json: responseData });
                    }
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
                }
            }
            else if (operation === 'summarizeDay') {
                const date = this.getNodeParameter('date', i);
                const timezone = this.getNodeParameter('timezone', i, 'UTC');
                const lifelogLimit = this.getNodeParameter('lifelogLimit', i, 100);
                const promptTemplate = this.getNodeParameter('prompt', i, "You are a helpful assistant that summarizes transcripts. Summarize the following transcripts into a concise overview of the day's events, activities, and key topics discussed:\n\n{{$json.lifelogsText}}");
                if (!date) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Date parameter is required for Summarize Day operation.');
                }
                const credentials = await this.getCredentials('limitlessApi');
                const apiUrl = credentials.apiUrl;
                const normalizedApiUrl = apiUrl.replace(/\/$/, "");
                const apiEndpointPath = 'v1/lifelogs';
                const options = {
                    method: 'GET',
                    uri: `${normalizedApiUrl}/${apiEndpointPath.startsWith('/') ? apiEndpointPath.substring(1) : apiEndpointPath}`,
                    qs: {
                        limit: lifelogLimit.toString(),
                        date: date.split('T')[0],
                        timezone: timezone,
                        includeMarkdown: 'true',
                        direction: 'asc',
                    },
                    json: true,
                };
                let lifelogsArray = [];
                try {
                    responseData = await this.helpers.requestWithAuthentication.call(this, 'limitlessApi', options);
                    if (Array.isArray(responseData)) {
                        lifelogsArray = responseData;
                    }
                    else if (responseData && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data)) {
                        lifelogsArray = responseData.data;
                    }
                    else {
                        this.logger.warn('Unexpected response format when fetching lifelogs for summarization.');
                        lifelogsArray = [];
                    }
                }
                catch (error) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error);
                }
                const lifelogsText = lifelogsArray.map(log => log.markdown || '').join('\n\n---\n\n');
                const chatModelCredentialName = this.getNodeParameter('chatModel', i);
                if (!chatModelCredentialName) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Chat Model credential name is required for Summarize Day operation.');
                }
                try {
                    const chatModelInstance = await this.helpers.getChatModel(chatModelCredentialName, i, this.getContext('node'));
                    const processedPromptTemplate = promptTemplate.replace('{{$json.lifelogsText}}', '{text}');
                    const prompt = new prompts_1.PromptTemplate({
                        template: processedPromptTemplate,
                        inputVariables: ['text'],
                    });
                    const chain = new chains_1.LLMChain({ llm: chatModelInstance, prompt });
                    const summaryResponse = await chain.call({ text: lifelogsText });
                    const summary = summaryResponse.text;
                    returnData.push({ json: { summary } });
                }
                catch (error) {
                    if (error instanceof n8n_workflow_1.NodeApiError) {
                        throw error;
                    }
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
                }
            }
        }
        return this.prepareOutputData(returnData);
    }
}
exports.Limitless = Limitless;
//# sourceMappingURL=Limitless.node.js.map