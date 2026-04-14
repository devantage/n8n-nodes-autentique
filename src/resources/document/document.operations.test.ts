import { readFileSync } from 'fs';
import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

import type { ExecuteFunctionsMock } from '../../test-utils/n8n';
import {
  createBinaryData,
  createExecuteFunctionsMock,
} from '../../test-utils/n8n';
import { sendRequest } from '../../utils';
import { AddSignerOperation } from './add-signer';
import { CreateOperation } from './create';
import { CreateLinkToSignatureOperation } from './create-link-to-signature';
import { DeleteOperation } from './delete';
import { DeleteSignerOperation } from './delete-signer';
import { GetByIdOperation } from './get-by-id';
import { ListOperation } from './list';
import { ListByFolderIdOperation } from './list-by-folder-id';
import { MoveToFolderOperation } from './move-to-folder';

type SendRequestMock = jest.MockedFunction<typeof sendRequest>;
type MockFormDataShape = {
  entries: Array<{ name: string; value: unknown; options?: unknown }>;
};
type DocumentOperationCase = {
  label: string;
  operation:
    | AddSignerOperation
    | CreateLinkToSignatureOperation
    | DeleteOperation
    | DeleteSignerOperation
    | GetByIdOperation
    | ListOperation
    | ListByFolderIdOperation
    | MoveToFolderOperation;
  parameters: Record<string, unknown>;
  response: IDataObject;
  expectedJson: IDataObject;
  expectedVariables: IDataObject;
  expectedFile: string;
};
type DocumentValidationCase = {
  label: string;
  operation:
    | AddSignerOperation
    | CreateOperation
    | CreateLinkToSignatureOperation
    | DeleteOperation
    | DeleteSignerOperation
    | GetByIdOperation
    | ListOperation
    | ListByFolderIdOperation
    | MoveToFolderOperation;
  parameters: Record<string, unknown>;
  expectedMessage: string;
};

jest.mock('form-data', (): { new (): MockFormDataShape } => {
  return class MockFormData {
    public entries: Array<{ name: string; value: unknown; options?: unknown }> =
      [];

    public append(name: string, value: unknown, options?: unknown): void {
      this.entries.push({ name, value, options });
    }

    public getHeaders(): { 'content-type': string } {
      return { 'content-type': 'multipart/form-data; boundary=test' };
    }
  };
});

jest.mock('fs', (): typeof import('fs') => {
  const actual: typeof import('fs') = jest.requireActual('fs');

  return {
    ...actual,
    readFileSync: jest.fn(
      (): string => 'query body',
    ) as unknown as typeof readFileSync,
  };
});

jest.mock('../../utils', (): typeof import('../../utils') => {
  const actual: typeof import('../../utils') =
    jest.requireActual('../../utils');

  return {
    ...actual,
    sendRequest: jest.fn() as typeof sendRequest,
  };
});

