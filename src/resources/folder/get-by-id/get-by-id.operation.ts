import { ResourceOperation } from '@devantage/n8n-custom-nodes-framework';
import { readFileSync } from 'fs';
import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { join } from 'path';

import { AUTENTIQUE_GRAPHQL_PATH, autentiqueClient } from '../../../client';

type GetByIdApiResponse = IDataObject & { folder: IDataObject };

export class GetByIdOperation extends ResourceOperation {
  public readonly name: string = 'getById';

  public readonly displayName: string = 'Get by ID';

  public readonly description: string = 'Get a folder by ID';

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

    const query: string = readFileSync(
      join(__dirname, 'get-by-id.gql'),
      'utf8',
    );

    const body: IDataObject = {
      query,
      variables: {
        id: folderId,
      },
    };

    const response: GetByIdApiResponse =
      await autentiqueClient.graphql<GetByIdApiResponse>(
        this,
        AUTENTIQUE_GRAPHQL_PATH,
        body,
      );

    return {
      json: response.folder,
      pairedItem: itemIndex,
    };
  }
}
