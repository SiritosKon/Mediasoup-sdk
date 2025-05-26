import { Signaling } from "../../signaling/model/Signaling";
import type { User as UserType } from "../../user/types";

export interface CallParticipantOptions extends UserType {
  isLocal?: boolean;
  signaling: Signaling;
}
