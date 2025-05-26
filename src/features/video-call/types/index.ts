import { MediaType } from "../../../shared/types/media-types";

type VideoCallMessageType =
  | "joined"
  | "leave"
  | "participantJoined"
  | "participantLeft"
  | "producerAdded"
  | "producerRemoved"
  | "consumerAdded"
  | "consumerRemoved"
  | "transportConnected"
  | "transportDisconnected"
  | string;

type VideoCallPayload<T extends VideoCallMessageType, K = unknown> = {
  type: T;
  payload: K;
};

type VideoCallConnectionPayload = {
  roomId: string;
  userId: string;
};

export type VideoCallCreateMessage = VideoCallPayload<
  "created",
  {
    roomId: string;
  }
>;

export type VideoCallMessage = VideoCallPayload<VideoCallMessageType>;

export type VideoCallJoinedMessage = VideoCallPayload<
  "joined",
  VideoCallConnectionPayload
>;

export type VideoCallLeaveMessage = VideoCallPayload<
  "leave",
  VideoCallConnectionPayload
>;

export type VideoCallError = VideoCallPayload<"error", { error: Error }>;

export type VideoCallProducerAddedMessage = VideoCallPayload<
  "producerAdded",
  {
    roomId: string;
    userId: string;
    producerId: string;
    kind: MediaType;
  }
>;

export type VideoCallProducerRemovedMessage = VideoCallPayload<
  "producerRemoved",
  {
    roomId: string;
    userId: string;
    producerId: string;
  }
>;

export type VideoCallConsumerAddedMessage = VideoCallPayload<
  "consumerAdded",
  {
    roomId: string;
    userId: string;
    consumerId: string;
    kind: MediaType;
  }
>;

export type VideoCallConsumerRemovedMessage = VideoCallPayload<
  "consumerRemoved",
  {
    roomId: string;
    userId: string;
    consumerId: string;
  }
>;

export type VideoCallRequestProducersMessage = VideoCallPayload<
  "requestProducers",
  VideoCallConnectionPayload
>;

export type VideoCallEvents = {
  connected: () => void;
  joined: (message: VideoCallJoinedMessage) => void;
  leave: (message: VideoCallLeaveMessage) => void;
  created: (message: VideoCallCreateMessage) => void;
  error: (error: Error) => void;
  message: (message: VideoCallMessage) => void;
  producerAdded: (message: VideoCallProducerAddedMessage) => void;
  producerRemoved: (message: VideoCallProducerRemovedMessage) => void;
  consumerAdded: (message: VideoCallConsumerAddedMessage) => void;
  consumerRemoved: (message: VideoCallConsumerRemovedMessage) => void;
  requestProducers: (message: VideoCallRequestProducersMessage) => void;
};
