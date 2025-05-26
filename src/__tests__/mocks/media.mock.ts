export const mockMediaStream = {
  getAudioTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
  getVideoTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
};
