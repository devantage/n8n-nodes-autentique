import { INodeOperation } from '../../interfaces';
import { CreateOperation } from './create';

export const resource: string = 'documents';

const createOperation: CreateOperation = new CreateOperation();

export const operations: Record<string, INodeOperation> = {
  [createOperation.name]: createOperation,
};
