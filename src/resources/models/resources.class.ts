import { INodeProperties } from 'n8n-workflow';

import { DocumentResource } from '../document';
import { FolderResource } from '../folder';
import { Resource } from '.';

export class Resources {
  private static readonly _resources: Resource[] = [
    new DocumentResource(),
    new FolderResource(),
  ];

  public static getProperties(): INodeProperties[] {
    const properties: INodeProperties[] = [
      {
        name: 'resource',
        displayName: 'Resource',
        type: 'options',
        required: true,
        noDataExpression: true,
        options: [],
        default: null,
      },
    ];

    for (const curResource of Resources._resources) {
      if (properties[0].options === undefined) {
        throw new Error(``);
      }

      properties[0].options.push(curResource.getResourcePropertyOption());

      properties.push(curResource.getOperationProperty());

      properties.push(...curResource.getOperationsProperties());
    }

    return properties;
  }

  public static getResource(name: string): Resource {
    const resource: Resource | undefined = this._resources.find(
      (curResourceInstance: Resource) => curResourceInstance.name === name,
    );

    if (!resource) {
      throw new Error(`The resource '${name}' is not supported`);
    }

    return resource;
  }
}
