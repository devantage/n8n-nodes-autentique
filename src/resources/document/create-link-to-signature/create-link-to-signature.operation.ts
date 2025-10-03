import { readFileSync } from 'fs';
import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { join } from 'path';

import type { SendRequestOptions } from '../../../utils';
import { sendRequest } from '../../../utils';
import { ResourceOperation } from '../../models';

type CreateLinkToSignatureResponse = IDataObject & {
  createLinkToSignature: IDataObject;
};

export class CreateLinkToSignatureOperation extends ResourceOperation {
  public readonly name: string = 'createLinkToSignature';

  public readonly displayName: string = 'Create a link to signature';

  public readonly description: string =
    'Create a link to signature for a signer';

  public readonly properties: INodeProperties[] = [
    {
      name: 'signerId',
      displayName: 'Signer ID (public_id)',
      description: 'The ID of the signer to create a link for',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: '',
    },
  ];

  public async execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData> {
    const signerId: string | undefined = this.getNodeParameter(
      'signerId',
      itemIndex,
    ) as string | undefined;

    if (!signerId || !signerId.trim().length) {
      throw new Error('Signer ID (public_id) is required');
    }

    const query: string = readFileSync(
      join(__dirname, 'add-signer.gql'),
      'utf8',
    );

    const body: IDataObject = {
      operations: {
        query,
        variables: {
          public_id: signerId,
        },
      },
    };

    const response: CreateLinkToSignatureResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<CreateLinkToSignatureResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.createLinkToSignature,
      pairedItem: itemIndex,
    };
  }
}
