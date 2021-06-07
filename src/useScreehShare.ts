import { useCallback, useMemo, useRef, useState } from "react";

declare global {
  interface MediaDevices {
    getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  }
}

export const useScreenShare = () => {
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);

  const [displayMediaStream, setDisplayMediaStream] = useState<MediaStream | null>(null);

  const hasDisplayMediaStream = useMemo(() => displayMediaStream !== null, [displayMediaStream]);

  const getDisplayMedia = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Browser API navigator.mediaDevices.getDisplayMedia not available");
      return null;
    }

    try {
      return navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      });
    } catch (e) {
      alert(e);
      return null;
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    const mediaStream = await getDisplayMedia();
    setDisplayMediaStream(mediaStream);

    const video = screenShareVideoRef.current;
    if (video) {
      video.srcObject = mediaStream;
    }
  }, [getDisplayMedia]);

  const stopScreenShare = useCallback(() => {
    displayMediaStream?.getTracks().forEach((track) => track.stop());
    setDisplayMediaStream(null);
  }, [displayMediaStream]);

  return {
    hasDisplayMediaStream,
    screenShareVideoRef,
    startScreenShare,
    stopScreenShare,
  };
};
