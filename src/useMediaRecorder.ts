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

      recorder.onerror = (e) => {
        alert(e);
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

  const isRecording = useMemo(() => mediaRecorder !== null, [mediaRecorder]);

  return { isRecording, startMediaRecord, stopMediaRecord };
};
