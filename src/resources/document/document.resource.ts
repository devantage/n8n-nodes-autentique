import { Resource } from '../models';
import { CreateOperation } from './create';
import { DeleteOperation } from './delete';
import { GetByIdOperation } from './get-by-id';
import { ListOperation } from './list';

export class DocumentResource extends Resource {
  public constructor() {
    super(
      'document',
      'Document',
      CreateOperation,
      ListOperation,
      GetByIdOperation,
      DeleteOperation,
    );
  }
}
