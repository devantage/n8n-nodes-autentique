import { AutentiqueApi } from './AutentiqueApi.credentials';

describe('AutentiqueApi credentials', () => {
  it('defines the expected credential metadata', () => {
    const credential: AutentiqueApi = new AutentiqueApi();

    expect(credential.name).toBe('autentiqueApi');
    expect(credential.displayName).toBe('Autentique API');
    expect(credential.properties).toEqual([
      expect.objectContaining({
        name: 'apiToken',
        displayName: 'API Token',
        required: true,
        type: 'string',
      }),
    ]);
  });

  it('configures bearer authentication and the test endpoint', () => {
    const credential: AutentiqueApi = new AutentiqueApi();

    expect(credential.authenticate).toEqual({
      type: 'generic',
      properties: {
        headers: {
          Authorization: '={{"Bearer " + $credentials.apiToken}}',
        },
      },
    });

    expect(credential.test).toEqual({
      request: {
        baseURL: 'https://api.autentique.com.br/v2/graphql',
      },
    });
  });
});
