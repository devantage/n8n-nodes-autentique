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

type CreateApiResponse = IDataObject & { createFolder: IDataObject };

export class CreateOperation extends ResourceOperation {
  public readonly name: string = 'create';

  public readonly displayName: string = 'Create';

  public readonly description: string = 'Create a folder';

  public readonly properties: INodeProperties[] = [
    {
      name: 'folderName',
      displayName: 'Folder Name',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: 'Folder',
    },
    {
      name: 'folderType',
      displayName: 'Folder Type',
      description: 'The type of folder to create',
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
  ];

  public async execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData> {
    const folderName: string | undefined = this.getNodeParameter(
      'folderName',
      itemIndex,
    ) as string | undefined;

    if (!folderName || !folderName.trim().length) {
      throw new Error('Folder Name is required');
    }

    const folderType: string | undefined = this.getNodeParameter(
      'folderType',
      itemIndex,
    ) as string | undefined;

    if (!folderType || !folderType.trim().length) {
      throw new Error('Folder Type is required');
    }

    const query: string = readFileSync(join(__dirname, 'create.gql'), 'utf8');

    const body: IDataObject = {
      operations: {
        query,
        variables: {
          folder: {
            name: folderName,
          },
          type: folderType,
        },
      },
    };

    const response: CreateApiResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<CreateApiResponse>
    >(this, {
      body,
      json: true,
    });

    return {
      json: response.createFolder,
      pairedItem: itemIndex,
    };
  }
}
