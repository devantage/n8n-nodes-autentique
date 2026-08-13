import type { IBinaryData } from 'n8n-workflow';

type NodeParameters = Record<string, unknown>;
type MockFunction<
  TArgs extends unknown[] = unknown[],
  TReturn = unknown,
> = jest.Mock<TReturn, TArgs>;

export type ExecuteFunctionsMock = {
  getNodeParameter: MockFunction<[string]>;
  helpers: {
    assertBinaryData: MockFunction<[number, string], IBinaryData>;
    getBinaryDataBuffer: MockFunction<[number, string], Promise<Buffer>>;
    httpRequestWithAuthentication: MockFunction<
      [string, unknown],
      Promise<unknown>
    >;
  };
} & Record<string, unknown>;

export function createExecuteFunctionsMock(
  parameters: NodeParameters,
  extra: Record<string, unknown> = {},
): ExecuteFunctionsMock {
  return {
    getNodeParameter: jest.fn((name: string): unknown => parameters[name]),
    helpers: {
      assertBinaryData: jest.fn() as MockFunction<
        [number, string],
        IBinaryData
      >,
      getBinaryDataBuffer: jest.fn(
        async (_itemIndex: number, _propertyName: string): Promise<Buffer> => {
          return new Promise((resolve: (value: Buffer) => void) => {
            resolve(Buffer.from('test file'));
          });
        },
      ) as MockFunction<[number, string], Promise<Buffer>>,
      httpRequestWithAuthentication: jest.fn() as MockFunction<
        [string, unknown],
        Promise<unknown>
      >,
    },
    ...extra,
  };
}

export function createBinaryData(
  overrides: Partial<IBinaryData> = {},
): IBinaryData {
  return {
    data: Buffer.from('test file').toString('base64'),
    fileName: 'document.pdf',
    mimeType: 'application/pdf',
    fileExtension: 'pdf',
    fileSize: '9 B',
    ...overrides,
  };
}
