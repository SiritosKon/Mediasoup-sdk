import { EventEmitter } from "../../../shared/utils/EventEmitter";
import type { ConnectionStatus } from "../../../shared/types";
import type { CallParticipantOptions } from "../types/call-participant";
import { Signaling } from "../../signaling/model/Signaling";
import type { CallParticipantEvents } from "../types/call-participant";
import { Producer } from "mediasoup-client/lib/Producer";
import { Consumer } from "mediasoup-client/lib/Consumer";
import { Transport } from "mediasoup-client/lib/Transport";
import { TransportHandler } from "../../../shared/entity/transport/model/Transport";
import { User } from "../../user/model/User";

export class CallParticipant extends User {
  private _isLocal: boolean;
  private _connectionStatus: ConnectionStatus;
  private _isSpeaking: boolean;
  private transportHandler: TransportHandler;
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();
  private signaling: Signaling;

  constructor(options: CallParticipantOptions) {
    super(options);
    this._isLocal = options.isLocal ?? false;
    this._connectionStatus = options.connectionStatus ?? "connecting";
    this._isSpeaking = options.isSpeaking ?? false;

    // Инициализируем TransportHandler
    this.transportHandler = new TransportHandler(options.signaling);

    // Настраиваем обработчики событий транспорта
    this.setupTransportHandlers();

    // Инициализируем транспорты
    this.initializeTransports();
  }

  private setupTransportHandlers(): void {
    const sendTransport = this.transportHandler.getSendTransport();
    const recvTransport = this.transportHandler.getRecvTransport();

    // Обработчики для send transport
    sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.signaling.send("connectTransport", {
            transportId: sendTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          errback(error as Error);
        }
      }
    );

    // Обработчики для recv transport
    recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.signaling.send("connectTransport", {
            transportId: recvTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          errback(error as Error);
        }
      }
    );
  }

  private async initializeTransports(): Promise<void> {
    try {
      await this.transportHandler.initialize();
      this.signaling.send("transportConnected", {
        transportId: this.transportHandler.getSendTransport().id,
        type: "send",
      });
      this.signaling.send("transportConnected", {
        transportId: this.transportHandler.getRecvTransport().id,
        type: "recv",
      });
    } catch (error) {
      this.signaling.send("error", error as Error);
    }
  }

  async addProducer(
    kind: "audio" | "video",
    track: MediaStreamTrack
  ): Promise<Producer> {
    const sendTransport = this.transportHandler.getSendTransport();
    const producer = await sendTransport.produce({ track });

    this.producers.set(producer.id, producer);
    this.signaling.send("producerAdded", { producerId: producer.id, kind });

    return producer;
  }

  async addConsumer(
    producerId: string,
    kind: "audio" | "video"
  ): Promise<Consumer> {
    const recvTransport = this.transportHandler.getRecvTransport();
    const consumer = await recvTransport.consume({
      id: producerId,
      producerId,
      kind,
      rtpParameters: {
        codecs: [],
      },
    });

    this.consumers.set(consumer.id, consumer);
    this.signaling.send("consumerAdded", { consumerId: consumer.id, kind });

    return consumer;
  }

  removeProducer(producerId: string): void {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
      this.signaling.send("producerRemoved", { producer });
    }
  }

  removeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);
    if (consumer) {
      consumer.close();
      this.consumers.delete(consumerId);
      this.signaling.send("consumerRemoved", { consumer });
    }
  }

  // Существующие геттеры и сеттеры
  get isLocal(): boolean {
    return this._isLocal;
  }

  get connectionStatus(): ConnectionStatus {
    return this._connectionStatus;
  }

  get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  setConnectionStatus(status: ConnectionStatus): void {
    this._connectionStatus = status;
  }

  setIsSpeaking(isSpeaking: boolean): void {
    this._isSpeaking = isSpeaking;
  }

  // Методы для работы с транспортами
  getSendTransport(): Transport {
    return this.transportHandler.getSendTransport();
  }

  getRecvTransport(): Transport {
    return this.transportHandler.getRecvTransport();
  }
}
