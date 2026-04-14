import { readFileSync } from 'fs';
import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

import type { ExecuteFunctionsMock } from '../../test-utils/n8n';
import { createExecuteFunctionsMock } from '../../test-utils/n8n';
import { sendRequest } from '../../utils';
import { CreateOperation } from './create';
import { DeleteOperation } from './delete';
import { GetByIdOperation } from './get-by-id';
import { ListOperation } from './list';

type SendRequestMock = jest.MockedFunction<typeof sendRequest>;
type FolderOperationCase = {
  label: string;
  operation:
    | CreateOperation
    | DeleteOperation
    | GetByIdOperation
    | ListOperation;
  parameters: Record<string, unknown>;
  response: IDataObject;
  expectedJson: IDataObject;
  expectedVariables: IDataObject;
  expectedFile: string;
};
type FolderValidationCase = {
  label: string;
  operation:
    | CreateOperation
    | DeleteOperation
    | GetByIdOperation
    | ListOperation;
  parameters: Record<string, unknown>;
  expectedMessage: string;
};

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

describe('folder operations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each<FolderOperationCase>([
    {
      label: 'creates a folder',
      operation: new CreateOperation('folder'),
      parameters: {
        folderName: 'Contracts',
        folderType: 'DEFAULT',
      },
      response: { createFolder: { id: 'folder-1' } },
      expectedJson: { id: 'folder-1' },
      expectedVariables: {
        folder: { name: 'Contracts' },
        type: 'DEFAULT',
      },
      expectedFile: 'create.gql',
    },
    {
      label: 'deletes a folder',
      operation: new DeleteOperation('folder'),
      parameters: {
        folderId: 'folder-1',
      },
      response: { deleteFolder: true },
      expectedJson: { deleteFolder: true },
      expectedVariables: {
        id: 'folder-1',
      },
      expectedFile: 'delete.gql',
    },
    {
      label: 'gets a folder by id',
      operation: new GetByIdOperation('folder'),
      parameters: {
        folderId: 'folder-1',
      },
      response: { folder: { id: 'folder-1' } },
      expectedJson: { id: 'folder-1' },
      expectedVariables: {
        id: 'folder-1',
      },
      expectedFile: 'get-by-id.gql',
    },
    {
      label: 'lists folders',
      operation: new ListOperation('folder'),
      parameters: {
        folderType: 'ORGANIZATION',
        limit: 15,
        page: 3,
      },
      response: { folders: { total: 2, data: [{ id: 'folder-1' }] } },
      expectedJson: { total: 2, data: [{ id: 'folder-1' }] },
      expectedVariables: {
        type: 'ORGANIZATION',
        limit: 15,
        page: 3,
      },
      expectedFile: 'list.gql',
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
    }: FolderOperationCase): Promise<void> => {
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

  it('validates required folder inputs', async () => {
    const operation: CreateOperation = new CreateOperation('folder');
    const context: ExecuteFunctionsMock = createExecuteFunctionsMock({
      folderName: '   ',
      folderType: 'DEFAULT',
    });

    await expect(operation.execute.call(context as never, 0)).rejects.toThrow(
      'Folder Name is required',
    );
  });

  it.each<FolderValidationCase>([
    {
      label: 'requires a folder type on create',
      operation: new CreateOperation('folder'),
      parameters: {
        folderName: 'Contracts',
        folderType: '   ',
      },
      expectedMessage: 'Folder Type is required',
    },
    {
      label: 'requires a folder id on delete',
      operation: new DeleteOperation('folder'),
      parameters: {
        folderId: '',
      },
      expectedMessage: 'Folder ID is required',
    },
    {
      label: 'requires a folder id on get by id',
      operation: new GetByIdOperation('folder'),
      parameters: {
        folderId: '',
      },
      expectedMessage: 'Folder ID is required',
    },
    {
      label: 'requires a folder type on list',
      operation: new ListOperation('folder'),
      parameters: {
        folderType: '   ',
        limit: 10,
        page: 1,
      },
      expectedMessage: 'Folder Type is required',
    },
    {
      label: 'requires a positive limit on list',
      operation: new ListOperation('folder'),
      parameters: {
        folderType: 'DEFAULT',
        limit: 0,
        page: 1,
      },
      expectedMessage: 'Limit is required and must be greater than 0',
    },
    {
      label: 'requires a positive page on list',
      operation: new ListOperation('folder'),
      parameters: {
        folderType: 'DEFAULT',
        limit: 10,
        page: 0,
      },
      expectedMessage: 'Page is required and must be greater than 0',
    },
  ])(
    '$label',
    async ({
      operation,
      parameters,
      expectedMessage,
    }: FolderValidationCase): Promise<void> => {
      const context: ExecuteFunctionsMock =
        createExecuteFunctionsMock(parameters);

      await expect(operation.execute.call(context as never, 0)).rejects.toThrow(
        expectedMessage,
      );
    },
  );
});
