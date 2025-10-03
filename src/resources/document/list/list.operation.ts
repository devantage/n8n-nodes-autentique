import { readFileSync } from 'fs';
import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { join } from 'path';

import { sendRequest, SendRequestOptions } from '../../../utils';
import { ResourceOperation } from '../../models';

type ListResponse = IDataObject & {
  documents: {
    total: number;
    has_more_pages: boolean;
    data: IDataObject[];
  };
};

export class ListOperation extends ResourceOperation {
  public readonly name: string = 'list';

  public readonly displayName: string = 'List';

  public readonly description: string = 'List documents';

  public readonly properties: INodeProperties[] = [
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
    const limit: number | undefined = this.getNodeParameter('limit', itemIndex);

    if (!limit) {
      throw new Error('Limit is required and should be greater than 0');
    }

    const page: number = this.getNodeParameter('page', itemIndex) as number;

    if (!page) {
      throw new Error('Page is required and should be greater than 0');
    }

    const query: string = readFileSync(join(__dirname, 'list.gql'), 'utf8');

    const body: IDataObject = {
      query,
      variables: {
        limit,
        page,
      },
    };

    const response: ListResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<ListResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.documents,
      pairedItem: itemIndex,
    };
  }
}
