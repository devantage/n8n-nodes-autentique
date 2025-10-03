import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';

export abstract class ResourceOperation {
  protected readonly resource: string;

  public abstract readonly name: string;

  public abstract readonly displayName: string;

  public abstract readonly description: string;

  public abstract readonly properties: INodeProperties[];

  public constructor(resource: string) {
    this.resource = resource;
  }

  public abstract execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData>;
}
