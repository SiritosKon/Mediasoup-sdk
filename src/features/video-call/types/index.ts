type VideoCallMessageType = "joined" | "leave" | "participantJoined" | string;

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

export type VideoCallEvents = {
  connected: () => void;
  joined: (message: VideoCallJoinedMessage) => void;
  leave: (message: VideoCallLeaveMessage) => void;
  created: (message: VideoCallCreateMessage) => void;
  error: (error: Error) => void;
  message: (message: VideoCallMessage) => void;
};
