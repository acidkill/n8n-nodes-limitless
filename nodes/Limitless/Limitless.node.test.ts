import { Limitless } from './Limitless.node';
import {
	IExecuteFunctions,
	INodeExecutionData, // Re-add this import
	// IDataObject, // Not used yet
	NodeOperationError,
} from 'n8n-workflow';

// Import LLMChain for mocking
import { LLMChain } from 'langchain/chains';

// Mock the langchain module
jest.mock('langchain/chains');

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
                prepareOutputData: jest.fn((data: INodeExecutionData[]) => Promise.resolve([data])), // Wrap in Promise and nested array
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
                (name: string, itemIndex: number, nodeDefaultValue?: any) => { // Renamed defaultValue for clarity
                    // eslint-disable-next-line no-prototype-builtins
                    // If the parameter is in params AND it's not undefined, use it. Otherwise, use node's default.
                    if (params.hasOwnProperty(name) && params[name] !== undefined) {
                        return params[name];
                    }
                    return nodeDefaultValue;
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
			(mockExecuteFunctions.helpers!.requestWithAuthentication.call as jest.Mock).mockResolvedValue(mockApiResponse);

			const limitlessNode = new Limitless();
			const result = await limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

			// Assertions
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication.call).toHaveBeenCalledTimes(1);
			const expectedOptions = {
				method: 'GET',
				uri: 'https://mockapi.limitless.com/v1/lifelogs', // Default path
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
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions, // this context
				'limitlessApi',
				expect.objectContaining(expectedOptions),
			);

			expect(result).toHaveLength(1); // One batch of results
			expect(result[0]).toHaveLength(1); // One item in that batch
			expect(result[0][0].json.data).toEqual(mockApiResponse);
			expect(result[0][0].json.pagination).toEqual({ nextCursor: 'abc' });
			// The above toEqual check implicitly verifies the structure of lifelogs.
			// The specific check for lifelogs length can be removed to avoid TS errors with IDataObject.
		});

		it('should call API with correct parameters for "getLifelogs" by start/end time', async () => {
			// Configure mockGetNodeParameter for this specific test
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockImplementation((paramName: string, itemIndex: number, defaultValue?: any) => {
					if (paramName === 'operation') return 'getLifelogs';
					if (paramName === 'filteringMethod') return 'byStartEnd';
					if (paramName === 'start') return '2023-10-26T10:00:00.000Z';
					if (paramName === 'end') return '2023-10-27T10:00:00.000Z';
					if (paramName === 'timezone') return 'Europe/Berlin';
					if (paramName === 'additionalFields') return { limit: 10 };
					return defaultValue;
				});

			// Mock the API response
			const mockApiResponse = { lifelogs: [{ id: '1', title: 'Test Log' }], pagination: { nextCursor: 'abc' } };
			(mockExecuteFunctions.helpers!.requestWithAuthentication.call as jest.Mock).mockResolvedValue(mockApiResponse);

			const limitlessNode = new Limitless();
			const result = await limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

			// Assertions
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication.call).toHaveBeenCalledTimes(1);
			const expectedOptions = {
				method: 'GET',
				uri: 'https://mockapi.limitless.com/v1/lifelogs', // Updated to match the API path
				qs: {
					date: '',
					start: '2023-10-26T00:00:00Z', // Start of day
					end: '2023-10-27T23:59:59Z', // End of day
					timezone: 'Europe/Berlin',
					cursor: '',
					limit: 10,
				},
				json: true,
			};
			// We need to use objectContaining because the actual options object has more properties due to the Omit<> & {} typing
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication.call).toHaveBeenCalledWith(
				mockExecuteFunctions, // this context
				'limitlessApi',
				expect.objectContaining(expectedOptions),
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.data).toEqual(mockApiResponse);
			expect(result[0][0].json.pagination).toEqual({ nextCursor: 'abc' });
		});

		// Add more tests here for other scenarios (e.g., different additionalFields, error handling)

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
			(mockExecuteFunctions.helpers!.requestWithAuthentication.call as jest.Mock).mockRejectedValueOnce(apiError);

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
                // and prepareOutputData is mocked to wrap the data in an array.
                // The node pushes each lifelog as a separate item into returnData.
                // So result[0] should be the array of lifelogs.
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
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([]);

				const limitlessNode = new Limitless();
				await limitlessNode.execute.call(mockExecuteFunctions);

				expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(
					mockExecuteFunctions, // this context
					'limitlessApi',
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
					mockExecuteFunctions, // this context
					'limitlessApi',
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
				// First call to ensure it throws NodeOperationError
				await expect(limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions))
					.rejects.toThrow(NodeOperationError);
				// Second call to check the specific error message (Jest requires a new call for a new error check)
				await expect(limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions))
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
				// apiEndpointPath will use default 'v1/lifelogs' from node if not specified
			};

			let mockLLMChainCall: jest.Mock; // Renamed for clarity

			beforeEach(() => {
				// This mock represents the .call() method of an LLMChain instance
				mockLLMChainCall = jest.fn().mockResolvedValue({ text: 'Default summary.' });

				// Mock the getChatModel helper to return something that LLMChain can use
				// For this test, getChatModel itself doesn't need to return a full LLM,
				// as LLMChain is mocked. It just needs to return something truthy.
				((mockExecuteFunctions.helpers as any).getChatModel as jest.Mock).mockResolvedValue({}); // Mock it as returning a generic object

				// Mock LLMChain constructor to return an instance that uses our mockLLMChainCall
				(LLMChain as jest.MockedClass<typeof LLMChain>).mockImplementation(() => {
					return {
						call: mockLLMChainCall,
					} as any;
				});
			});

			it('should successfully summarize a day', async () => {
				mockGetNodeParameterImplementation(defaultSummarizeParams);
				const fetchedLifelogs = [
					{ id: 'logA', markdown: 'Event A details.' },
					{ id: 'logB', markdown: 'Event B details.' },
				];
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue(fetchedLifelogs);
				mockLLMChainCall.mockResolvedValue({ text: 'Summarized A and B.' });


				const limitlessNode = new Limitless();
				const result = await limitlessNode.execute.call(mockExecuteFunctions);

				// Check lifelog API call
				expect(mockExecuteFunctions.helpers.requestWithAuthentication.call).toHaveBeenCalledWith(
					mockExecuteFunctions, // this context
					'limitlessApi',
					expect.objectContaining({
						uri: 'https://mockapi.limitless.com/v1/lifelogs', // Default path
						qs: expect.objectContaining({ // Ensure this matches what the node sends
							date: '2023-03-16',
							limit: '20',
							direction: 'asc',
							includeMarkdown: 'true',
							timezone: 'UTC',
						}),
					}),
				);

				// Check getChatModel call
				expect((mockExecuteFunctions.helpers as any).getChatModel).toHaveBeenCalledWith(
					'testChatModelCreds',
					0, // itemIndex
					expect.anything(), // context
				);

                // Check LLMChain's call method was invoked correctly
				expect(mockLLMChainCall).toHaveBeenCalledWith(
                    { text: 'Event A details.\n\n---\n\nEvent B details.' },
                );

				expect(result[0]).toEqual([{ json: { summary: 'Summarized A and B.' } }]);
			});

			it('should throw NodeOperationError if date is missing for summarizeDay', async () => {
				mockGetNodeParameterImplementation({ ...defaultSummarizeParams, date: undefined });

				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions))
					.rejects.toThrow('Date parameter is required for Summarize Day operation.');
			});

			it('should throw NodeOperationError if chatModel credential name is missing', async () => {
				mockGetNodeParameterImplementation({ ...defaultSummarizeParams, chatModel: undefined });
                (mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([]);


				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions))
					.rejects.toThrow('Chat Model credential name is required for Summarize Day operation.');
			});

			it('should handle LLM call errors gracefully for summarizeDay', async () => {
				mockGetNodeParameterImplementation(defaultSummarizeParams);
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue([
					{ id: 'logX', markdown: 'Some data' },
				]);
				const llmError = new Error('LLM Processing Failed');
				mockLLMChainCall.mockRejectedValue(llmError);

				const limitlessNode = new Limitless();
				await expect(limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions))
					.rejects.toThrow('LLM Processing Failed');
			});

            it('should correctly use the default prompt when none is provided by user', async () => {
				mockGetNodeParameterImplementation({ ...defaultSummarizeParams, prompt: undefined }); // Prompt is undefined
				const fetchedLifelogs = [{ id: 'logDef', markdown: 'Default prompt test.' }];
				(mockExecuteFunctions.helpers.requestWithAuthentication.call as jest.Mock).mockResolvedValue(fetchedLifelogs);
				mockLLMChainCall.mockResolvedValue({ text: 'Default prompt summary.' });

				const limitlessNode = new Limitless();
				const result = await limitlessNode.execute.call(mockExecuteFunctions);

				expect(mockLLMChainCall).toHaveBeenCalledWith(
                    { text: 'Default prompt test.' },
                );
                expect(result[0]).toEqual([{ json: { summary: 'Default prompt summary.' } }]);
			});
		});
	});
});
