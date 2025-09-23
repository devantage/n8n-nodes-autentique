import type {
  IAllExecuteFunctions,
  IHttpRequestOptions,
  JsonObject,
} from 'n8n-workflow';

import { getErrorMessage } from './get-error-message.function';

export type ApiResponseOrError<D extends JsonObject> =
  | { data: D; errors?: never }
  | { data?: never; errors: JsonObject[] };

export type ResumedHttpRequestOptions = Omit<IHttpRequestOptions, 'url'>;

export async function sendRequest<D extends JsonObject>(
  this: IAllExecuteFunctions,
  requestOptions: ResumedHttpRequestOptions,
): Promise<D> {
  try {
    const url: string = 'https://api.autentique.com.br/v2/graphql';

    const credentialsType: string = 'autentiqueApi';

    const response: ApiResponseOrError<D> =
      await this.helpers.httpRequestWithAuthentication.call<
        IAllExecuteFunctions,
        [string, IHttpRequestOptions],
        Promise<ApiResponseOrError<D>>
      >(this, credentialsType, {
        url,
        method: 'POST',
        ...requestOptions,
      });

    if (response.errors) {
      throw new Error(getErrorMessage(response.errors));
    }

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      `Error while sending request. Message: ${getErrorMessage(error)}`,
    );
  }
}
