import { Resource } from '../models/resource.class';
import { CreateOperation } from './create';
import { DeleteOperation } from './delete';
import { GetByIdOperation } from './get-by-id';
import { ListOperation } from './list';

export class FolderResource extends Resource {
  public constructor() {
    super(
      'folder',
      'Folder',
      CreateOperation,
      ListOperation,
      GetByIdOperation,
      DeleteOperation,
    );
  }
}
