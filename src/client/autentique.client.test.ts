import type { ExecuteFunctionsMock } from '@devantage/n8n-custom-nodes-framework';
import { TestUtil } from '@devantage/n8n-custom-nodes-framework';

import {
  AUTENTIQUE_BASE_URL,
  AUTENTIQUE_CREDENTIAL_TYPE,
  AUTENTIQUE_GRAPHQL_PATH,
  autentiqueClient,
} from './autentique.client';

describe('autentiqueClient', () => {
  it('sends authenticated GraphQL requests to the Autentique API', async () => {
    const context: ExecuteFunctionsMock = TestUtil.createExecuteFunctionsMock();

    context.helpers.httpRequestWithAuthentication.mockResolvedValue({
      data: { documents: [] },
    });

    await expect(
      autentiqueClient.graphql(context as never, AUTENTIQUE_GRAPHQL_PATH, {
        query: 'query {}',
      }),
    ).resolves.toEqual({ documents: [] });

    expect(context.helpers.httpRequestWithAuthentication).toHaveBeenCalledWith(
      AUTENTIQUE_CREDENTIAL_TYPE,
      expect.objectContaining({
        baseURL: AUTENTIQUE_BASE_URL,
        url: AUTENTIQUE_GRAPHQL_PATH,
        method: 'POST',
        body: { query: 'query {}' },
        json: true,
      }),
    );
  });

  it('throws the GraphQL errors returned by the API', async () => {
    const context: ExecuteFunctionsMock = TestUtil.createExecuteFunctionsMock();

    context.helpers.httpRequestWithAuthentication.mockResolvedValue({
      errors: [{ message: 'invalid request' }],
    });

    await expect(
      autentiqueClient.graphql(context as never, AUTENTIQUE_GRAPHQL_PATH, {
        query: 'query {}',
      }),
    ).rejects.toThrow(
      'Error while sending request. Message: [{"message":"invalid request"}]',
    );
  });
});
