import { Signaling } from "../../signaling/model/Signaling";
import { CallParticipant } from "./CallParticipant";
import { ParticipantNameFactory } from "./partisipant-factory";

export class Call {
  public readonly id: string;
  private participants: Map<string, CallParticipant>;
  private isEnded: boolean = false;

  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.participants = new Map();
  }

  addParticipant(
    participantId: string,
    signaling: Signaling,
    options: { isLocal: boolean }
  ): CallParticipant {
    if (this.isEnded) {
      throw new Error("Cannot add participant to ended call");
    }

    if (!this.participants.has(participantId)) {
      const name = ParticipantNameFactory.generateName();
      const participant = new CallParticipant({
        id: participantId,
        name,
        signaling,
        ...options,
      });

      this.participants.set(participantId, participant);
    }

    return this.participants.get(participantId)!;
  }

  removeParticipant(userId: string): boolean {
    const participant = this.participants.get(userId);
    if (participant) {
      // Освобождаем имя
      ParticipantNameFactory.releaseName(participant.name);

      // Закрываем все медиа-потоки
      for (const producer of participant.getProducers()) {
        participant.removeProducer(producer.id);
      }

      for (const consumer of participant.getConsumers()) {
        participant.removeConsumer(consumer.id);
      }

      // Закрываем транспорты
      const sendTransport = participant.getSendTransport();
      const recvTransport = participant.getRecvTransport();

      if (sendTransport) {
        sendTransport.close();
      }
      if (recvTransport) {
        recvTransport.close();
      }

      // Удаляем участника
      return this.participants.delete(userId);
    }
    return false;
  }

  endCall(): void {
    if (this.isEnded) return;

    // Удаляем всех участников
    Array.from(this.participants.keys()).forEach((userId) => {
      this.removeParticipant(userId);
    });

    this.participants.clear();
    this.isEnded = true;
  }

  getParticipants(): CallParticipant[] {
    return Array.from(this.participants.values());
  }

  getParticipant(userId: string): CallParticipant | undefined {
    return this.participants.get(userId);
  }

  // Вспомогательные методы
  isCallEnded(): boolean {
    return this.isEnded;
  }

  getParticipantCount(): number {
    return this.participants.size;
  }

  hasParticipant(userId: string): boolean {
    return this.participants.has(userId);
  }
}
