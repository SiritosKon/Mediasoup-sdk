import { EventEmitter } from "../../../shared/utils/EventEmitter";
import { Signaling } from "../../../entities/signaling/model/Signaling";
import { AsyncQueue } from "../../../shared/utils/AsyncQueue";
import { Call } from "../../../entities/call/model/Call";
import type { VideoCallEvents, VideoCallMessage } from "../types";
import { CallParticipant } from "../../../entities/call/model/CallParticipant";

export class VideoCallClient extends EventEmitter<VideoCallEvents> {
  private signaling: Signaling;
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
    this.signaling.on("connected", () => this.emit("connected"));

    this.signaling.on("message", (event, payload) => {
      // // Обработка событий участников
      // if (event === "participantJoined") {
      //   this.handleParticipantJoined(payload);
      // } else if (event === "participantLeft") {
      //   this.handleParticipantLeft(
      //     payload as { roomId: string; userId: string }
      //   );
      // }
      // // Обработка событий медиа
      // else if (event === "producerAdded") {
      //   this.handleProducerAdded(
      //     payload as { producerId: string; kind: "audio" | "video" }
      //   );
      // } else if (event === "producerRemoved") {
      //   this.handleProducerRemoved(payload as { producerId: string });
      // } else if (event === "consumerAdded") {
      //   this.handleConsumerAdded(
      //     payload as { consumerId: string; kind: "audio" | "video" }
      //   );
      // } else if (event === "consumerRemoved") {
      //   this.handleConsumerRemoved(payload as { consumerId: string });
      // }

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
      const localParticipant = call.getParticipant(this.localUserId!);
      if (localParticipant) {
        await this.subscribeToNewParticipant(localParticipant, userId, call);
      }
    }
  }

  private async handleParticipantLeft(payload: {
    roomId: string;
    userId: string;
  }): Promise<void> {
    const { roomId, userId } = payload;
    const call = this.calls.get(roomId);
    if (!call) return;

    const participant = call.getParticipant(userId);
    if (participant) {
      await this.unsubscribeFromParticipant(participant);
    }
  }

  // private async handleProducerAdded(payload: {
  //   producerId: string;
  //   kind: "audio" | "video";
  // }): Promise<void> {
  //   const { producerId, kind } = payload;

  //   // Находим все активные звонки
  //   for (const call of this.calls.values()) {
  //     // Для каждого локального участника в звонке
  //     const localParticipant = call.getParticipant(this.localUserId!);
  //     if (localParticipant) {
  //       // Подписываемся на нового продюсера
  //       await localParticipant.addConsumer(producerId, kind);
  //     }
  //   }
  // }

  // private async handleProducerRemoved(payload: {
  //   producerId: string;
  // }): Promise<void> {
  //   const { producerId } = payload;

  //   // Находим все активные звонки
  //   for (const call of this.calls.values()) {
  //     const localParticipant = call.getParticipant(this.localUserId!);
  //     if (localParticipant) {
  //       // Находим и удаляем консьюмер для этого продюсера
  //       const consumer = localParticipant.getConsumerByProducerId(producerId);
  //       if (consumer) {
  //         localParticipant.removeConsumer(consumer.id);
  //       }
  //     }
  //   }
  // }

  private handleConsumerAdded(payload: {
    consumerId: string;
    kind: "audio" | "video";
  }): void {
    // Здесь можно добавить логику для обработки добавления консьюмера
    // Например, обновление UI или логирование
  }

  private handleConsumerRemoved(payload: { consumerId: string }): void {
    // Здесь можно добавить логику для обработки удаления консьюмера
    // Например, обновление UI или логирование
  }

  // private async subscribeToNewParticipant(
  //   localParticipant: CallParticipant,
  //   newUserId: string,
  //   call: Call
  // ): Promise<void> {
  //   try {
  //     const newParticipant = call.getParticipant(newUserId);
  //     if (!newParticipant) return;

  //     // Подписываемся на все продюсеры нового участника
  //     for (const producer of newParticipant.getProducers()) {
  //       await localParticipant.addConsumer(producer.id, producer.kind);
  //     }
  //   } catch (error) {
  //     this.emit("error", error as Error);
  //   }
  // }

  // private async unsubscribeFromParticipant(
  //   participant: CallParticipant
  // ): Promise<void> {
  //   try {
  //     // Закрываем все консьюмеры этого участника
  //     for (const consumer of participant.getConsumers()) {
  //       participant.removeConsumer(consumer.id);
  //     }
  //   } catch (error) {
  //     this.emit("error", error as Error);
  //   }
  // }
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

      // Сохраняем ID локального пользователя
      this.localUserId = userId;

      const participant = call.addParticipant(userId, {
        isLocal: true,
        signaling: this.signaling,
      });

      // Для локального пользователя создаем продюсеры
      if (participant.isLocal) {
        await this.setupLocalParticipantMedia(participant);
      }

      this.signaling.send("joined", { roomId, userId });
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

  private async setupLocalParticipantMedia(
    participant: CallParticipant
  ): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      await participant.addProducer("audio", stream.getAudioTracks()[0]);
      await participant.addProducer("video", stream.getVideoTracks()[0]);
    } catch (error) {
      this.emit("error", error as Error);
    }
  }
}
