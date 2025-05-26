import { Transport } from "mediasoup-client/lib/Transport";

export type TransportPair = {
  send: Transport;
  recv: Transport;
};
