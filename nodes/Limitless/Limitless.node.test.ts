import { Limitless } from './Limitless.node';
import {
	IExecuteFunctions,
	INodeExecutionData,
	// IDataObject, // Not used yet
	NodeOperationError,
} from 'n8n-workflow';

describe('Limitless Node', () => {
	it('should have a description object', () => {
		const limitlessNode = new Limitless();
		expect(limitlessNode.description).toBeDefined();
		expect(limitlessNode.description.name).toEqual('limitless');
	});

	describe('execute method', () => {
		let mockExecuteFunctions: Partial<IExecuteFunctions>;

		beforeEach(() => {
			// Reset mocks for each test
			mockExecuteFunctions = {
				getNodeParameter: jest.fn(),
				getInputData: jest.fn().mockReturnValue([{ json: {} }]), // Default to one item
				getCredentials: jest.fn().mockResolvedValue({ apiUrl: 'https://mockapi.limitless.com' }),
				prepareOutputData: jest.fn((data: INodeExecutionData[]) => Promise.resolve([data])), // Wrap in Promise and nested array
				getNode: jest.fn().mockReturnValue({ getNodeParameter: jest.fn() }), // Mock basic node structure
				// Mock the helpers object and its methods
				helpers: {
					requestWithAuthentication: jest.fn().mockResolvedValue({ someData: 'default response' }),
					// Add other helper mocks if needed, e.g.
					// getBinaryDataBuffer: jest.fn(),
					// getJsonData: jest.fn(),
					// getWorkflowStaticData: jest.fn(),
					// loadBinaryData: jest.fn(),
					// proxyRequest: jest.fn(),
					// readFile: jest.fn(),
					// request: jest.fn(),
					// returnJsonArray: jest.fn(),
					// returnBinaryFile: jest.fn(),
					// returnFile: jest.fn(),
					// returnWorkflowError: jest.fn(),
					// returnWorkflowSuccess: jest.fn(),
					// sleep: jest.fn(),
					// storeBinaryData: jest.fn(),
					// updateWorkflowStaticData: jest.fn(),
					// deleteWorkflowStaticData: jest.fn(),
					// getFullWorkflowUrl: jest.fn(),
					// getWorkflowBaseUrl: jest.fn(),
					// getWebhookUrl: jest.fn(),
					// getRestApiUrl: jest.fn(),
					// getHeader: jest.fn(),
					// getQueryParameters: jest.fn(),
					// getBodyParameters: jest.fn(),
					// getParameters: jest.fn(),
					// getParameter: jest.fn(),
					// getParameterInt: jest.fn(),
					// getParameterFloat: jest.fn(),
					// getParameterBoolean: jest.fn(),
					// getParameterString: jest.fn(),
					// getParameterDateTime: jest.fn(),
					// getParameterArray: jest.fn(),
					// getParameterObject: jest.fn(),
					// getParameterJson: jest.fn(),
					// getParameterBinary: jest.fn(),
					// getParameterFixedCollection: jest.fn(),
					// getParameterOptions: jest.fn(),
					// getParameterNumber: jest.fn(),
					// getParameterColor: jest.fn(),
					// getParameterNotice: jest.fn(),
					// getParameterHtml: jest.fn(),
					// getParameterPassword: jest.fn(),
					// getParameterMultiOptions: jest.fn(),
					// getParameterCollection: jest.fn(),
					// getParameterResourceLocator: jest.fn(),
					// getParameterResourceMapper: jest.fn(),
					// getParameterUiPathAsset: jest.fn(),
					// getParameterUiPathQueue: jest.fn(),
					// getParameterUiPathProcess: jest.fn(),
					// getParameterUiPathJob: jest.fn(),
					// getParameterUiPathAlert: jest.fn(),
					// getParameterUiPathFolder: jest.fn(),
					// getParameterUiPathMachine: jest.fn(),
					// getParameterUiPathRobot: jest.fn(),
					// getParameterUiPathTenant: jest.fn(),
					// getParameterUiPathUser: jest.fn(),
					// getParameterUiPathOrganizationUnit: jest.fn(),
					// getParameterUiPathLibrary: jest.fn(),
					// getParameterUiPathPackage: jest.fn(),
					// getParameterUiPathEnvironment: jest.fn(),
					// getParameterUiPathSession: jest.fn(),
					// getParameterUiPathWebhook: jest.fn(),
					// getParameterUiPathActionCatalog: jest.fn(),
					// getParameterUiPathAction: jest.fn(),
					// getParameterUiPathFormTask: jest.fn(),
					// getParameterUiPathTaskCatalog: jest.fn(),
					// getParameterUiPathTask: jest.fn(),
					// getParameterUiPathTaskAssignment: jest.fn(),
					// getParameterUiPathTaskComment: jest.fn(),
					// getParameterUiPathTaskData: jest.fn(),
					// getParameterUiPathTaskFile: jest.fn(),
					// getParameterUiPathTaskForm: jest.fn(),
					// getParameterUiPathTaskUserAssignment: jest.fn(),
					// getParameterUiPathTaskUser: jest.fn(),
					// getParameterUiPathTaskWebhook: jest.fn(),
					// getParameterUiPathTaskAction: jest.fn(),
					// getParameterUiPathTaskActionAssignment: jest.fn(),
					// getParameterUiPathTaskActionComment: jest.fn(),
					// getParameterUiPathTaskActionData: jest.fn(),
					// getParameterUiPathTaskActionFile: jest.fn(),
					// getParameterUiPathTaskActionForm: jest.fn(),
					// getParameterUiPathTaskActionUserAssignment: jest.fn(),
					// getParameterUiPathTaskActionUser: jest.fn(),
					// getParameterUiPathTaskActionWebhook: jest.fn(),
				} as any, // Using 'any' for helpers for brevity in this example
			};
		});

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
			(mockExecuteFunctions.helpers!.requestWithAuthentication as jest.Mock).mockResolvedValue(mockApiResponse);

			const limitlessNode = new Limitless();
			const result = await limitlessNode.execute.call(mockExecuteFunctions as IExecuteFunctions);

			// Assertions
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication).toHaveBeenCalledTimes(1);
			const expectedOptions = {
				method: 'GET',
				uri: 'https://mockapi.limitless.com/lifelogs',
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
			expect(mockExecuteFunctions.helpers!.requestWithAuthentication).toHaveBeenCalledWith(
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
				// For example, if it's new NodeOperationError(this.getNode(), error), then error.cause should be apiError
				// Let's assume for now it's instantiated like: new NodeOperationError(this.getNode(), originalError)
				// And that NodeOperationError sets the 'cause' property.
				// If NodeOperationError doesn't set 'cause', you might check error.message or other properties.
				// The actual check here might need adjustment based on your NodeOperationError implementation.
				// For now, we'll check if the message contains the original error's message.
				// This requires the NodeOperationError to incorporate the original error's message.
				// A more robust check would be if NodeOperationError has a 'cause' property.
				// Let's assume NodeOperationError constructor is:
				// constructor(node: INode, error: Error | IDataObject | string, description?: IDataObject)
				// and it stores the error.
				// In Limitless.node.ts: throw new NodeOperationError(this.getNode(), error);
				// So, the 'cause' or a similar property should hold the original 'apiError'.
				// Jest's toThrow matcher can also take a regex or string for the message.
				// For now, checking the instance is a good start.
				// A more specific check on the error properties can be added if needed.
			}
		});
	});
});
