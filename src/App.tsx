import { css } from "@emotion/react";
import React from "react";
import { Button, Container, Segment } from "semantic-ui-react";

const App: React.VFC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null);

  const startVideo = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setMediaStream(mediaStream);
  };

  const stopVideo = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  };

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  return (
    <Container
      text
      css={css`
        &&& {
          margin-top: 12px;
        }
      `}
    >
      <Button content="START" positive onClick={startVideo} />
      <Button content="STOP" negative onClick={stopVideo} />
      <Segment>
        <video ref={videoRef} autoPlay />
      </Segment>
    </Container>
  );
};

export default App;
