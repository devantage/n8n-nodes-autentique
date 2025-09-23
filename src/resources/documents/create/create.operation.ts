import { readFileSync } from 'fs';
import type {
  IBinaryData,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  JsonObject,
} from 'n8n-workflow';
import { join } from 'path';

import { INodeOperation } from '../../../interfaces';
import type { ExtendedJsonObject } from '../../../utils';
import { sendFormDataRequest } from '../../../utils';

type CreateApiResponse = JsonObject & { createDocument: JsonObject };

export class CreateOperation implements INodeOperation {
  public readonly name: string = 'create';

  public readonly displayName: string = 'Create';

  public readonly description: string = 'Create a document';

  public readonly properties: INodeProperties[] = [
    {
      name: 'name',
      displayName: 'Document Name',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: ['documents'],
          operation: ['create'],
        },
      },
      default: 'Document',
    },
    {
      name: 'optionalFields',
      displayName: 'Document Optional Fields (JSON)',
      type: 'json',
      required: false,
      displayOptions: {
        show: {
          resource: ['documents'],
          operation: ['create'],
        },
      },
      default: JSON.stringify({}, null, 2),
    },
    {
      name: 'signers',
      displayName: 'Document Signers (JSON Array)',
      type: 'json',
      required: true,
      displayOptions: {
        show: {
          resource: ['documents'],
          operation: ['create'],
        },
      },
      default: JSON.stringify(
        [
          {
            email: 'johndoe@domain.org',
            action: 'SIGN',
          },
          {
            name: 'John Doe',
            action: 'SIGN',
          },
          {
            phone: '+5599999999999',
            delivery_method: 'DELIVERY_METHOD_WHATSAPP',
            action: 'SIGN',
          },
          {
            phone: '+5599999999999',
            delivery_method: 'DELIVERY_METHOD_SMS',
            action: 'SIGN',
          },
          {
            name: 'John Doe',
            phone: '+5599999999999',
            delivery_method: 'DELIVERY_METHOD_LINK',
            action: 'SIGN',
          },
          {
            name: 'Maria João',
            email: 'johndoe@domain.org',
            delivery_method: 'DELIVERY_METHOD_LINK',
            action: 'SIGN',
            positions: [
              {
                x: 5,
                y: 90,
                z: 1,
              },
            ],
          },
        ],
        null,
        2,
      ),
    },
    {
      name: 'binaryPropertyName',
      displayName: 'Binary Property Name',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: ['documents'],
          operation: ['create'],
        },
      },
      default: 'data',
    },
  ];

  public async execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData> {
    const name: string = this.getNodeParameter('name', itemIndex) as string;

    let optionalFields: string | JsonObject = this.getNodeParameter(
      'optionalFields',
      itemIndex,
    ) as string | JsonObject;

    if (typeof optionalFields === 'string') {
      optionalFields = JSON.parse(optionalFields) as JsonObject;
    }

    let signers: string | JsonObject = this.getNodeParameter(
      'signers',
      itemIndex,
    ) as string | JsonObject;

    if (typeof signers === 'string') {
      signers = JSON.parse(signers) as JsonObject;
    }

    const binaryPropertyName: string = this.getNodeParameter(
      'binaryPropertyName',
      itemIndex,
    );

    const binaryData: IBinaryData = this.helpers.assertBinaryData(
      itemIndex,
      binaryPropertyName,
    );

    const query: string = readFileSync(join(__dirname, 'create.gql'), 'utf8');

    const body: ExtendedJsonObject = {
      operations: {
        query,
        variables: {
          document: {
            name,
            ...optionalFields,
          },
          signers,
          file: null,
        },
      },
      map: { file: ['variables.file'] },
      file: binaryData,
    };

    const response: CreateApiResponse = await sendFormDataRequest.call<
      IExecuteFunctions,
      [ExtendedJsonObject],
      Promise<CreateApiResponse>
    >(this, body);

    return {
      json: response.createDocument,
      pairedItem: itemIndex,
    };
  }
}
