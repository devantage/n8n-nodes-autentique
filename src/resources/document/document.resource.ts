import { Resource } from '../models';
import { CreateOperation } from './create';
import { ListOperation } from './list';

export class DocumentResource extends Resource {
  public constructor() {
    super('document', 'Document', CreateOperation, ListOperation);
  }
}
