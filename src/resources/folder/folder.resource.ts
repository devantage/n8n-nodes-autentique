import { Resource } from '../models';
import { CreateOperation } from './create';
import { ListOperation } from './list';

export class FolderResource extends Resource {
  public constructor() {
    super('folder', 'Folder', CreateOperation, ListOperation);
  }
}
