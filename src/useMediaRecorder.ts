import { useCallback, useMemo, useState } from "react";

export const useMediaRecorder = () => {
  const mymeType = "video/webm";

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const download = useCallback((chunks: Blob[], fileName: string) => {
    const blob = new Blob(chunks, {
      type: mymeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.hidden = true;
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const startMediaRecord = useCallback(
    (stream: MediaStream) => {
      const recorder = new MediaRecorder(stream, {
        mimeType: mymeType,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (blobeEvent: BlobEvent) => {
        chunks.push(blobeEvent.data);
      };

      recorder.onstop = () => {
        const fileName = `${new Date().getTime()}.webm`;
        download(chunks, fileName);
        setMediaRecorder(null);
      };

      recorder.start();
      setMediaRecorder(recorder);
    },
    [download],
  );

  const stopMediaRecord = useCallback(() => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  const checkMediaType = () => {
    const types = [
      "video/webm",
      "audio/webm",
      "video/webm;codecs=vp8",
      "video/webm;codecs=daala",
      "video/webm;codecs=h264",
      "audio/webm;codecs=opus",
      "video/mpeg",
    ];

    for (const i in types) {
      console.log(types[i], MediaRecorder.isTypeSupported(types[i]) ? "OK!!" : "NO...");
    }
  };

  const isRecording = useMemo(() => mediaRecorder !== null, [mediaRecorder]);

  return { isRecording, startMediaRecord, stopMediaRecord, checkMediaType };
};
