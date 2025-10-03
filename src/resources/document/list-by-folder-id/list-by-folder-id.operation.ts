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

type ListByFolderIdResponse = IDataObject & {
  documentsByFolder: {
    total: number;
    has_more_pages: boolean;
    data: IDataObject[];
  };
};

export class ListByFolderIdOperation extends ResourceOperation {
  public readonly name: string = 'listByFolderId';

  public readonly displayName: string = 'List by folder ID';

  public readonly description: string = 'List documents by folder ID';

  public readonly properties: INodeProperties[] = [
    {
      name: 'folderId',
      displayName: 'Folder ID',
      description: 'The ID of the folder to list documents from',
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
      name: 'limit',
      displayName: 'Limit',
      description: 'The limit of documents to retrieve per page',
      type: 'number',
      typeOptions: {
        minValue: 1,
        maxValue: 60,
      },
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: 20,
    },
    {
      name: 'page',
      displayName: 'page',
      description: 'The page of documents to retrieve',
      type: 'number',
      typeOptions: {
        minValue: 1,
      },
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: 1,
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

    if (folderId == undefined) {
      throw new Error('Folder ID is required');
    }

    const limit: number = this.getNodeParameter('limit', itemIndex);

    if (!limit) {
      throw new Error('Limit is required and must be greater than 0');
    }

    const page: number = this.getNodeParameter('page', itemIndex) as number;

    if (!page) {
      throw new Error('Page is required and must be greater than 0');
    }

    const query: string = readFileSync(
      join(__dirname, 'list-by-folder-id.gql'),
      'utf8',
    );

    const body: IDataObject = {
      query,
      variables: {
        folder_id: folderId,
        limit,
        page,
      },
    };

    const response: ListByFolderIdResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<ListByFolderIdResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.documentsByFolder,
      pairedItem: itemIndex,
    };
  }
}
