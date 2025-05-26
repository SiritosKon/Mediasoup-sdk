import { Signaling } from "../../signaling/model/Signaling";
import { CallParticipant } from "./CallParticipant";

export class Call {
  public readonly id: string;
  private participants: Map<string, CallParticipant>;

  constructor() {
    this.id = Math.random().toString(36).substr(2, 9); // Генерация уникального ID
    this.participants = new Map();
  }

  addParticipant(participantId: string, signaling: Signaling): CallParticipant {
    if (!this.participants.has(participantId)) {
      this.participants.set(
        participantId,
        new CallParticipant({
          id: participantId,
          name: "Unknown",
          signaling,
        })
      );
    }

    return this.participants.get(participantId)!;
  }

  removeParticipant(userId: string): boolean {
    return this.participants.delete(userId);
  }

  endCall(): void {
    this.participants.clear();
  }

  getParticipants(): CallParticipant[] {
    return Array.from(this.participants.values());
  }

  getParticipant(userId: string): CallParticipant | undefined {
    return this.participants.get(userId);
  }
}
