import {
    IExecuteFunctions,
    INodeExecutionData,
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

                const options = {
                    method: 'GET' as IHttpRequestMethods,
                    uri: `${normalizedApiUrl}/lifelogs`,
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
            }
        }

        return this.prepareOutputData(returnData);
    }
}
