"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitlessApi = void 0;
class LimitlessApi {
    constructor() {
        this.name = 'limitlessApi';
        this.displayName = 'Limitless API';
        this.documentationUrl = 'https://docs.limitlessai.com/api';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                default: '',
                required: true,
                typeOptions: {
                    password: true,
                },
                description: 'Your Limitless API key',
            },
            {
                displayName: 'API URL',
                name: 'apiUrl',
                type: 'string',
                default: 'https://api.limitlessai.com',
                description: 'The URL of the Limitless API',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    'X-API-Key': '={{$credentials.apiKey}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.apiUrl}}',
                url: '/lifelogs',
                method: 'GET',
            },
        };
    }
}
exports.LimitlessApi = LimitlessApi;
//# sourceMappingURL=LimitlessApi.credentials.js.map