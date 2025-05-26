import type { RtpCapabilities } from "mediasoup-client/lib/types";

export const mockRtpCapabilities: RtpCapabilities = {
  codecs: [
    {
      mimeType: "video/VP8",
      kind: "video" as const,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [],
    },
  ],
  headerExtensions: [],
};

export const mockTransportParams = {
  send: {
    id: "mock-send",
    iceParameters: {
      usernameFragment: "mock-username",
      password: "mock-password",
      iceLite: true,
    },
    iceCandidates: [],
    dtlsParameters: {
      role: "auto" as const,
      fingerprints: [
        {
          algorithm: "sha-256",
          value: "mock-fingerprint",
        },
      ],
    },
  },
  recv: {
    id: "mock-recv",
    iceParameters: {
      usernameFragment: "mock-username",
      password: "mock-password",
      iceLite: true,
    },
    iceCandidates: [],
    dtlsParameters: {
      role: "auto" as const,
      fingerprints: [
        {
          algorithm: "sha-256",
          value: "mock-fingerprint",
        },
      ],
    },
  },
};
