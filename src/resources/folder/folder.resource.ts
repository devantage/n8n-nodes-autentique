import { Resource } from '../models';
import { CreateOperation } from './create';
import { GetByIdOperation } from './get-by-id';
import { ListOperation } from './list';

export class FolderResource extends Resource {
  public constructor() {
    super('folder', 'Folder', CreateOperation, ListOperation, GetByIdOperation);
  }
}
