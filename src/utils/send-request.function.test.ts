import type { ExecuteFunctionsMock } from '../test-utils/n8n';
import { createExecuteFunctionsMock } from '../test-utils/n8n';
import { sendRequest } from './send-request.function';

describe('sendRequest', () => {
  it('sends an authenticated POST request to the Autentique GraphQL endpoint', async () => {
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({});
    const response: { data: { documents: unknown[] } } = {
      data: { documents: [] },
    };

    context.helpers.httpRequestWithAuthentication.mockResolvedValue(response);

    await expect(
      sendRequest.call(context as never, {
        body: { query: 'query {}' },
        json: true,
      }),
    ).resolves.toEqual(response.data);

    expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
      'autentiqueApi',
      {
        url: 'https://api.autentique.com.br/v2/graphql',
        method: 'POST',
        body: { query: 'query {}' },
        json: true,
      },
    );
  });

  it('throws the GraphQL errors returned by the API', async () => {
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({});

    context.helpers.httpRequestWithAuthentication.mockResolvedValue({
      errors: [{ message: 'invalid request' }],
    });

    await expect(
      sendRequest.call(context as never, {
        body: { query: 'query {}' },
        json: true,
      }),
    ).rejects.toThrow(
      'Error while sending request. Message: [{"message":"invalid request"}]',
    );
  });

  it('wraps transport failures with a consistent message', async () => {
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({});

    context.helpers.httpRequestWithAuthentication.mockRejectedValue(
      new Error('network down'),
    );

    await expect(
      sendRequest.call(context as never, {
        body: { query: 'query {}' },
        json: true,
      }),
    ).rejects.toThrow('Error while sending request. Message: network down');
  });
});
