import { EventEmitter } from "../../../shared/utils/EventEmitter";
import type { SignalingEvents } from "../types";

export class Signaling extends EventEmitter<SignalingEvents> {
  private ws: WebSocket;

  constructor(url: string) {
    super();

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.emit("connected");
    };

    this.ws.onmessage = (e) => {
      try {
        const { event, payload } = JSON.parse(e.data);

        this.emit("message", event, payload);
      } catch (error) {
        this.emit("error", error as Error);
      }
    };

    this.ws.onerror = () => {
      this.emit("error", new Error("WebSocket connection error"));
    };
  }

  send(event: string, payload: unknown): void {
    this.ws.send(JSON.stringify({ event, payload }));
    this.emit("message", event, payload);
  }
}
