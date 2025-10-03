import { Resource } from '../models';
import { AddSignerOperation } from './add-signer';
import { CreateOperation } from './create';
import { DeleteOperation } from './delete';
import { DeleteSignerOperation } from './delete-signer';
import { GetByIdOperation } from './get-by-id';
import { ListOperation } from './list';
import { ListByFolderIdOperation } from './list-by-folder-id';

export class DocumentResource extends Resource {
  public constructor() {
    super(
      'document',
      'Document',
      CreateOperation,
      ListOperation,
      GetByIdOperation,
      DeleteOperation,
      ListByFolderIdOperation,
      AddSignerOperation,
      DeleteSignerOperation,
    );
  }
}
