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

type AddSignerResponse = IDataObject & { createSigner: IDataObject };

export class AddSignerOperation extends ResourceOperation {
  public readonly name: string = 'addSigner';

  public readonly displayName: string = 'Add a signer';

  public readonly description: string = 'Add a signer to a document';

  public readonly properties: INodeProperties[] = [
    {
      name: 'documentId',
      displayName: 'Document ID',
      description: 'The ID of the document to add the signer to',
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
    {
      name: 'documentSigner',
      displayName: 'Document Signer (JSON)',
      description: 'The signer JSON object to be added to the document',
      type: 'json',
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: JSON.stringify(
        {
          name: 'John Doe',
          email: 'johndoe@domain.org',
          phone: '+5511999999999',
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
        null,
        2,
      ),
    },
  ];

  public async execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData> {
    const documentId: string | undefined = this.getNodeParameter(
      'documentId',
      itemIndex,
    ) as string | undefined;

    if (!documentId || !documentId.trim().length) {
      throw new Error('Document ID is required');
    }

    let documentSigner: string | IDataObject | undefined =
      this.getNodeParameter('documentSigner', itemIndex) as
        | string
        | IDataObject
        | undefined;

    if (!documentSigner) {
      throw new Error('Document Signer (JSON) is required');
    }

    if (typeof documentSigner === 'string' && documentSigner.trim().length) {
      documentSigner = JSON.parse(documentSigner) as IDataObject;
    }

    const query: string = readFileSync(
      join(__dirname, 'add-signer.gql'),
      'utf8',
    );

    const body: IDataObject = {
      operations: {
        query,
        variables: {
          document_id: documentId,
          signer: documentSigner,
        },
      },
    };

    const response: AddSignerResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<AddSignerResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.createSigner,
      pairedItem: itemIndex,
    };
  }
}
