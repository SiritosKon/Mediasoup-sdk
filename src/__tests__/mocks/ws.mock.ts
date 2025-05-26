// src/__tests__/mocks/websocket.ts
export const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  onopen: jest.fn(),
  onmessage: jest.fn(),
};
