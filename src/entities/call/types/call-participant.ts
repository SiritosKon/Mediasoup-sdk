import type { ConnectionStatus } from "../../../shared/types";
import { Signaling } from "../../signaling/model/Signaling";
import type { User as UserType } from "../../user/types";

export interface CallParticipantOptions extends UserType {
  isLocal?: boolean;
  connectionStatus?: ConnectionStatus;
  isSpeaking?: boolean;
  signaling: Signaling;
}

export type MediaEventType =
  | "producerAdded"
  | "producerRemoved"
  | "consumerAdded"
  | "consumerRemoved"
  | "transportConnected"
  | "transportDisconnected"
  | "transportError";

export type MediaEventPayload = {
  producerAdded: {
    producerId: string;
    kind: "audio" | "video";
  };
  producerRemoved: {
    producerId: string;
  };
  consumerAdded: {
    consumerId: string;
    kind: "audio" | "video";
  };
  consumerRemoved: {
    consumerId: string;
  };
  transportConnected: {
    transportId: string;
    type: "send" | "recv";
  };
  transportDisconnected: {
    transportId: string;
    type: "send" | "recv";
  };
  transportError: {
    transportId: string;
    error: Error;
  };
};

export type CallParticipantEvents = {
  [K in MediaEventType]: (payload: MediaEventPayload[K]) => void;
} & {
  error: (error: Error) => void;
};
