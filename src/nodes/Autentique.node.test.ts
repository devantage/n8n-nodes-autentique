import { TestUtil } from '@devantage/n8n-custom-nodes-framework';
import type { INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { resourceRegistry } from '../resources';
import { Autentique } from './Autentique.node';

describe('Autentique node', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('describes the node with the Autentique credentials', () => {
    const node: Autentique = new Autentique();

    expect(node.description).toEqual(
      expect.objectContaining({
        name: 'autentique',
        displayName: 'Autentique',
        version: 1,
        credentials: [{ name: 'autentiqueApi', required: true }],
      }),
    );
  });

  it('exposes the registered resources in its properties', () => {
    const node: Autentique = new Autentique();
    const resourceProperty: INodeProperties = node.description.properties[0];

    expect(resourceProperty.name).toBe('resource');
    expect(resourceProperty.options).toEqual(
      expect.arrayContaining([
        { name: 'Document', value: 'document' },
        { name: 'Folder', value: 'folder' },
      ]),
    );
  });

  it('routes the execution to the selected resource operation', async () => {
    const execute: jest.Mock<Promise<INodeExecutionData>, [number]> = jest
      .fn<Promise<INodeExecutionData>, [number]>()
      .mockResolvedValue({ json: { id: '1' }, pairedItem: 0 });
    const getOperation: jest.Mock<{ execute: typeof execute }, [string]> = jest
      .fn<{ execute: typeof execute }, [string]>()
      .mockReturnValue({ execute });

    const getResource: jest.SpiedFunction<typeof resourceRegistry.getResource> =
      jest
        .spyOn(resourceRegistry, 'getResource')
        .mockReturnValue({ getOperation } as never);

    const context: ReturnType<typeof TestUtil.createExecuteFunctionsMock> =
      TestUtil.createExecuteFunctionsMock({
        resource: 'document',
        operation: 'list',
      });

    const node: Autentique = new Autentique();
    const result: INodeExecutionData[][] = await TestUtil.executeNode(
      node,
      context as never,
    );

    expect(getResource).toHaveBeenCalledWith('document');
    expect(getOperation).toHaveBeenCalledWith('list');
    expect(execute).toHaveBeenCalledWith(0);
    expect(result).toEqual([[{ json: { id: '1' }, pairedItem: 0 }]]);
  });
});
