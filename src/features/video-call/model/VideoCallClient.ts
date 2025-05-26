import { EventEmitter } from "../../../shared/utils/EventEmitter";
import { Signaling } from "../../../entities/signaling/model/Signaling";
import { AsyncQueue } from "../../../shared/utils/AsyncQueue";
import { Call } from "../../../entities/call/model/Call";
import {
  type VideoCallEvents,
  type VideoCallProducerAddedMessage,
  type VideoCallProducerRemovedMessage,
  type VideoCallRequestProducersMessage,
} from "../types";

export class VideoCallClient extends EventEmitter<VideoCallEvents> {
  public readonly signaling: Signaling;
  private calls = new Map<string, Call>();
  private queue = new AsyncQueue();
  private localUserId: string | null = null;

  constructor(url: string) {
    super();
    this.signaling = new Signaling(url);
    this.setupSignalingHandlers();
  }

  private setupSignalingHandlers(): void {
    this.signaling.on("error", (error) => this.emit("error", error));
    this.signaling.on("connected", () => {
      this.emit("connected");
    });

    this.signaling.on("message", (event, payload) => {
      // Обработка подключения участников
      if (event === "joined") {
        this.handleParticipantJoined(
          payload as { roomId: string; userId: string }
        );
      } else if (event === "leave") {
        this.handleParticipantLeft(
          payload as { roomId: string; userId: string }
        );
      }
      // Обработка запроса продюсеров
      else if (event === "requestProducers") {
        this.handleRequestProducers(
          payload as VideoCallRequestProducersMessage["payload"]
        );
      }
      // Обработка медиа-событий
      else if (event === "producerAdded") {
        this.handleProducerAdded(
          payload as VideoCallProducerAddedMessage["payload"]
        );
      } else if (event === "producerRemoved") {
        this.handleProducerRemoved(
          payload as VideoCallProducerRemovedMessage["payload"]
        );
      }

      // Пробрасываем все события наверх
      this.emit(event as keyof VideoCallEvents, {
        type: event,
        payload,
      });
    });
  }

  private async handleParticipantJoined(payload: {
    roomId: string;
    userId: string;
  }): Promise<void> {
    const { roomId, userId } = payload;
    const call = this.calls.get(roomId);
    if (!call) return;

    // Если это не локальный пользователь
    if (userId !== this.localUserId) {
      // Создаем нового участника
      call.addParticipant(userId, this.signaling, {
        isLocal: false,
      });

      // Запрашиваем медиа-потоки нового участника
      this.signaling.send("requestProducers", {
        roomId,
        userId,
      });
    }
  }

  private async handleParticipantLeft(payload: {
    roomId: string;
    userId: string;
  }): Promise<void> {
    const { roomId, userId } = payload;
    const call = this.calls.get(roomId);
    if (!call) return;

    // Удаляем участника из звонка
    call.removeParticipant(userId);
  }

  private async handleRequestProducers(
    payload: VideoCallRequestProducersMessage["payload"]
  ): Promise<void> {
    const { roomId, userId } = payload;
    const call = this.calls.get(roomId);
    if (!call) return;

    // Если это запрос от другого пользователя к нам
    if (userId === this.localUserId) {
      const localParticipant = call.getParticipant(this.localUserId!);
      if (localParticipant) {
        // Отправляем информацию о всех наших продюсерах
        for (const producer of localParticipant.getProducers()) {
          this.signaling.send("producerAdded", {
            producerId: producer.id,
            kind: producer.kind,
            userId: this.localUserId,
            roomId,
          });
        }
      }
    }
  }

  private async handleProducerAdded(
    payload: VideoCallProducerAddedMessage["payload"]
  ): Promise<void> {
    const { roomId, userId, producerId, kind } = payload;
    const call = this.calls.get(roomId);
    if (!call) return;

    // Если это не локальный пользователь добавил продюсер
    if (userId !== this.localUserId) {
      const localParticipant = call.getParticipant(this.localUserId!);
      if (localParticipant) {
        try {
          // Создаем консьюмер для этого продюсера
          const consumer = await localParticipant.addConsumer(producerId, kind);

          // Отправляем информацию о созданном консьюмере
          this.signaling.send("consumerAdded", {
            roomId,
            userId: this.localUserId,
            consumerId: consumer.id,
            kind,
          });
        } catch (error) {
          this.emit("error", error as Error);
        }
      }
    }
  }

  private async handleProducerRemoved(
    payload: VideoCallProducerRemovedMessage["payload"]
  ): Promise<void> {
    const { roomId, userId, producerId } = payload;
    const call = this.calls.get(roomId);
    if (!call) return;

    // Обрабатываем только удаление продюсеров от других пользователей
    if (userId !== this.localUserId) {
      const localParticipant = call.getParticipant(this.localUserId!);
      if (!localParticipant) return;

      try {
        const consumer = localParticipant.getConsumerByProducerId(producerId);
        if (!consumer) return;

        // Удаляем консьюмер
        localParticipant.removeConsumer(consumer.id);

        // Уведомляем других участников об удалении консьюмера
        this.signaling.send("consumerRemoved", {
          roomId,
          userId: this.localUserId,
          consumerId: consumer.id,
        });
      } catch (error) {
        this.emit("error", error as Error);
      }
    }
  }

  createCall(): Call {
    const call = new Call();
    this.calls.set(call.id, call);
    this.emit("created", {
      type: "created",
      payload: { roomId: call.id },
    });
    return call;
  }

  async joinCall(roomId: string, userId: string): Promise<void> {
    this.queue.enqueue(async () => {
      let call = this.calls.get(roomId);

      if (!call) {
        this.emit("error", new Error(`Call ${roomId} not found`));
        return;
      }

      try {
        this.localUserId = userId;

        const participant = call.addParticipant(userId, this.signaling, {
          isLocal: true,
        });

        if (participant.isLocal) {
          await participant.setupLocalParticipantMedia();
        }

        this.signaling.send("joined", { roomId, userId });
        this.emit("joined", {
          type: "joined",
          payload: { roomId, userId },
        });
      } catch (error) {
        this.emit("error", error as Error);
      }
    });
  }

  async leaveCall(roomId: string, userId: string): Promise<void> {
    this.queue.enqueue(async () => {
      const call = this.calls.get(roomId);
      if (!call) {
        this.emit("error", new Error(`Call ${roomId} not found`));
        return;
      }
      call.removeParticipant(userId);

      this.signaling.send("leave", { roomId, userId });
    });
  }

  getCall(roomId: string): Call | undefined {
    return this.calls.get(roomId);
  }

  getAllCalls(): Call[] {
    return Array.from(this.calls.values());
  }

  getSignaling(): Signaling {
    return this.signaling;
  }
}
