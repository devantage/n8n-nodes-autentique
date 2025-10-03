import { ResourceOperation } from './resource-operation.class';

export interface ResourceOperationConstructor {
  new (resource: string): ResourceOperation;
}
