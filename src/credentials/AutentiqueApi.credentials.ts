import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class AutentiqueApi implements ICredentialType {
  public name: string = 'autentiqueApi';

  public displayName: string = 'Autentique API';

  public properties: INodeProperties[] = [
    {
      name: 'apiToken',
      displayName: 'API Token',
      description: "API Token generated at Autentique's management console",
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
    },
  ];

  public authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{"Bearer " + $credentials.apiToken}}',
      },
    },
  };

  public test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.autentique.com.br/v2/graphql',
    },
  };
}
