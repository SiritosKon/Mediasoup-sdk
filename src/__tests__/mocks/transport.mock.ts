export const mockTransportHandler = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getSendTransport: jest.fn().mockReturnValue({
    on: jest.fn(),
    produce: jest.fn().mockResolvedValue({
      id: "mock-producer-id",
      kind: "audio",
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
  getRecvTransport: jest.fn().mockReturnValue({
    on: jest.fn(),
    consume: jest.fn().mockResolvedValue({
      id: "mock-consumer-id",
      kind: "audio",
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
};
