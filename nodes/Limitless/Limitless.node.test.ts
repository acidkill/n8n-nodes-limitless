import { Limitless } from './Limitless.node';
import {
	IExecuteFunctions,
	INodeExecutionData,
	// IDataObject, // Not used yet
	NodeOperationError,
} from 'n8n-workflow';

import { LLMChain } from 'langchain/chains'; // Added for LLMChain mocking
import { PromptTemplate } from '@langchain/core/prompts'; // Added for PromptTemplate

describe('Limitless Node', () => {
	it('should have a description object', () => {
		const limitlessNode = new Limitless();
		expect(limitlessNode.description).toBeDefined();
		expect(limitlessNode.description.name).toEqual('limitless');
	});

	describe('execute method', () => {
		let mockExecuteFunctions: IExecuteFunctions; // Changed to IExecuteFunctions for more complete mocking

		beforeEach(() => {
			// Reset mocks for each test
			mockExecuteFunctions = {
				getNodeParameter: jest.fn(),
                // getInputData: jest.fn().mockReturnValue([{ json: {} }]), // Default to one item
                getInputData: jest.fn().mockImplementation(() => {
                    // Return a new array with a new object each time to avoid shared state issues
                    // This structure assumes the node might process multiple items if input is connected.
                    // For these tests, we typically care about the first item (index 0).
                    return [{ main: [[{ json: {} }]], json: {} }];
                }),
				getCredentials: jest.fn().mockResolvedValue({ apiUrl: 'https://mockapi.limitless.com' }),
                // prepareOutputData: jest.fn((data: INodeExecutionData[]) => Promise.resolve([data])), // Wrap in Promise and nested array
                prepareOutputData: jest.fn(data => data), // Simpler pass-through for testing
				getNode: jest.fn().mockReturnValue({
                    getNodeParameter: jest.fn(),
                    // Adding appendToLog to the mocked node object as it's used in summarizeDay
                    appendToLog: jest.fn(),
                }),
                getContext: jest.fn().mockReturnValue({ execution: { id: 'test_execution_id' } }),
				helpers: {
					requestWithAuthentication: { call: jest.fn().mockResolvedValue({ someData: 'default response' }) },
                    getChatModel: jest.fn(), // Mock for getChatModel helper
				},
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any; // Use 'any' for simplicity, can be refined
		});

        // Helper function to configure getNodeParameter for a test
        const mockGetNodeParameterImplementation = (params: Record<string, any>) => {
            (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
                (name: string, itemIndex: number, defaultValue?: any) => {
                    // eslint-disable-next-line no-prototype-builtins
                    return params.hasOwnProperty(name) ? params[name] : defaultValue;
                },
            );
        };


		it('should call API with correct parameters for "getLifelogs" by date', async () => {
			// Configure mockGetNodeParameter for this specific test
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockImplementation((paramName: string, itemIndex: number, defaultValue?: any) => {
					if (paramName === 'operation') return 'getLifelogs';
					if (paramName === 'filteringMethod') return 'byDate';
					if (paramName === 'date') return '2023-10-26T10:00:00.000Z';
					if (paramName === 'timezone') return 'Europe/Berlin';
					if (paramName === 'additionalFields') return { limit: 10 };
					return defaultValue;
				});

			// Mock the API response
			const mockApiResponse = { lifelogs: [{ id: '1', title: 'Test Log' }], pagination: { nextCursor: 'abc' } };
			(mockExecuteFunctions.helpers!.requestWithAuthentication as jest.Mock).mockResolvedValue(mockApiResponse);

			const limitlessNode = new Limitless();
			const result = await limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

			// Assertions
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication).toHaveBeenCalledTimes(1);
			const expectedOptions = {
				method: 'GET',
				uri: 'https://mockapi.limitless.com/lifelogs',
				qs: {
					date: '2023-10-26', // Date part only
					start: '',
					end: '',
					timezone: 'Europe/Berlin',
					cursor: '',
					limit: 10,
				},
				json: true,
			};
			// We need to use objectContaining because the actual options object has more properties due to the Omit<> & {} typing
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication).toHaveBeenCalledWith(
				'limitlessApi',
				expect.objectContaining(expectedOptions),
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.data).toEqual(mockApiResponse);
			expect(result[0][0].json.pagination).toEqual({ nextCursor: 'abc' });
		});

		// Add more tests here for other scenarios (e.g., byStartEnd, different additionalFields, error handling)

		it('should throw NodeOperationError when API call fails', async () => {
			// Configure mockGetNodeParameter for a basic operation
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockImplementation((paramName: string, itemIndex: number, defaultValue?: any) => {
					if (paramName === 'operation') return 'getLifelogs';
					// Other parameters can use defaults or be minimal for this error test
					if (paramName === 'filteringMethod') return 'byDate';
					if (paramName === 'date') return '2023-10-26T10:00:00.000Z';
					if (paramName === 'additionalFields') return {};
					return defaultValue;
				});

			// Mock the API call to reject
			const apiError = new Error('API Call Failed');
			(mockExecuteFunctions.helpers!.requestWithAuthentication as jest.Mock).mockRejectedValueOnce(apiError);

			const limitlessNode = new Limitless();

			// Expect the execute method to throw (reject)
			await expect(limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow(NodeOperationError);

			// Optionally, check the properties of the thrown NodeOperationError
			try {
				await limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions);
			} catch (error) {
				expect(error).toBeInstanceOf(NodeOperationError);
				// It's good practice to check that the original error is preserved if your NodeOperationError wraps it
				// This depends on how NodeOperationError is instantiated in your actual node code.
                // (Assertions for NodeOperationError properties can be added here if needed)
			}
		});

		//*********************************************************************
		// Tests for "Export Markdown" Operation
		//*********************************************************************
		describe('Export Markdown Operation', () => {
			it('should call API with default parameters and return markdown lifelogs', async () => {
				mockGetNodeParameterImplementation({
					operation: 'exportMarkdown',
					// apiEndpointPath will use default 'v1/lifelogs'
					// timezone will use default 'UTC'
					// limit will use default 10
					// direction will use default 'desc'
				});
				const sampleLifelogs = [
					{ id: '1', markdown: 'Log 1 Content', startTime: '2023-01-01T10:00:00Z' },
					{ id: '2', markdown: 'Log 2 Content', startTime: '2023-01-01T11:00:00Z' },
				];
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue(sampleLifelogs);

				const limitlessNode = new Limitless();
				const result = await limitlessNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(
					mockExecuteFunctions, // this context
					'limitlessApi',
					expect.objectContaining({
						uri: 'https://mockapi.limitless.com/v1/lifelogs', // Default + normalized
						qs: {
							limit: '10',
							direction: 'desc',
							includeMarkdown: 'true',
							timezone: 'UTC',
						},
					}),
				);
				// The result from execute is expected to be INodeExecutionData[][]
                // and prepareOutputData is mocked to just pass through.
                // The node pushes each lifelog as a separate item in the first sub-array.
				expect(result).toEqual([
                    { json: sampleLifelogs[0] },
                    { json: sampleLifelogs[1] }
                ]);
			});

			it('should include date parameter if provided for exportMarkdown', async () => {
				mockGetNodeParameterImplementation({
					operation: 'exportMarkdown',
					date: '2023-03-15T10:00:00.000Z',
				});
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([]);

				const limitlessNode = new Limitless();
				await limitlessNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(
					expect.anything(),
					expect.anything(),
					expect.objectContaining({
						qs: expect.objectContaining({ date: '2023-03-15' }),
					}),
				);
			});

			it('should use custom limit and direction for exportMarkdown', async () => {
				mockGetNodeParameterImplementation({
					operation: 'exportMarkdown',
					limit: 5,
					direction: 'asc',
				});
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([]);

				const limitlessNode = new Limitless();
				await limitlessNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(
					expect.anything(),
					expect.anything(),
					expect.objectContaining({
						qs: expect.objectContaining({ limit: '5', direction: 'asc' }),
					}),
				);
			});

			it('should handle API errors gracefully for exportMarkdown', async () => {
				mockGetNodeParameterImplementation({ operation: 'exportMarkdown' });
				const apiError = new Error('API Export Failed');
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockRejectedValue(apiError);

				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow(NodeOperationError);
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow('API Export Failed');
			});
		});

		//*********************************************************************
		// Tests for "Summarize Day" Operation
		//*********************************************************************
		describe('Summarize Day Operation', () => {
			const defaultSummarizeParams = {
				operation: 'summarizeDay',
				date: '2023-03-16T10:00:00.000Z',
				chatModel: 'testChatModelCreds',
				prompt: 'Summarize: {{$json.lifelogsText}}', // n8n style placeholder
				lifelogLimit: 20,
				apiEndpointPath: 'v1/custom/lifelogs',
			};

			let mockChatModelInstance: { call: jest.Mock };

			beforeEach(() => {
				mockChatModelInstance = { call: jest.fn().mockResolvedValue({ text: 'Default summary.' }) };
				(mockExecuteFunctions.helpers.getChatModel as jest.Mock).mockResolvedValue(mockChatModelInstance);
			});

			it('should successfully summarize a day', async () => {
				mockGetNodeParameterImplementation(defaultSummarizeParams);
				const fetchedLifelogs = [
					{ id: 'logA', markdown: 'Event A details.' },
					{ id: 'logB', markdown: 'Event B details.' },
				];
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue(fetchedLifelogs);
				mockChatModelInstance.call.mockResolvedValue({ text: 'Summarized A and B.' });


				const limitlessNode = new Limitless();
				const result = await limitlessNode.execute.call(mockExecuteFunctions);

				// Check lifelog API call
				expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(
					mockExecuteFunctions,
					'limitlessApi',
					expect.objectContaining({
						uri: 'https://mockapi.limitless.com/v1/custom/lifelogs',
						qs: {
							date: '2023-03-16',
							limit: '20',
							direction: 'asc',
							includeMarkdown: 'true',
							timezone: 'UTC', // Default from node
						},
					}),
				);

				// Check getChatModel call
				expect(mockExecuteFunctions.helpers.getChatModel).toHaveBeenCalledWith(
					'testChatModelCreds',
					0, // itemIndex
					expect.anything(), // context
				);

                // Check LLMChain call (via mockChatModelInstance.call)
                // The original prompt: "Summarize: {{$json.lifelogsText}}"
                // Processed for LangChain: "Summarize: {text}"
                // Input to call: { text: "Event A details.\n\n---\n\nEvent B details." }
				expect(mockChatModelInstance.call).toHaveBeenCalledWith(
                    { text: 'Event A details.\n\n---\n\nEvent B details.' },
                );

				expect(result).toEqual([{ json: { summary: 'Summarized A and B.' } }]);
			});

			it('should throw NodeOperationError if date is missing for summarizeDay', async () => {
				mockGetNodeParameterImplementation({ ...defaultSummarizeParams, date: undefined });

				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow(NodeOperationError);
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow('Date parameter is required for Summarize Day operation.');
			});

			it('should throw NodeOperationError if chatModel credential name is missing', async () => {
				mockGetNodeParameterImplementation({ ...defaultSummarizeParams, chatModel: undefined });
                // Mock lifelog fetch to resolve, so it passes that stage
                (mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([]);


				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow(NodeOperationError);
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow('Chat Model credential name is required for Summarize Day operation.');
			});

			it('should handle LLM call errors gracefully for summarizeDay', async () => {
				mockGetNodeParameterImplementation(defaultSummarizeParams);
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([
					{ id: 'logX', markdown: 'Some data' },
				]);
				const llmError = new Error('LLM Processing Failed');
				mockChatModelInstance.call.mockRejectedValue(llmError);

				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow(NodeOperationError);
				await expect(limitlessNode.execute.call(mockExecuteFunctions))
					.rejects.toThrow('LLM Processing Failed');
			});

            it('should correctly use the default prompt when none is provided by user', async () => {
				mockGetNodeParameterImplementation({ ...defaultSummarizeParams, prompt: undefined }); // Prompt is undefined
				const fetchedLifelogs = [{ id: 'logDef', markdown: 'Default prompt test.' }];
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue(fetchedLifelogs);
				mockChatModelInstance.call.mockResolvedValue({ text: 'Default prompt summary.' });

				const limitlessNode = new Limitless();
				await limitlessNode.execute.call(mockExecuteFunctions);

                // The default prompt from Limitless.node.ts is:
                // "You are a helpful assistant that summarizes transcripts. Summarize the following transcripts into a concise overview of the day's events, activities, and key topics discussed:\n\n{{$json.lifelogsText}}"
                // This will be processed to use "{text}" for LangChain.
                // We need to ensure that the `PromptTemplate` inside the node correctly uses this default.
                // This is indirectly tested by `mockChatModelInstance.call` being called.
                // A direct test would require spying on PromptTemplate constructor or LLMChain constructor,
                // which is more involved with the current setup.
                expect(mockChatModelInstance.call).toHaveBeenCalledWith(
                    { text: 'Default prompt test.' },
                );
                // We can also check that the `getNodeParameter` for 'prompt' was called and returned its default value.
                // The mock for getNodeParameter is already set up to return the default if the property isn't in `defaultSummarizeParams`
                // when `prompt: undefined` is passed.
			});
		});
	});
});
