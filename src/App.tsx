import { css } from "@emotion/react";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import React from "react";
import { Checkbox, Container, Segment } from "semantic-ui-react";

const width = 640;
const height = 480;

const App: React.VFC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const requestAnimationIdRef = React.useRef<number | null>(null);
  const bodyPixNetRef = React.useRef<bodyPix.BodyPix | null>(null);

  // bodyPix.drawBokehEffect()でcanvasを破壊的に変更するためrefは使用しない
  // const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null);

  const useBodyPixRef = React.useRef(false);
  const [useBodyPixState, setBodyPixState] = React.useState(false);

  const renderCanvas = async () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
    const video = videoRef.current;
    const useBodyPix = useBodyPixRef.current;
    const bodyPixNet = bodyPixNetRef.current;

    if (canvas && video) {
      if (useBodyPix && bodyPixNet) {
        const segmentation = await bodyPixNet.segmentPerson(video);
        bodyPix.drawBokehEffect(canvas, video, segmentation, 10);
      } else {
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);
      }
    }

    const requestId = requestAnimationFrame(await renderCanvas);
    requestAnimationIdRef.current = requestId;
  };

  const startVideo = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width,
        height,
      },
      audio: true,
    });
    setMediaStream(mediaStream);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }

    await renderCanvas();
  };

  const stopVideo = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    const requestAnimationId = requestAnimationIdRef.current;
    if (requestAnimationId !== null) {
      cancelAnimationFrame(requestAnimationId);
      requestAnimationIdRef.current = null;
    }
  };

  const handleChangeVideo = () => {
    if (mediaStream !== null) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  const handleBodyPix = async () => {
    const useBodyPix = useBodyPixRef.current;
    if (!useBodyPix && !bodyPixNetRef.current) {
      const net = await bodyPix.load();
      bodyPixNetRef.current = net;
    }
    useBodyPixRef.current = !useBodyPix;
    setBodyPixState(!useBodyPix);
  };

  return (
    <Container text>
      <div
        css={css`
          margin-top: 12px;
        `}
      >
        <Checkbox toggle checked={mediaStream !== null} label="Video" onChange={handleChangeVideo} />
      </div>
      <div
        css={css`
          margin-top: 12px;
        `}
      >
        <Checkbox toggle checked={useBodyPixState} label="BodyPix" onChange={handleBodyPix} />
      </div>
      <Segment>
        <video ref={videoRef} width={width} height={height} autoPlay hidden />
        <canvas id="canvas" width={width} height={height} />
      </Segment>
    </Container>
  );
};

export default App;
