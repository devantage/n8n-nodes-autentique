import FormData from 'form-data';
import type {
  IAllExecuteFunctions,
  IBinaryData,
  JsonObject,
} from 'n8n-workflow';

import type { ResumedHttpRequestOptions } from './send-request.function';
import { sendRequest } from './send-request.function';

export type ExtendedJsonValue =
  | string
  | number
  | boolean
  | null
  | IBinaryData
  | ExtendedJsonObject
  | ExtendedJsonValue[];

export type ExtendedJsonObject = {
  [key: string]: ExtendedJsonValue;
};

function buildFormData(body: ExtendedJsonObject): FormData {
  const formData: FormData = new FormData();

  for (const [key, value] of Object.entries(body)) {
    if ((value as IBinaryData).data) {
      formData.append(key, Buffer.from((value as IBinaryData).data, 'base64'), {
        filename: (value as IBinaryData).fileName,
        contentType: (value as IBinaryData).mimeType,
      });
    }

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
    }
  }

  return formData;
}

export async function sendFormDataRequest<D extends JsonObject>(
  this: IAllExecuteFunctions,
  body: ExtendedJsonObject,
): Promise<D> {
  const formData: FormData = buildFormData(body);

  const response: D = await sendRequest.call<
    IAllExecuteFunctions,
    [ResumedHttpRequestOptions],
    Promise<D>
  >(this, {
    headers: formData.getHeaders(),
    body: formData,
    json: false,
  });

  return response;
}
