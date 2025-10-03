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

type ListApiResponse = IDataObject & {
  folders: {
    total: number;
    data: IDataObject[];
  };
};

export class ListOperation extends ResourceOperation {
  public readonly name: string = 'list';

  public readonly displayName: string = 'List';

  public readonly description: string = 'List folders';

  public readonly properties: INodeProperties[] = [
    {
      name: 'folderType',
      displayName: 'Folder Type',
      description: 'The type of folders to retrieve',
      type: 'options',
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      options: [
        { name: 'Default', value: 'DEFAULT', description: "User's folders" },
        { name: 'Group', value: 'GROUP', description: "User's Group folders" },
        {
          name: 'Organization',
          value: 'ORGANIZATION',
          description: "User's Organization folders",
        },
      ],
      default: 'DEFAULT',
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
    const folderType: string | undefined = this.getNodeParameter(
      'folderType',
      itemIndex,
    ) as string | undefined;

    if (!folderType || !folderType.trim().length) {
      throw new Error('Folder Type is required');
    }

    const limit: number = this.getNodeParameter('limit', itemIndex);

    if (!limit) {
      throw new Error('Limit is required and must be greater than 0');
    }

    const page: number = this.getNodeParameter('page', itemIndex) as number;

    if (!page) {
      throw new Error('Page is required and must be greater than 0');
    }

    const query: string = readFileSync(join(__dirname, 'list.gql'), 'utf8');

    const body: IDataObject = {
      query,
      variables: {
        type: folderType,
        limit,
        page,
      },
    };

    const response: ListApiResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<ListApiResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.folders,
      pairedItem: itemIndex,
    };
  }
}
