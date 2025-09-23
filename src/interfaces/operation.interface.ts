import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';

export interface INodeOperation {
  readonly name: string;

  readonly displayName: string;

  readonly description: string;

  readonly properties: INodeProperties[];

  execute(
    this: IExecuteFunctions,
    itemIndex: number,
  ): Promise<INodeExecutionData>;
}
