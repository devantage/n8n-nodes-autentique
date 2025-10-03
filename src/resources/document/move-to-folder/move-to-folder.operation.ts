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

type MoveToFolderResponse = IDataObject & { document: IDataObject };

export class MoveToFolderOperation extends ResourceOperation {
  public readonly name: string = 'moveToFolder';

  public readonly displayName: string = 'Move to a folder';

  public readonly description: string = 'Move a document to a folder';

  public readonly properties: INodeProperties[] = [
    {
      name: 'documentId',
      displayName: 'ID',
      description: 'The ID of the document to move',
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
      name: 'currentFolderId',
      displayName: 'Current Folder ID',
      description:
        'The ID of the current folder the document is in. Is required if the document is currently in a folder',
      type: 'string',
      required: false,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: '',
    },
    {
      name: 'folderId',
      displayName: 'Folder ID',
      description: 'The ID of the folder to move the document to',
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

    let currentFolderId: string | null | undefined = this.getNodeParameter(
      'currentFolderId',
      itemIndex,
    ) as string | null | undefined;

    if (!currentFolderId || !currentFolderId.trim().length) {
      currentFolderId = null;
    }

    const folderId: string | undefined = this.getNodeParameter(
      'folderId',
      itemIndex,
    ) as string | undefined;

    if (!folderId || !folderId.trim().length) {
      throw new Error('Folder ID is required');
    }

    const query: string = readFileSync(
      join(__dirname, 'move-to-folder.gql'),
      'utf8',
    );

    const body: IDataObject = {
      query,
      variables: {
        document_id: documentId,
        current_folder_id: currentFolderId,
        folder_id: folderId,
      },
    };

    const response: MoveToFolderResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<MoveToFolderResponse>
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
