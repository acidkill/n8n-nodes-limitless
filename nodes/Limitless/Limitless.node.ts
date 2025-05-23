import {
    IExecuteFunctions,
    INodeExecutionData,
    NodeApiError,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    IDataObject,
    NodeConnectionType,
    IHttpRequestMethods,
} from 'n8n-workflow';
import { OptionsWithUri } from 'request-promise-native';

export class Limitless implements INodeType {
    description: INodeTypeDescription = {
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
        inputs: [{type: NodeConnectionType.Main}],
        outputs: [{type: NodeConnectionType.Main}],
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
                        ],
                        filteringMethod: [
                            'byDate',
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
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i) as string;
            const timezone = this.getNodeParameter('timezone', i) as string;
            const filteringMethod = this.getNodeParameter('filteringMethod', i) as string;
            const date = this.getNodeParameter('date', i, '') as string;
            const start = this.getNodeParameter('start', i, '') as string;
            const end = this.getNodeParameter('end', i, '') as string;
            const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

            let responseData;

            if (operation === 'getLifelogs') {
                const credentials = await this.getCredentials('limitlessApi');
                const apiUrl = credentials.apiUrl as string;
                const normalizedApiUrl = apiUrl.replace(/\/$/, "");
                const apiEndpointPath = this.getNodeParameter('apiEndpointPath', i, 'v1/lifelogs') as string;

                const options = {
                    method: 'GET' as IHttpRequestMethods,
                    uri: `${normalizedApiUrl}/${apiEndpointPath.startsWith('/') ? apiEndpointPath.substring(1) : apiEndpointPath}`,
                    qs: {
                        date: '',
                        start: '',
                        end: '',
                        timezone: '',
                        cursor: '',
                        limit: 0
                    } as {
                        date?: string;
                        start?: string;
                        end?: string;
                        timezone?: string;
                        cursor?: string;
                        limit?: number;
                    },
                    json: true,
                } as Omit<OptionsWithUri, 'uri' | 'method' | 'auth' | 'form' | 'followRedirect' | 'agentOptions'> & { uri: string; method: IHttpRequestMethods; qs: { date?: string; start?: string; end?: string; timezone?: string; cursor?: string; limit?: number } };

                // Add query parameters based on filtering method
                if (filteringMethod === 'byDate' && date) {
                    options.qs.date = date.split('T')[0]; // Extract just the date part
                } else if (filteringMethod === 'byStartEnd') {
                    if (start) options.qs.start = start;
                    if (end) options.qs.end = end;
                }

                // Add timezone parameter
                if (timezone) {
                    options.qs.timezone = timezone;
                }

                // Add additional fields
                if (additionalFields.cursor) {
                    options.qs.cursor = additionalFields.cursor;
                }

                if (additionalFields.limit) {
                    options.qs.limit = additionalFields.limit;
                }

                try {
                    responseData = await this.helpers.requestWithAuthentication.call(
                        this,
                        'limitlessApi',
                        options
                    );
                } catch (error) {
                    throw new NodeOperationError(this.getNode(), error);
                }

                returnData.push({
                    json: {
                        data: responseData,
                        pagination: responseData?.pagination || {}
                    }
                });
            } else if (operation === 'exportMarkdown') {
                const date = this.getNodeParameter('date', i, '') as string;
                const timezone = this.getNodeParameter('timezone', i, 'UTC') as string;
                const direction = this.getNodeParameter('direction', i, 'desc') as string;
                const limit = this.getNodeParameter('limit', i, 10) as number;

                const credentials = await this.getCredentials('limitlessApi');
                const apiUrl = credentials.apiUrl as string;
                const normalizedApiUrl = apiUrl.replace(/\/$/, "");
                // For exportMarkdown, the endpoint path might be different or fixed,
                // but we'll use the configured apiEndpointPath for consistency for now.
                // If it should be fixed, this line would be:
                // const apiEndpointPath = 'v1/lifelogs'; // Or whatever the correct fixed path is
                const apiEndpointPath = this.getNodeParameter('apiEndpointPath', i, 'v1/lifelogs') as string;

                const options = {
                    method: 'GET' as IHttpRequestMethods,
                    uri: `${normalizedApiUrl}/${apiEndpointPath.startsWith('/') ? apiEndpointPath.substring(1) : apiEndpointPath}`,
                    qs: {
                        limit: limit.toString(),
                        direction: direction,
                        includeMarkdown: 'true',
                        timezone: timezone,
                    } as IDataObject,
                    json: true,
                } as Omit<OptionsWithUri, 'uri' | 'method' | 'auth' | 'form' | 'followRedirect' | 'agentOptions'> & { uri: string; method: IHttpRequestMethods; qs: IDataObject };

                if (date) {
                    options.qs.date = date.split('T')[0]; // Format as YYYY-MM-DD
                }

                try {
                    responseData = await this.helpers.requestWithAuthentication.call(
                        this,
                        'limitlessApi',
                        options
                    );

                    // Assuming responseData is an array of lifelog objects
                    if (Array.isArray(responseData)) {
                        for (const lifelog of responseData) {
                            returnData.push({ json: lifelog });
                        }
                    } else if (responseData && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data)) {
                        // Handle cases where data might be nested under a 'data' property (common in paginated APIs)
                        for (const lifelog of responseData.data) {
                            returnData.push({ json: lifelog });
                        }
                    } else {
                        // If response is not as expected, wrap it or log an issue
                        returnData.push({ json: responseData });
                    }

                } catch (error) {
                    throw new NodeOperationError(this.getNode(), error);
                }
            } else if (operation === 'summarizeDay') {
                const date = this.getNodeParameter('date', i) as string; // Required
                const timezone = this.getNodeParameter('timezone', i, 'UTC') as string;
                const lifelogLimit = this.getNodeParameter('lifelogLimit', i, 100) as number;
                const promptTemplate = this.getNodeParameter('prompt', i, "You are a helpful assistant that summarizes transcripts. Summarize the following transcripts into a concise overview of the day's events, activities, and key topics discussed:\n\n{{$json.lifelogsText}}") as string;

                if (!date) {
                    throw new NodeOperationError(this.getNode(), 'Date parameter is required for Summarize Day operation.');
                }

                const credentials = await this.getCredentials('limitlessApi');
                const apiUrl = credentials.apiUrl as string;
                const normalizedApiUrl = apiUrl.replace(/\/$/, "");
                const apiEndpointPath = this.getNodeParameter('apiEndpointPath', i, 'v1/lifelogs') as string;

                const options = {
                    method: 'GET' as IHttpRequestMethods,
                    uri: `${normalizedApiUrl}/${apiEndpointPath.startsWith('/') ? apiEndpointPath.substring(1) : apiEndpointPath}`,
                    qs: {
                        limit: lifelogLimit.toString(),
                        date: date.split('T')[0], // Format as YYYY-MM-DD
                        timezone: timezone,
                        includeMarkdown: 'true',
                        direction: 'asc', // Fetch in chronological order
                    } as IDataObject,
                    json: true,
                } as Omit<OptionsWithUri, 'uri' | 'method' | 'auth' | 'form' | 'followRedirect' | 'agentOptions'> & { uri: string; method: IHttpRequestMethods; qs: IDataObject };

                let lifelogsArray: any[] = [];
                try {
                    responseData = await this.helpers.requestWithAuthentication.call(
                        this,
                        'limitlessApi',
                        options
                    );

                    if (Array.isArray(responseData)) {
                        lifelogsArray = responseData;
                    } else if (responseData && typeof responseData === 'object' && responseData.data && Array.isArray(responseData.data)) {
                        lifelogsArray = responseData.data;
                    } else {
                        // If response is not as expected, treat as empty or log an issue
                        this.appendToLog('Unexpected response format when fetching lifelogs for summarization.');
                        lifelogsArray = [];
                    }

                } catch (error) {
                    throw new NodeOperationError(this.getNode(), error);
                }

                const lifelogsText = lifelogsArray.map(log => log.markdown || '').join('\n\n---\n\n');

                // Phase 2: LLM Integration
                const chatModelCredentialName = this.getNodeParameter('chatModel', i) as string;
                if (!chatModelCredentialName) {
                    throw new NodeOperationError(this.getNode(), 'Chat Model credential name is required for Summarize Day operation.');
                }

                try {
                    const chatModelInstance = await this.helpers.getChatModel(chatModelCredentialName, i, this.getContext('execution'));

                    // The prompt in JSON uses {{$json.lifelogsText}}, which is for n8n expressions.
                    // For LangChain PromptTemplate, it should be a simple variable like {text}.
                    const processedPromptTemplate = promptTemplate.replace('{{$json.lifelogsText}}', '{text}');

                    const prompt = new PromptTemplate({
                        template: processedPromptTemplate,
                        inputVariables: ['text'],
                    });

                    const chain = new LLMChain({ llm: chatModelInstance, prompt });
                    const summaryResponse = await chain.call({ text: lifelogsText });

                    // Extract the summary text (actual key might be 'text', 'output', etc. depending on the chain/LLM)
                    const summary = summaryResponse.text; 

                    returnData.push({ json: { summary } });

                } catch (error) {
                    if (error instanceof NodeApiError) {
                         // Handle specific NodeApiError if needed, or rethrow
                        throw error;
                    }
                    // Ensure a NodeOperationError for other errors
                    throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
                }
            }
        }

        return this.prepareOutputData(returnData);
    }
}
