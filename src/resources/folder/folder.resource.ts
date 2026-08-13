import { Resource } from '@devantage/n8n-custom-nodes-framework';

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
