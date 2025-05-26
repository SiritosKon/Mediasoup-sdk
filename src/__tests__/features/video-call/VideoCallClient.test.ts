import { VideoCallClient } from "../../../features/video-call/model/VideoCallClient";
import { Call } from "../../../entities/call/model/Call";

// Мокаем глобальный WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  onopen: jest.fn(),
  onmessage: jest.fn(),
};
(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe("VideoCallClient", () => {
  const mockSend = jest.fn();
  let client: VideoCallClient;

  beforeEach(() => {
    client = new VideoCallClient("ws://test-server");
    mockSend.mockClear();
  });

  describe("Connection Management", () => {
    it("should emit connected event", () => {
      const connectedSpy = jest.fn();
      client.on("connected", connectedSpy);

      mockWebSocket.onopen();
      expect(connectedSpy).toHaveBeenCalled();
    });

    it("should process queue after connection", async () => {
      const call = client.createCall();
      const joinSpy = jest.fn();
      client.on("joined", joinSpy);

      // Запускаем операцию и эмулируем подключение
      const joinPromise = client.joinCall(call.id, "user1");
      mockWebSocket.onopen();

      // Ждём завершения операции в очереди
      await joinPromise;

      expect(joinSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "joined",
          payload: { roomId: call.id, userId: "user1" },
        })
      );
    });
  });

  describe("Room Management", () => {
    it("should create new call explicitly", () => {
      const call = client.createCall();
      expect(call).toBeInstanceOf(Call);
      expect(client.getCall(call.id)).toBe(call);
    });

    it("should handle join/leave lifecycle", async () => {
      const call = client.createCall();
      const roomId = call.id;

      // Участвуем и проверяем
      await client.joinCall(roomId, "user1");
      expect(call.getParticipants()).toEqual(["user1"]);

      // Покидаем и проверяем
      await client.leaveCall(roomId, "user1");

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(call.getParticipants()).toEqual([]);
    });

    it("should reject join to non-existing room", async () => {
      const errorSpy = jest.fn();
      client.on("error", errorSpy);

      await client.joinCall("invalid-room", "user1");
      expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("Async Queue", () => {
    it("should process operations in order", async () => {
      const operations: number[] = [];

      client.joinCall("room1", "user1").then(() => operations.push(1));
      client.leaveCall("room1", "user1").then(() => operations.push(3));
      client.joinCall("room1", "user2").then(() => operations.push(2));

      mockWebSocket.onopen();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(operations).toEqual([1, 3, 2]);
    });
  });
});
