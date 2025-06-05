"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Limitless_node_1 = require("./Limitless.node");
const n8n_workflow_1 = require("n8n-workflow");
const chains_1 = require("langchain/chains");
jest.mock('langchain/chains');
describe('Limitless Node', () => {
    it('should have a description object', () => {
        const limitlessNode = new Limitless_node_1.Limitless();
        expect(limitlessNode.description).toBeDefined();
        expect(limitlessNode.description.name).toEqual('limitless');
    });
    describe('execute method', () => {
        let mockExecuteFunctions;
        beforeEach(() => {
            mockExecuteFunctions = {
                getNodeParameter: jest.fn(),
                getInputData: jest.fn().mockImplementation(() => {
                    return [{ main: [[{ json: {} }]], json: {} }];
                }),
                getCredentials: jest.fn().mockResolvedValue({ apiUrl: 'https://mockapi.limitless.com' }),
                prepareOutputData: jest.fn((data) => Promise.resolve([data])),
                getNode: jest.fn().mockReturnValue({
                    getNodeParameter: jest.fn(),
                    appendToLog: jest.fn(),
                }),
                getContext: jest.fn().mockReturnValue({ execution: { id: 'test_execution_id' } }),
                helpers: {
                    requestWithAuthentication: { call: jest.fn().mockResolvedValue({ someData: 'default response' }) },
                    getChatModel: jest.fn(),
                },
            };
        });
        const mockGetNodeParameterImplementation = (params) => {
            mockExecuteFunctions.getNodeParameter.mockImplementation((name, itemIndex, nodeDefaultValue) => {
                if (params.hasOwnProperty(name) && params[name] !== undefined) {
                    return params[name];
                }
                return nodeDefaultValue;
            });
        };
        it('should call API with correct parameters for "getLifelogs" by date', async () => {
            mockExecuteFunctions.getNodeParameter
                .mockImplementation((paramName, itemIndex, defaultValue) => {
                if (paramName === 'operation')
                    return 'getLifelogs';
                if (paramName === 'filteringMethod')
                    return 'byDate';
                if (paramName === 'date')
                    return '2023-10-26T10:00:00.000Z';
                if (paramName === 'timezone')
                    return 'Europe/Berlin';
                if (paramName === 'additionalFields')
                    return { limit: 10 };
                return defaultValue;
            });
            const mockApiResponse = { lifelogs: [{ id: '1', title: 'Test Log' }], pagination: { nextCursor: 'abc' } };
            mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue(mockApiResponse);
            const limitlessNode = new Limitless_node_1.Limitless();
            const result = await limitlessNode.execute.call(mockExecuteFunctions);
            expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledTimes(1);
            const expectedOptions = {
                method: 'GET',
                uri: 'https://mockapi.limitless.com/v1/lifelogs',
                qs: {
                    date: '2023-10-26',
                    start: '',
                    end: '',
                    timezone: 'Europe/Berlin',
                    cursor: '',
                    limit: 10,
                },
                json: true,
            };
            expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(mockExecuteFunctions, 'limitlessApi', expect.objectContaining(expectedOptions));
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveLength(1);
            expect(result[0][0].json.data).toEqual(mockApiResponse);
            expect(result[0][0].json.pagination).toEqual({ nextCursor: 'abc' });
        });
        it('should call API with correct parameters for "getLifelogs" by start/end time', async () => {
            mockExecuteFunctions.getNodeParameter
                .mockImplementation((paramName, itemIndex, defaultValue) => {
                if (paramName === 'operation')
                    return 'getLifelogs';
                if (paramName === 'filteringMethod')
                    return 'byStartEnd';
                if (paramName === 'start')
                    return '2023-10-26T10:00:00.000Z';
                if (paramName === 'end')
                    return '2023-10-27T10:00:00.000Z';
                if (paramName === 'timezone')
                    return 'Europe/Berlin';
                if (paramName === 'additionalFields')
                    return { limit: 10 };
                return defaultValue;
            });
            const mockApiResponse = { lifelogs: [{ id: '1', title: 'Test Log' }], pagination: { nextCursor: 'abc' } };
            mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue(mockApiResponse);
            const limitlessNode = new Limitless_node_1.Limitless();
            const result = await limitlessNode.execute.call(mockExecuteFunctions);
            expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledTimes(1);
            const expectedOptions = {
                method: 'GET',
                uri: 'https://mockapi.limitless.com/v1/lifelogs',
                qs: {
                    date: '',
                    start: '2023-10-26T10:00:00.000Z',
                    end: '2023-10-27T10:00:00.000Z',
                    timezone: 'Europe/Berlin',
                    cursor: '',
                    limit: 10,
                },
                json: true,
            };
            expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(mockExecuteFunctions, 'limitlessApi', expect.objectContaining(expectedOptions));
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveLength(1);
            expect(result[0][0].json.data).toEqual(mockApiResponse);
            expect(result[0][0].json.pagination).toEqual({ nextCursor: 'abc' });
        });
        it('should throw NodeOperationError when API call fails', async () => {
            mockExecuteFunctions.getNodeParameter
                .mockImplementation((paramName, itemIndex, defaultValue) => {
                if (paramName === 'operation')
                    return 'getLifelogs';
                if (paramName === 'filteringMethod')
                    return 'byDate';
                if (paramName === 'date')
                    return '2023-10-26T10:00:00.000Z';
                if (paramName === 'additionalFields')
                    return {};
                return defaultValue;
            });
            const apiError = new Error('API Call Failed');
            mockExecuteFunctions.helpers.requestWithAuthentication.call.mockRejectedValueOnce(apiError);
            const limitlessNode = new Limitless_node_1.Limitless();
            await expect(limitlessNode.execute.call(mockExecuteFunctions))
                .rejects.toThrow(n8n_workflow_1.NodeOperationError);
            try {
                await limitlessNode.execute.call(mockExecuteFunctions);
            }
            catch (error) {
                expect(error).toBeInstanceOf(n8n_workflow_1.NodeOperationError);
            }
        });
        describe('Export Markdown Operation', () => {
            it('should call API with default parameters and return markdown lifelogs', async () => {
                mockGetNodeParameterImplementation({
                    operation: 'exportMarkdown',
                });
                const sampleLifelogs = [
                    { id: '1', markdown: 'Log 1 Content', startTime: '2023-01-01T10:00:00Z' },
                    { id: '2', markdown: 'Log 2 Content', startTime: '2023-01-01T11:00:00Z' },
                ];
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue(sampleLifelogs);
                const limitlessNode = new Limitless_node_1.Limitless();
                const result = await limitlessNode.execute.call(mockExecuteFunctions);
                expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(mockExecuteFunctions, 'limitlessApi', expect.objectContaining({
                    uri: 'https://mockapi.limitless.com/v1/lifelogs',
                    qs: {
                        limit: '10',
                        direction: 'desc',
                        includeMarkdown: 'true',
                        timezone: 'UTC',
                    },
                }));
                expect(result[0]).toEqual([
                    { json: sampleLifelogs[0] },
                    { json: sampleLifelogs[1] }
                ]);
            });
            it('should include date parameter if provided for exportMarkdown', async () => {
                mockGetNodeParameterImplementation({
                    operation: 'exportMarkdown',
                    date: '2023-03-15T10:00:00.000Z',
                });
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue([]);
                const limitlessNode = new Limitless_node_1.Limitless();
                await limitlessNode.execute.call(mockExecuteFunctions);
                expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(mockExecuteFunctions, 'limitlessApi', expect.objectContaining({
                    qs: expect.objectContaining({ date: '2023-03-15' }),
                }));
            });
            it('should use custom limit and direction for exportMarkdown', async () => {
                mockGetNodeParameterImplementation({
                    operation: 'exportMarkdown',
                    limit: 5,
                    direction: 'asc',
                });
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue([]);
                const limitlessNode = new Limitless_node_1.Limitless();
                await limitlessNode.execute.call(mockExecuteFunctions);
                expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(mockExecuteFunctions, 'limitlessApi', expect.objectContaining({
                    qs: expect.objectContaining({ limit: '5', direction: 'asc' }),
                }));
            });
            it('should handle API errors gracefully for exportMarkdown', async () => {
                mockGetNodeParameterImplementation({ operation: 'exportMarkdown' });
                const apiError = new Error('API Export Failed');
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockRejectedValue(apiError);
                const limitlessNode = new Limitless_node_1.Limitless();
                await expect(limitlessNode.execute.call(mockExecuteFunctions))
                    .rejects.toThrow(n8n_workflow_1.NodeOperationError);
                await expect(limitlessNode.execute.call(mockExecuteFunctions))
                    .rejects.toThrow('API Export Failed');
            });
        });
        describe('Summarize Day Operation', () => {
            const defaultSummarizeParams = {
                operation: 'summarizeDay',
                date: '2023-03-16T10:00:00.000Z',
                chatModel: 'testChatModelCreds',
                prompt: 'Summarize: {{$json.lifelogsText}}',
                lifelogLimit: 20,
            };
            let mockLLMChainCall;
            beforeEach(() => {
                mockLLMChainCall = jest.fn().mockResolvedValue({ text: 'Default summary.' });
                mockExecuteFunctions.helpers.getChatModel.mockResolvedValue({});
                chains_1.LLMChain.mockImplementation(() => {
                    return {
                        call: mockLLMChainCall,
                    };
                });
            });
            it('should successfully summarize a day', async () => {
                mockGetNodeParameterImplementation(defaultSummarizeParams);
                const fetchedLifelogs = [
                    { id: 'logA', markdown: 'Event A details.' },
                    { id: 'logB', markdown: 'Event B details.' },
                ];
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue(fetchedLifelogs);
                mockLLMChainCall.mockResolvedValue({ text: 'Summarized A and B.' });
                const limitlessNode = new Limitless_node_1.Limitless();
                const result = await limitlessNode.execute.call(mockExecuteFunctions);
                expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(mockExecuteFunctions, 'limitlessApi', expect.objectContaining({
                    uri: 'https://mockapi.limitless.com/v1/lifelogs',
                    qs: expect.objectContaining({
                        date: '2023-03-16',
                        limit: '20',
                        direction: 'asc',
                        includeMarkdown: 'true',
                        timezone: 'UTC',
                    }),
                }));
                expect(mockExecuteFunctions.helpers.getChatModel).toHaveBeenCalledWith('testChatModelCreds', 0, expect.anything());
                expect(mockLLMChainCall).toHaveBeenCalledWith({ text: 'Event A details.\n\n---\n\nEvent B details.' });
                expect(result[0]).toEqual([{ json: { summary: 'Summarized A and B.' } }]);
            });
            it('should throw NodeOperationError if date is missing for summarizeDay', async () => {
                mockGetNodeParameterImplementation({ ...defaultSummarizeParams, date: undefined });
                const limitlessNode = new Limitless_node_1.Limitless();
                await expect(limitlessNode.execute.call(mockExecuteFunctions))
                    .rejects.toThrow('Date parameter is required for Summarize Day operation.');
            });
            it('should throw NodeOperationError if chatModel credential name is missing', async () => {
                mockGetNodeParameterImplementation({ ...defaultSummarizeParams, chatModel: undefined });
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue([]);
                const limitlessNode = new Limitless_node_1.Limitless();
                await expect(limitlessNode.execute.call(mockExecuteFunctions))
                    .rejects.toThrow('Chat Model credential name is required for Summarize Day operation.');
            });
            it('should handle LLM call errors gracefully for summarizeDay', async () => {
                mockGetNodeParameterImplementation(defaultSummarizeParams);
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue([
                    { id: 'logX', markdown: 'Some data' },
                ]);
                const llmError = new Error('LLM Processing Failed');
                mockLLMChainCall.mockRejectedValue(llmError);
                const limitlessNode = new Limitless_node_1.Limitless();
                await expect(limitlessNode.execute.call(mockExecuteFunctions))
                    .rejects.toThrow('LLM Processing Failed');
            });
            it('should correctly use the default prompt when none is provided by user', async () => {
                mockGetNodeParameterImplementation({ ...defaultSummarizeParams, prompt: undefined });
                const fetchedLifelogs = [{ id: 'logDef', markdown: 'Default prompt test.' }];
                mockExecuteFunctions.helpers.requestWithAuthentication.call.mockResolvedValue(fetchedLifelogs);
                mockLLMChainCall.mockResolvedValue({ text: 'Default prompt summary.' });
                const limitlessNode = new Limitless_node_1.Limitless();
                const result = await limitlessNode.execute.call(mockExecuteFunctions);
                expect(mockLLMChainCall).toHaveBeenCalledWith({ text: 'Default prompt test.' });
                expect(result[0]).toEqual([{ json: { summary: 'Default prompt summary.' } }]);
            });
        });
    });
});
//# sourceMappingURL=Limitless.node.test.js.map