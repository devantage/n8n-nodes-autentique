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

type DeleteSignerResponse = { deleteSigner: boolean };

export class DeleteSignerOperation extends ResourceOperation {
  public readonly name: string = 'deleteSigner';

  public readonly displayName: string = 'Delete a signer';

  public readonly description: string = 'Delete a signer from a document';

  public readonly properties: INodeProperties[] = [
    {
      name: 'documentId',
      displayName: 'Document ID',
      description: 'The ID of the document to delete the signer from',
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
      name: 'signerId',
      displayName: 'Signer ID (public_id)',
      description: 'The ID of the signer to delete from the document',
      type: 'json',
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

    const signerId: string | undefined = this.getNodeParameter(
      'signerId',
      itemIndex,
    ) as string | undefined;

    if (!signerId || !signerId.trim().length) {
      throw new Error('Signer ID (public_id) is required');
    }

    const query: string = readFileSync(
      join(__dirname, 'delete-signer.gql'),
      'utf8',
    );

    const body: IDataObject = {
      query,
      variables: {
        document_id: documentId,
        public_id: signerId,
      },
    };

    const response: DeleteSignerResponse =
      await autentiqueClient.graphql<DeleteSignerResponse>(
        this,
        AUTENTIQUE_GRAPHQL_PATH,
        body,
      );

    return {
      json: response,
      pairedItem: itemIndex,
    };
  }
}
