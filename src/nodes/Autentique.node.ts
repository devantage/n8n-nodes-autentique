import { ResourceNode } from '@devantage/n8n-custom-nodes-framework';

import { resourceRegistry } from '../resources';

export class Autentique extends ResourceNode {
  public constructor() {
    super(resourceRegistry, {
      displayName: 'Autentique',
      name: 'autentique',
      icon: 'file:../icons/icon.svg',
      group: ['transform'],
      version: 1,
      description: "n8n community nodes for Autentique's API",
      defaults: {
        name: 'Autentique',
      },
      credentials: [
        {
          name: 'autentiqueApi',
          required: true,
        },
      ],
    });
  }
}
