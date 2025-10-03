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

type DeleteResponse = { deleteFolder: boolean };

export class DeleteOperation extends ResourceOperation {
  public readonly name: string = 'delete';

  public readonly displayName: string = 'Delete';

  public readonly description: string = 'Delete a Folder';

  public readonly properties: INodeProperties[] = [
    {
      name: 'folderId',
      displayName: 'Folder ID',
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
    const folderId: string | undefined = this.getNodeParameter(
      'folderId',
      itemIndex,
    ) as string | undefined;

    if (!folderId || !folderId.length) {
      throw new Error('Folder ID is required');
    }

    const query: string = readFileSync(join(__dirname, 'delete.gql'), 'utf8');

    const body: IDataObject = {
      operations: {
        query,
        variables: {
          id: folderId,
        },
      },
    };

    const response: DeleteResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<DeleteResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response,
      pairedItem: itemIndex,
    };
  }
}
