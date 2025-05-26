import { Call } from "../../../entities/call/model/Call";
import { Signaling } from "../../../entities/signaling/model/Signaling";
import { VideoCallClient } from "../../../features/video-call/model/VideoCallClient";
import {
  mockWebSocket,
  mockDevice,
  mockTransportHandler,
  mockMediaStream,
} from "../../mocks";

// Мокаем глобальный WebSocket
(global as any).WebSocket = jest.fn(() => mockWebSocket);
// Мокаем navigator.mediaDevices
Object.defineProperty(global, "navigator", {
  value: {
    mediaDevices: {
      getUserMedia: jest.fn().mockResolvedValue(mockMediaStream),
    },
  },
  writable: true,
});

// Мокаем Device из mediasoup-client
jest.mock("mediasoup-client", () => ({
  Device: jest.fn(() => mockDevice),
}));

// Мокаем TransportHandler
jest.mock("../../../shared/entity/transport/model/Transport", () => ({
  TransportHandler: jest.fn(() => mockTransportHandler),
}));

describe("VideoCallClient", () => {
  let client: VideoCallClient;
  let signaling: Signaling;
  const TEST_URL = "ws://test-server";
  const TEST_ROOM = "test-room";
  const TEST_USER = "test-user";

  beforeEach(async () => {
    jest.clearAllMocks();
    client = new VideoCallClient(TEST_URL);
    signaling = client.getSignaling();
  });

  describe("Connection Management", () => {
    it("should initialize signaling with correct URL", () => {
      expect(WebSocket).toHaveBeenCalledWith(TEST_URL);
    });

    it("should emit connected event on WebSocket open", async () => {
      const spy = jest.fn();
      client.on("connected", spy);

      mockWebSocket.onopen();

      expect(spy).toHaveBeenCalled();
    });

    it("should create new call", () => {
      const call = client.createCall();
      expect(call).toBeDefined();
      expect(client.getCall(call.id)).toBe(call);
    });
  });

  describe("Call Lifecycle", () => {
    it("should create active call", () => {
      const call = client.createCall();
      expect(call).toBeDefined();
      expect(call.id).toBeTruthy();
      expect(call.isCallEnded()).toBe(false);
    });

    it("should track participants", () => {
      const call = client.createCall();
      expect(call.getParticipantCount()).toBe(0);

      call.addParticipant("user1", signaling, { isLocal: true });
      expect(call.getParticipantCount()).toBe(1);

      call.removeParticipant("user1");
      expect(call.getParticipantCount()).toBe(0);
    });

    it("should get participant", async () => {
      const call = client.createCall();
      await client.joinCall(call.id, TEST_USER);
      const participant = call.getParticipant(TEST_USER);
      expect(participant).toBeDefined();
      expect(participant?.isLocal).toBeTruthy();
    });

    it("should prevent actions on ended call", () => {
      const call = client.createCall();
      call.endCall();

      expect(call.isCallEnded()).toBe(true);
      expect(() => {
        call.addParticipant("user1", client.getSignaling(), { isLocal: true });
      }).toThrow("Cannot add participant to ended call");
    });

    it("should provide access to signaling instance", () => {
      expect(signaling).toBeInstanceOf(Signaling);
      expect(signaling).toBe(client.getSignaling());
    });
  });

  describe("Producer Events", () => {
    it("should create producers for local participant", async () => {
      const call = client.createCall();
      await client.joinCall(call.id, TEST_USER);

      const participant = call.getParticipant(TEST_USER)!;
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(participant.getProducers()).toHaveLength(1);
      expect(participant.getProducers()[0].kind).toBe("audio");
    });
  });

  describe("Signaling Events Handling", () => {
    let testCall: Call;
    const REMOTE_USER = "remote-user";

    beforeEach(async () => {
      testCall = client.createCall();
      await client.joinCall(testCall.id, TEST_USER);
    });

    describe("requestProducers handling", () => {
      it("should send local producers when requested", async () => {
        const sendSpy = jest.spyOn(client.signaling, "send");

        // Эмулируем запрос продюсеров
        client.signaling.emit("message", "requestProducers", {
          roomId: testCall.id,
          userId: TEST_USER,
        });

        await new Promise(process.nextTick);

        expect(sendSpy).toHaveBeenCalledWith(
          "producerAdded",
          expect.objectContaining({
            producerId: expect.any(String),
            kind: "audio",
          })
        );
      });

      it("should ignore requests from other users", async () => {
        const sendSpy = jest.spyOn(client.signaling, "send");

        client.signaling.emit("message", "requestProducers", {
          roomId: testCall.id,
          userId: "another-user",
        });

        await new Promise(process.nextTick);

        expect(sendSpy).not.toHaveBeenCalled();
      });
    });

    describe("producerAdded handling", () => {
      it("should create consumer for remote producer", async () => {
        const REMOTE_PRODUCER_ID = "remote-producer-123";
        const sendSpy = jest.spyOn(client.signaling, "send");

        // Эмулируем добавление удаленного продюсера
        client.signaling.emit("message", "producerAdded", {
          roomId: testCall.id,
          userId: REMOTE_USER,
          producerId: REMOTE_PRODUCER_ID,
          kind: "audio",
        });

        await new Promise(process.nextTick);

        expect(sendSpy).toHaveBeenCalledWith(
          "consumerAdded",
          expect.objectContaining({
            consumerId: expect.any(String),
            kind: "audio",
          })
        );
      });
    });
  });
});
