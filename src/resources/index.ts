import { INodeOperation } from '../interfaces';
import {
  operations as documentsOperations,
  resource as documentsResource,
} from './documents';

export const resources: string[] = [documentsResource];

export const resourcesOperations: Record<
  string,
  Record<string, INodeOperation | undefined> | undefined
> = {
  documents: documentsOperations,
};
