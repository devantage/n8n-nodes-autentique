import { ResourceRegistry } from '@devantage/n8n-custom-nodes-framework';

import { DocumentResource } from './document';
import { FolderResource } from './folder';

export const resourceRegistry: ResourceRegistry = new ResourceRegistry(
  new DocumentResource(),
  new FolderResource(),
);