describe('document operations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a document with multipart payload and binary data', async () => {
    const sendRequestMock: SendRequestMock = jest.mocked(sendRequest);
    sendRequestMock.mockResolvedValue({ createDocument: { id: 'doc-1' } });
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({
      documentName: 'Contract',
      documentOrganizationId: 42,
      documentFolderId: 'folder-1',
      documentOptionalFields: JSON.stringify({ sortable: true }),
      documentSigners: JSON.stringify([{ name: 'Jane Doe' }]),
      documentBinaryPropertyName: 'file',
    });

    context.helpers.assertBinaryData.mockReturnValue(createBinaryData());

    const operation: CreateOperation = new CreateOperation('document');
    const result: INodeExecutionData = await operation.execute.call(
      context as never,
      0,
    );
    const [requestOptions] = sendRequestMock.mock.calls[0];
    const formData: MockFormDataShape =
      requestOptions.body as MockFormDataShape;

    expect(context.helpers.assertBinaryData).toHaveBeenCalledWith(0, 'file');
    expect(readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('create.gql'),
      'utf8',
    );
    expect(requestOptions).toEqual(
      expect.objectContaining({
        json: false,
        headers: { 'content-type': 'multipart/form-data; boundary=test' },
      }),
    );
    expect(formData.entries).toHaveLength(3);
    expect(formData.entries[0]).toEqual(
      expect.objectContaining({
        name: 'operations',
        value: JSON.stringify({
          query: 'query body',
          variables: {
            organization_id: 42,
            folder_id: 'folder-1',
            document: {
              name: 'Contract',
              sortable: true,
            },
            signers: [{ name: 'Jane Doe' }],
            file: null,
          },
        }),
      }),
    );
    expect(result).toEqual({ json: { id: 'doc-1' }, pairedItem: 0 });
  });

  it('requires at least one signer when creating a document', async () => {
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({
      documentName: 'Contract',
      documentSigners: JSON.stringify([]),
      documentBinaryPropertyName: 'file',
    });

    const operation: CreateOperation = new CreateOperation('document');

    await expect(operation.execute.call(context as never, 0)).rejects.toThrow(
      'Document Signers is required',
    );
  });

  it('normalizes optional create fields when they are not provided', async () => {
    const sendRequestMock: SendRequestMock = jest.mocked(sendRequest);
    sendRequestMock.mockResolvedValue({ createDocument: { id: 'doc-2' } });
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({
      documentName: 'Contract',
      documentOrganizationId: undefined,
      documentFolderId: '   ',
      documentOptionalFields: '',
      documentSigners: [{ name: 'Jane Doe' }],
      documentBinaryPropertyName: 'file',
    });

    context.helpers.assertBinaryData.mockReturnValue(createBinaryData());

    const operation: CreateOperation = new CreateOperation('document');
    await operation.execute.call(context as never, 0);

    const [requestOptions] = sendRequestMock.mock.calls[0];
    const formData: MockFormDataShape =
      requestOptions.body as MockFormDataShape;

    expect(formData.entries[0]).toEqual(
      expect.objectContaining({
        value: JSON.stringify({
          query: 'query body',
          variables: {
            organization_id: null,
            folder_id: null,
            document: {
              name: 'Contract',
            },
            signers: [{ name: 'Jane Doe' }],
            file: null,
          },
        }),
      }),
    );
  });

  it.each<DocumentOperationCase>([
    {
      label: 'adds a signer',
      operation: new AddSignerOperation('document'),
      parameters: {
        documentId: 'doc-1',
        documentSigner: JSON.stringify({ email: 'signer@example.com' }),
      },
      response: { createSigner: { id: 'signer-1' } },
      expectedJson: { id: 'signer-1' },
      expectedVariables: {
        document_id: 'doc-1',
        signer: { email: 'signer@example.com' },
      },
      expectedFile: 'add-signer.gql',
    },
    {
      label: 'creates a link to signature',
      operation: new CreateLinkToSignatureOperation('document'),
      parameters: {
        signerId: 'signer-1',
      },
      response: { createLinkToSignature: { shortLink: 'https://a.b/c' } },
      expectedJson: { shortLink: 'https://a.b/c' },
      expectedVariables: {
        public_id: 'signer-1',
      },
      expectedFile: 'create-link-to-signature.gql',
    },
    {
      label: 'deletes a signer',
      operation: new DeleteSignerOperation('document'),
      parameters: {
        documentId: 'doc-1',
        signerId: 'signer-1',
      },
      response: { deleteSigner: true },
      expectedJson: { deleteSigner: true },
      expectedVariables: {
        document_id: 'doc-1',
        public_id: 'signer-1',
      },
      expectedFile: 'delete-signer.gql',
    },
    {
      label: 'deletes a document',
      operation: new DeleteOperation('document'),
      parameters: {
        documentId: 'doc-1',
      },
      response: { deleteDocument: true },
      expectedJson: { deleteDocument: true },
      expectedVariables: {
        id: 'doc-1',
      },
      expectedFile: 'delete.gql',
    },
    {
      label: 'gets a document by id',
      operation: new GetByIdOperation('document'),
      parameters: {
        documentId: 'doc-1',
      },
      response: { document: { id: 'doc-1' } },
      expectedJson: { id: 'doc-1' },
      expectedVariables: {
        id: 'doc-1',
      },
      expectedFile: 'get-by-id.gql',
    },
    {
      label: 'lists documents',
      operation: new ListOperation('document'),
      parameters: {
        limit: 20,
        page: 2,
      },
      response: { documents: { total: 1, has_more_pages: false, data: [] } },
      expectedJson: { total: 1, has_more_pages: false, data: [] },
      expectedVariables: {
        limit: 20,
        page: 2,
      },
      expectedFile: 'list.gql',
    },
    {
      label: 'lists documents by folder id',
      operation: new ListByFolderIdOperation('document'),
      parameters: {
        folderId: 'folder-1',
        limit: 10,
        page: 1,
      },
      response: {
        documentsByFolder: {
          total: 1,
          has_more_pages: true,
          data: [{ id: 'doc-1' }],
        },
      },
      expectedJson: { total: 1, has_more_pages: true, data: [{ id: 'doc-1' }] },
      expectedVariables: {
        folder_id: 'folder-1',
        limit: 10,
        page: 1,
      },
      expectedFile: 'list-by-folder-id.gql',
    },
    {
      label: 'moves a document to a folder',
      operation: new MoveToFolderOperation('document'),
      parameters: {
        documentId: 'doc-1',
        currentFolderId: 'folder-old',
        folderId: 'folder-new',
      },
      response: { document: { id: 'doc-1', folderId: 'folder-new' } },
      expectedJson: { id: 'doc-1', folderId: 'folder-new' },
      expectedVariables: {
        document_id: 'doc-1',
        current_folder_id: 'folder-old',
        folder_id: 'folder-new',
      },
      expectedFile: 'move-to-folder.gql',
    },
  ])(
    '$label',
    async ({
      operation,
      parameters,
      response,
      expectedJson,
      expectedVariables,
      expectedFile,
    }: DocumentOperationCase): Promise<void> => {
      const sendRequestMock: SendRequestMock = jest.mocked(sendRequest);
      sendRequestMock.mockResolvedValue(response);
      const context: ExecuteFunctionsMock =
        createExecuteFunctionsMock(parameters);

      const result: INodeExecutionData = await operation.execute.call(
        context as never,
        0,
      );

      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining(expectedFile),
        'utf8',
      );
      expect(sendRequestMock).toHaveBeenCalledWith({
        body: {
          query: 'query body',
          variables: expectedVariables,
        },
        json: true,
      });
      expect(result).toEqual({ json: expectedJson, pairedItem: 0 });
    },
  );

  it('normalizes an empty current folder id when moving a document', async () => {
    const sendRequestMock: SendRequestMock = jest
      .mocked(sendRequest)
      .mockResolvedValue({ document: { id: 'doc-1' } });
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({
      documentId: 'doc-1',
      currentFolderId: '   ',
      folderId: 'folder-1',
    });

    const operation: MoveToFolderOperation = new MoveToFolderOperation(
      'document',
    );
    await operation.execute.call(context as never, 0);

    expect(sendRequestMock).toHaveBeenCalledWith({
      body: {
        query: 'query body',
        variables: {
          document_id: 'doc-1',
          current_folder_id: null,
          folder_id: 'folder-1',
        },
      },
      json: true,
    });
  });

  it.each<DocumentValidationCase>([
    {
      label: 'requires a document id when adding a signer',
      operation: new AddSignerOperation('document'),
      parameters: {
        documentId: '   ',
        documentSigner: JSON.stringify({ email: 'signer@example.com' }),
      },
      expectedMessage: 'Document ID is required',
    },
    {
      label: 'requires signer payload when adding a signer',
      operation: new AddSignerOperation('document'),
      parameters: {
        documentId: 'doc-1',
        documentSigner: undefined,
      },
      expectedMessage: 'Document Signer (JSON) is required',
    },
    {
      label: 'requires document name when creating a document',
      operation: new CreateOperation('document'),
      parameters: {
        documentName: undefined,
      },
      expectedMessage: 'Document Name is required',
    },
    {
      label: 'requires the binary property name when creating a document',
      operation: new CreateOperation('document'),
      parameters: {
        documentName: 'Contract',
        documentSigners: JSON.stringify([{ name: 'Jane Doe' }]),
        documentBinaryPropertyName: undefined,
      },
      expectedMessage: 'Document Binary Property Name is required',
    },
    {
      label: 'requires signer id to create a signature link',
      operation: new CreateLinkToSignatureOperation('document'),
      parameters: {
        signerId: '   ',
      },
      expectedMessage: 'Signer ID (public_id) is required',
    },
    {
      label: 'requires document id on delete',
      operation: new DeleteOperation('document'),
      parameters: {
        documentId: '',
      },
      expectedMessage: 'Document ID is required',
    },
    {
      label: 'requires document id on delete signer',
      operation: new DeleteSignerOperation('document'),
      parameters: {
        documentId: '   ',
        signerId: 'signer-1',
      },
      expectedMessage: 'Document ID is required',
    },
    {
      label: 'requires signer id on delete signer',
      operation: new DeleteSignerOperation('document'),
      parameters: {
        documentId: 'doc-1',
        signerId: '   ',
      },
      expectedMessage: 'Signer ID (public_id) is required',
    },
    {
      label: 'requires document id on get by id',
      operation: new GetByIdOperation('document'),
      parameters: {
        documentId: '   ',
      },
      expectedMessage: 'Document ID is required',
    },
    {
      label: 'requires a positive limit on document list',
      operation: new ListOperation('document'),
      parameters: {
        limit: 0,
        page: 1,
      },
      expectedMessage: 'Limit is required and must be greater than 0',
    },
    {
      label: 'requires a positive page on document list',
      operation: new ListOperation('document'),
      parameters: {
        limit: 10,
        page: 0,
      },
      expectedMessage: 'Page is required and must be greater than 0',
    },
    {
      label: 'requires folder id on document list by folder',
      operation: new ListByFolderIdOperation('document'),
      parameters: {
        folderId: undefined,
        limit: 10,
        page: 1,
      },
      expectedMessage: 'Folder ID is required',
    },
    {
      label: 'requires a positive limit on document list by folder',
      operation: new ListByFolderIdOperation('document'),
      parameters: {
        folderId: 'folder-1',
        limit: 0,
        page: 1,
      },
      expectedMessage: 'Limit is required and must be greater than 0',
    },
    {
      label: 'requires a positive page on document list by folder',
      operation: new ListByFolderIdOperation('document'),
      parameters: {
        folderId: 'folder-1',
        limit: 10,
        page: 0,
      },
      expectedMessage: 'Page is required and must be greater than 0',
    },
    {
      label: 'requires document id on move to folder',
      operation: new MoveToFolderOperation('document'),
      parameters: {
        documentId: '   ',
        currentFolderId: 'folder-old',
        folderId: 'folder-new',
      },
      expectedMessage: 'Document ID is required',
    },
    {
      label: 'requires destination folder id on move to folder',
      operation: new MoveToFolderOperation('document'),
      parameters: {
        documentId: 'doc-1',
        currentFolderId: 'folder-old',
        folderId: '   ',
      },
      expectedMessage: 'Folder ID is required',
    },
  ])(
    '$label',
    async ({
      operation,
      parameters,
      expectedMessage,
    }: DocumentValidationCase): Promise<void> => {
      const context: ExecuteFunctionsMock =
        createExecuteFunctionsMock(parameters);

      await expect(operation.execute.call(context as never, 0)).rejects.toThrow(
        expectedMessage,
      );
    },
  );
});
