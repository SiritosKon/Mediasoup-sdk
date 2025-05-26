export type SignalingEvents = {
  connected: () => void;
  message: (event: string, payload: unknown) => void;
  error: (error: Error) => void;
};
