import { Resource } from '../models';
import { CreateOperation } from './create';

export class FolderResource extends Resource {
  public constructor() {
    super('folder', 'Folder', CreateOperation);
  }
}
