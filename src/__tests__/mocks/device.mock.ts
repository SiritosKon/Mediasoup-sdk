export const mockDevice = {
  load: jest.fn().mockResolvedValue(undefined),
  createSendTransport: jest.fn().mockResolvedValue({
    on: jest.fn(),
    produce: jest.fn().mockResolvedValue({
      id: "mock-producer-id",
      kind: "audio",
    }),
  }),
  createRecvTransport: jest.fn().mockResolvedValue({
    on: jest.fn(),
    consume: jest.fn().mockResolvedValue({
      id: "mock-consumer-id",
      kind: "audio",
    }),
  }),
};
