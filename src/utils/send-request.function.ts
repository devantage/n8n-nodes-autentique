import FormData from 'form-data';
import type {
  IAllExecuteFunctions,
  IDataObject,
  IHttpRequestOptions,
} from 'n8n-workflow';

import { getErrorMessage } from './get-error-message.function';

export type ResponseOrError<
  D extends IDataObject,
  E extends IDataObject = IDataObject,
> = { data: D; errors?: never } | { data?: never; errors: E[] };

export type SendRequestOptions = Omit<IHttpRequestOptions, 'url'> & {
  body: IDataObject | FormData;
  json: boolean;
};

export async function sendRequest<D extends IDataObject = IDataObject>(
  this: IAllExecuteFunctions,
  options: SendRequestOptions,
): Promise<D> {
  try {
    const url: string = 'https://api.autentique.com.br/v2/graphql';

    const credentialsType: string = 'autentiqueApi';

    const response: ResponseOrError<D> =
      await this.helpers.httpRequestWithAuthentication.call<
        IAllExecuteFunctions,
        [string, IHttpRequestOptions],
        Promise<ResponseOrError<D>>
      >(this, credentialsType, {
        url,
        method: 'POST',
        ...options,
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
