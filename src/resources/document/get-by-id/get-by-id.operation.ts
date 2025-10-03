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

type GetByIdResponse = IDataObject & { document: IDataObject };

export class GetByIdOperation extends ResourceOperation {
  public readonly name: string = 'getById';

  public readonly displayName: string = 'Get by ID';

  public readonly description: string = 'Get a document by ID';

  public readonly properties: INodeProperties[] = [
    {
      name: 'documentId',
      displayName: 'Document ID',
      description: 'The ID of the document to retrieve',
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
    const documentId: string | undefined = this.getNodeParameter(
      'documentId',
      itemIndex,
    ) as string | undefined;

    if (!documentId || !documentId.trim().length) {
      throw new Error('Document ID is required');
    }

    const query: string = readFileSync(
      join(__dirname, 'get-by-id.gql'),
      'utf8',
    );

    const body: IDataObject = {
      query,
      variables: {
        id: documentId,
      },
    };

    const response: GetByIdResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<GetByIdResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.document,
      pairedItem: itemIndex,
    };
  }
}
