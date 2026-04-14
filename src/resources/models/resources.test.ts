import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';

import { DocumentResource } from '../document';
import { FolderResource } from '../folder';
import { Resource } from './resource.class';
import { ResourceOperation } from './resource-operation.class';
import { Resources } from './resources.class';

class FakeOperation extends ResourceOperation {
  public readonly name: string = 'fakeOperation';
  public readonly displayName: string = 'Fake Operation';
  public readonly description: string = 'Run a fake operation';
  public readonly properties: INodeProperties[] = [
    { name: 'flag', displayName: 'Flag', type: 'string', default: '' },
  ];

  public async execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData> {
    return Promise.resolve({ json: { itemIndex }, pairedItem: itemIndex });
  }
}

class TestResource extends Resource {
  public constructor() {
    super('test', 'Test', FakeOperation);
  }
}

describe('Resource models', () => {
  it('builds the resource and operation properties', () => {
    const resource: TestResource = new TestResource();

    expect(resource.getResourcePropertyOption()).toEqual({
      name: 'Test',
      value: 'test',
    });

    expect(resource.getOperationProperty()).toEqual(
      expect.objectContaining({
        name: 'operation',
        options: [
          {
            name: 'Fake Operation',
            value: 'fakeOperation',
            description: 'Run a fake operation',
            action: 'Run a fake operation',
          },
        ],
      }),
    );

    expect(resource.getOperationsProperties()).toEqual([
      { name: 'flag', displayName: 'Flag', type: 'string', default: '' },
    ]);
    expect(resource.getOperation('fakeOperation')).toBeInstanceOf(
      FakeOperation,
    );
    expect(() => resource.getOperation('missing')).toThrow(
      "The operation 'missing' is not supported by resource 'test'",
    );
  });

  it('registers the document and folder resources', () => {
    const properties: INodeProperties[] = Resources.getProperties();
    const resourceProperty: INodeProperties = properties[0];
    const resourceOptions: INodeProperties['options'] =
      resourceProperty.options;

    expect(resourceProperty.name).toBe('resource');
    expect(resourceOptions).toEqual(
      expect.arrayContaining([
        { name: 'Document', value: 'document' },
        { name: 'Folder', value: 'folder' },
      ]),
    );

    expect(Resources.getResource('document')).toBeInstanceOf(DocumentResource);
    expect(Resources.getResource('folder')).toBeInstanceOf(FolderResource);
    expect(() => Resources.getResource('missing')).toThrow(
      "The resource 'missing' is not supported",
    );
  });

  it('recreates the resource options array when it is missing', () => {
    const testableResources: Record<string, unknown> =
      Resources as unknown as Record<string, unknown>;
    const originalCreateResourceProperty: unknown =
      testableResources['createResourceProperty'];

    testableResources['createResourceProperty'] = (): INodeProperties => ({
      name: 'resource',
      displayName: 'Resource',
      type: 'options',
      required: true,
      noDataExpression: true,
      default: null,
    });

    try {
      const properties: INodeProperties[] = Resources.getProperties();
      const resourceOptions: INodeProperties['options'] = properties[0].options;

      expect(resourceOptions).toEqual(
        expect.arrayContaining([
          { name: 'Document', value: 'document' },
          { name: 'Folder', value: 'folder' },
        ]),
      );
    } finally {
      testableResources['createResourceProperty'] =
        originalCreateResourceProperty;
    }
  });
});
