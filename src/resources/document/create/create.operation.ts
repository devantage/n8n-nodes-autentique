import FormData from 'form-data';
import { readFileSync } from 'fs';
import type {
  IBinaryData,
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { join } from 'path';

import type { SendRequestOptions } from '../../../utils';
import { sendRequest } from '../../../utils';
import { ResourceOperation } from '../../models';

type CreateResponse = IDataObject & { createDocument: IDataObject };

export class CreateOperation extends ResourceOperation {
  public readonly name: string = 'create';

  public readonly displayName: string = 'Create';

  public readonly description: string = 'Create a document';

  public readonly properties: INodeProperties[] = [
    {
      name: 'documentName',
      displayName: 'Document Name',
      description: 'The name of the document to be created',
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
      name: 'documentOrganizationId',
      displayName: 'Document Organization ID',
      description:
        'The ID of the organization which the created document will belong',
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
      name: 'documentFolderId',
      displayName: 'Document Folder ID',
      description:
        'The ID of the folder which the created document will belong',
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
      name: 'documentOptionalFields',
      displayName: 'Document Optional Fields (JSON)',
      description:
        'The additional optional fields JSON object for the document',
      type: 'json',
      required: false,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: JSON.stringify(
        {
          message: 'Custom message to signers',
          reminder: 'WEEKLY',
          sortable: true,
          footer: 'BOTTOM',
          refusable: true,
          qualified: true,
          scrolling_required: true,
          stop_on_rejected: true,
          new_signature_style: true,
          show_audit_page: false,
          ignore_cpf: true,
          ignore_birthdate: true,
          email_template_id: 1234,
          deadline_at: '2023-11-24T02:59:59.999Z',
          reply_to: 'email@domain.org',
          cc: [
            {
              email: 'cc@domain.org',
            },
          ],
          expiration: {
            days_before: 7,
            notify_at: '20/01/2026',
          },
          configs: {
            notification_finished: true,
            notification_signed: true,
            signature_appearance: 'ELETRONIC',
            keep_metadata: true,
            lock_user_data: true,
            pdfa: true,
          },
          locale: {
            country: 'BR',
            language: 'pt-BR',
            timezone: 'America/Sao_Paulo',
            date_format: 'DD_MM_YYYY',
          },
        },
        null,
        2,
      ),
    },
    {
      name: 'documentSigners',
      displayName: 'Document Signers (JSON Array)',
      description: 'The signers JSON array for the document',
      type: 'json',
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: JSON.stringify(
        [
          {
            name: 'John Doe',
            email: 'johndoe@domain.org',
            phone: '+5599999999999',
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
        ],
        null,
        2,
      ),
    },
    {
      name: 'documentBinaryPropertyName',
      displayName: 'Document Binary Property Name',
      description:
        'The name of the binary property which contains the document file',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: [this.resource],
          operation: [this.name],
        },
      },
      default: 'data',
    },
  ];

  public async execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData> {
    const documentName: string | undefined = this.getNodeParameter(
      'documentName',
      itemIndex,
    ) as string | undefined;

    if (!documentName) {
      throw new Error('Document Name is required');
    }

    let documentOrganizationId: string | null | undefined =
      this.getNodeParameter('documentOrganizationId', itemIndex) as
        | string
        | null
        | undefined;

    if (!documentOrganizationId || !documentOrganizationId.trim().length) {
      documentOrganizationId = null;
    }

    let documentFolderId: string | null | undefined = this.getNodeParameter(
      'documentFolderId',
      itemIndex,
    ) as string | null | undefined;

    if (!documentFolderId || !documentFolderId.trim().length) {
      documentFolderId = null;
    }

    let documentOptionalFields: string | IDataObject | undefined =
      this.getNodeParameter('documentOptionalFields', itemIndex) as
        | string
        | IDataObject
        | undefined;

    if (
      typeof documentOptionalFields === 'string' &&
      documentOptionalFields.trim().length
    ) {
      documentOptionalFields = JSON.parse(
        documentOptionalFields,
      ) as IDataObject;
    } else {
      documentOptionalFields = {};
    }

    let documentSigners: string | IDataObject | undefined =
      this.getNodeParameter('documentSigners', itemIndex) as
        | string
        | IDataObject
        | undefined;

    if (typeof documentSigners === 'string' && documentSigners.length) {
      documentSigners = JSON.parse(documentSigners) as IDataObject;
    }

    if (!documentSigners || !documentSigners.length) {
      throw new Error('Document Signers is required');
    }

    const documentBinaryPropertyName: string | undefined =
      this.getNodeParameter('documentBinaryPropertyName', itemIndex) as
        | string
        | undefined;

    if (!documentBinaryPropertyName) {
      throw new Error('Document Binary Property Name is required');
    }

    const documentBinaryData: IBinaryData = this.helpers.assertBinaryData(
      itemIndex,
      documentBinaryPropertyName,
    );

    const query: string = readFileSync(join(__dirname, 'create.gql'), 'utf8');

    const body: FormData = new FormData();

    body.append(
      'operations',
      JSON.stringify({
        query,
        variables: {
          organization_id: documentOrganizationId,
          folder_id: documentFolderId,
          document: {
            name: documentName,
            ...documentOptionalFields,
          },
          signers: documentSigners,
          file: null,
        },
      }),
    );

    body.append('map', JSON.stringify({ file: ['variables.file'] }));

    body.append('file', Buffer.from(documentBinaryData.data, 'base64'), {
      filename: documentBinaryData.fileName,
      contentType: documentBinaryData.mimeType,
    });

    const response: CreateResponse = await sendRequest.call<
      IExecuteFunctions,
      [SendRequestOptions],
      Promise<CreateResponse>
    >(this, {
      headers: body.getHeaders(),
      body,
      json: false,
    });

    return {
      json: response.createDocument,
      pairedItem: itemIndex,
    };
  }
}
