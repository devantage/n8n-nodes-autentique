import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { ResourceOperation } from './resource-operation.class';
import { ResourceOperationConstructor } from './resource-operation-constructor.interface';

export abstract class Resource {
  public readonly name: string;

  public readonly displayName: string;

  private readonly _operations: ResourceOperation[];

  public constructor(
    name: string,
    displayName: string,
    ...operationsConstructors: ResourceOperationConstructor[]
  ) {
    this.name = name;

    this.displayName = displayName;

    this._operations = operationsConstructors.map(
      (
        curOperationConstructor: ResourceOperationConstructor,
      ): ResourceOperation => new curOperationConstructor(this.name),
    );
  }

  public getResourcePropertyOption(): INodePropertyOptions {
    return {
      name: this.displayName,
      value: this.name,
    };
  }

  public getOperationProperty(): INodeProperties {
    return {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      required: true,
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: [this.name],
        },
      },
      options: this._getOperationPropertyOptions(),
      default: null,
    };
  }

  private _getOperationPropertyOptions(): INodePropertyOptions[] {
    return this._operations.map(
      (curOperation: ResourceOperation): INodePropertyOptions => ({
        name: curOperation.displayName,
        value: curOperation.name,
        description: curOperation.description,
        action: curOperation.description,
      }),
    );
  }

  public getOperationsProperties(): INodeProperties[] {
    return this._operations.reduce(
      (
        operationsProperties: INodeProperties[],
        curOperation: ResourceOperation,
      ) => {
        operationsProperties.push(...curOperation.properties);

        return operationsProperties;
      },
      [],
    );
  }

  public getOperation(name: string): ResourceOperation {
    const operation: ResourceOperation | undefined = this._operations.find(
      (curResourceOperation: ResourceOperation) =>
        curResourceOperation.name === name,
    );

    if (!operation) {
      throw new Error(
        `The operation '${name}' is not supported by resource '${this.name}'`,
      );
    }

    return operation;
  }
}
