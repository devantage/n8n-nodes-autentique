import { HttpClient } from '@devantage/n8n-custom-nodes-framework';

export const AUTENTIQUE_BASE_URL: string = 'https://api.autentique.com.br/v2';

export const AUTENTIQUE_CREDENTIAL_TYPE: string = 'autentiqueApi';

export const AUTENTIQUE_GRAPHQL_PATH: string = '/graphql';

export const autentiqueClient: HttpClient = new HttpClient({
  baseURL: AUTENTIQUE_BASE_URL,
  credentialType: AUTENTIQUE_CREDENTIAL_TYPE,
});
