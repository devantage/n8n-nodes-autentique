import type { INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { Resources } from '../resources';
import { Autentique } from './Autentique.node';

type NodeExecuteContext = {
  getInputData: jest.Mock<INodeExecutionData[], []>;
  getNodeParameter: jest.Mock<string | undefined, [string, number?]>;
  continueOnFail: jest.Mock<boolean, []>;
  getNode: jest.Mock<{ name: string }, []>;
};

type ExecuteResult = INodeExecutionData[][];
type FailedExecutionItem = INodeExecutionData & { error: unknown };

describe('Autentique node', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the shared resources properties in the description', () => {
    const properties: INodeProperties[] = [
      {
        name: 'resource',
        displayName: 'Resource',
        type: 'options',
        default: null,
      },
    ];
    jest.spyOn(Resources, 'getProperties').mockReturnValue(properties as never);

    const node: Autentique = new Autentique();

    expect(node.description.properties).toBe(properties);
  });

  it('executes the selected resource operation for every input item', async () => {
    const execute: jest.Mock<Promise<INodeExecutionData>, [number]> = jest.fn<
      Promise<INodeExecutionData>,
      [number]
    >();
    execute.mockResolvedValue({ json: { id: '1' }, pairedItem: 0 });
    const getOperation: jest.Mock<{ execute: typeof execute }, [string]> =
      jest.fn<{ execute: typeof execute }, [string]>();
    getOperation.mockReturnValue({ execute });
    const getResource: jest.SpiedFunction<typeof Resources.getResource> = jest
      .spyOn(Resources, 'getResource')
      .mockReturnValue({ getOperation } as never);

    const context: NodeExecuteContext = {
      getInputData: jest
        .fn<INodeExecutionData[], []>()
        .mockReturnValue([{ json: {} }]),
      getNodeParameter: jest.fn<string | undefined, [string, number?]>(
        (name: string): string => (name === 'resource' ? 'document' : 'list'),
      ),
      continueOnFail: jest.fn<boolean, []>().mockReturnValue(false),
      getNode: jest
        .fn<{ name: string }, []>()
        .mockReturnValue({ name: 'Autentique' }),
    };

    const node: Autentique = new Autentique();
    const result: ExecuteResult = await node.execute.call(context as never);

    expect(getResource).toHaveBeenCalledWith('document');
    expect(getOperation).toHaveBeenCalledWith('list');
    expect(execute).toHaveBeenCalledWith(0);
    expect(result).toEqual([[{ json: { id: '1' }, pairedItem: 0 }]]);
  });

  it('throws a NodeOperationError when a required parameter is missing', async () => {
    const context: NodeExecuteContext = {
      getInputData: jest
        .fn<INodeExecutionData[], []>()
        .mockReturnValue([{ json: {} }]),
      getNodeParameter: jest
        .fn<string | undefined, [string, number?]>()
        .mockReturnValue(undefined),
      continueOnFail: jest.fn<boolean, []>().mockReturnValue(false),
      getNode: jest
        .fn<{ name: string }, []>()
        .mockReturnValue({ name: 'Autentique' }),
    };

    const node: Autentique = new Autentique();

    await expect(node.execute.call(context as never)).rejects.toBeInstanceOf(
      NodeOperationError,
    );
  });

  it('throws when the operation parameter is missing', async () => {
    const context: NodeExecuteContext = {
      getInputData: jest
        .fn<INodeExecutionData[], []>()
        .mockReturnValue([{ json: {} }]),
      getNodeParameter: jest.fn<string | undefined, [string, number?]>(
        (name: string): string | undefined =>
          name === 'resource' ? 'document' : undefined,
      ),
      continueOnFail: jest.fn<boolean, []>().mockReturnValue(false),
      getNode: jest
        .fn<{ name: string }, []>()
        .mockReturnValue({ name: 'Autentique' }),
    };

    const node: Autentique = new Autentique();

    await expect(node.execute.call(context as never)).rejects.toThrow(
      'Operation is required',
    );
  });

  it('rethrows existing NodeOperationError instances untouched', async () => {
    const existingError: NodeOperationError = new NodeOperationError(
      { name: 'Autentique' } as never,
      'already wrapped',
      { itemIndex: 0 },
    );
    const execute: jest.Mock<Promise<INodeExecutionData>, [number]> = jest.fn<
      Promise<INodeExecutionData>,
      [number]
    >();
    execute.mockRejectedValue(existingError);
    const getOperation: jest.Mock<{ execute: typeof execute }, [string]> =
      jest.fn<{ execute: typeof execute }, [string]>();
    getOperation.mockReturnValue({ execute });
    jest
      .spyOn(Resources, 'getResource')
      .mockReturnValue({ getOperation } as never);

    const context: NodeExecuteContext = {
      getInputData: jest
        .fn<INodeExecutionData[], []>()
        .mockReturnValue([{ json: {} }]),
      getNodeParameter: jest.fn<string | undefined, [string, number?]>(
        (name: string): string => (name === 'resource' ? 'document' : 'list'),
      ),
      continueOnFail: jest.fn<boolean, []>().mockReturnValue(false),
      getNode: jest
        .fn<{ name: string }, []>()
        .mockReturnValue({ name: 'Autentique' }),
    };

    const node: Autentique = new Autentique();

    await expect(node.execute.call(context as never)).rejects.toBe(
      existingError,
    );
  });

  it('returns item errors when continueOnFail is enabled', async () => {
    jest.spyOn(Resources, 'getResource').mockImplementation(() => {
      throw new Error('unsupported resource');
    });

    const context: NodeExecuteContext = {
      getInputData: jest
        .fn<INodeExecutionData[], []>()
        .mockReturnValue([{ json: {} }]),
      getNodeParameter: jest.fn<string | undefined, [string, number?]>(
        (name: string): string => (name === 'resource' ? 'missing' : 'list'),
      ),
      continueOnFail: jest.fn<boolean, []>().mockReturnValue(true),
      getNode: jest
        .fn<{ name: string }, []>()
        .mockReturnValue({ name: 'Autentique' }),
    };

    const node: Autentique = new Autentique();
    const result: ExecuteResult = await node.execute.call(context as never);
    const firstItem: FailedExecutionItem = result[0][0] as FailedExecutionItem;

    expect(firstItem.json).toEqual({});
    expect(firstItem.pairedItem).toBe(0);
    expect(firstItem.error).toBeInstanceOf(NodeOperationError);
  });
});
