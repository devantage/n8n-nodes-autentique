import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { resources, resourcesOperations } from '../resources';
import { getErrorMessage } from '../utils';

function buildResourcesOperationProperty(): INodeProperties[] {
  const options: INodeProperties[] = [];

  for (const [resource, operations] of Object.entries(resourcesOperations)) {
    if (!operations) continue;

    for (const operation of Object.values(operations)) {
      if (!operation) continue;

      options.push({
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: [resource],
          },
        },
        options: [
          {
            name: operation.displayName,
            value: operation.name,
            description: operation.description,
            action: operation.description,
          },
        ],
        default: operation.name,
      });

      options.push(...operation.properties);
    }
  }

  return options;
}

export class Autentique implements INodeType {
  public description: INodeTypeDescription = {
    displayName: 'Autentique',
    name: 'autentique',
    icon: 'file:../icons/icon.svg',
    group: ['transform'],
    version: 1,
    description: "n8n community nodes for Autentique's API",
    defaults: {
      name: 'Autentique',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'autentiqueApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Documents',
            value: 'documents',
          },
        ],
        default: 'documents',
      },
      ...buildResourcesOperationProperty(),
    ],
  };

  public async execute(
    this: IExecuteFunctions,
  ): Promise<INodeExecutionData[][]> {
    const items: INodeExecutionData[] = this.getInputData();

    const returnData: INodeExecutionData[] = [];

    for (let itemIndex: number = 0; itemIndex < items.length; itemIndex++) {
      try {
        const resource: string | undefined = this.getNodeParameter(
          'resource',
          itemIndex,
        );

        if (!resource) {
          throw new Error('Resource is required');
        } else if (!resources.includes(resource)) {
          throw new Error(`The resource "${resource}" is not supported`);
        }

        const operation: string | undefined = this.getNodeParameter(
          'operation',
          itemIndex,
        );

        if (!operation) {
          throw new Error('Operation is required');
        } else if (!resourcesOperations[resource]?.[operation]) {
          throw new Error(
            `The resource "${resource}" does not support the operation "${operation}"`,
          );
        }

        const result: INodeExecutionData = await resourcesOperations[resource][
          operation
        ].execute.call(this, itemIndex);

        returnData.push(result);
      } catch (error: unknown) {
        const nodeOperationError: NodeOperationError =
          error instanceof NodeOperationError
            ? error
            : new NodeOperationError(this.getNode(), getErrorMessage(error), {
                itemIndex,
              });

        if (this.continueOnFail()) {
          returnData.push({
            json: {},
            error: nodeOperationError,
            pairedItem: itemIndex,
          });
        } else {
          throw nodeOperationError;
        }
      }
    }

    return [returnData];
  }
}
