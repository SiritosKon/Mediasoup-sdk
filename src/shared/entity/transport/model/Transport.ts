import { Device } from "mediasoup-client";
import type { TransportPair } from "../types";
import { AsyncQueue } from "../../../utils/AsyncQueue";
import { Signaling } from "../../../../entities/signaling/model/Signaling";
import { Transport } from "mediasoup-client/lib/Transport";
import { mockRtpCapabilities, mockTransportParams } from "../mocks";

export class TransportHandler {
  private readonly device = new Device();
  public transports: TransportPair | null = null;
  private queue = new AsyncQueue();

  constructor(private signaling: Signaling) {}

  async initialize(): Promise<void> {
    await this.queue.enqueue(async () => {
      await this.device.load({ routerRtpCapabilities: mockRtpCapabilities });

      this.signaling.send("deviceLoaded", {});
      this.transports = {
        // @ts-ignore
        send: this.device.createSendTransport(mockTransportParams.send),
        // @ts-ignore
        recv: this.device.createRecvTransport(mockTransportParams.recv),
      };
    });
  }

  getSendTransport(): Transport {
    if (!this.transports) throw new Error("Transports not initialized");
    return this.transports.send;
  }

  getRecvTransport(): Transport {
    if (!this.transports) throw new Error("Transports not initialized");
    return this.transports.recv;
  }
}
