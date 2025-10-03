import { Resource } from '../models';
import { CreateOperation } from './create';

export class DocumentResource extends Resource {
  public constructor() {
    super('document', 'Document', CreateOperation);
  }
}
