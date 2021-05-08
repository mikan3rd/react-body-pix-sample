import "@tensorflow/tfjs";
import { css } from "@emotion/react";
import * as bodyPix from "@tensorflow-models/body-pix";
import React from "react";
import { Checkbox, Container, Segment } from "semantic-ui-react";

const width = 640;
const height = 480;

const App: React.VFC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const requestAnimationId = React.useRef<number | null>(null);

  // bodyPix.drawBokehEffect()でcanvasを破壊的に変更するためrefは使用しない
  // const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null);
  const [bodyPixNet, setBodyPixNet] = React.useState<bodyPix.BodyPix | null>(null);
  const [useBodyPix, setUseBodyPix] = React.useState(false);

  const startVideo = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width,
        height,
      },
      audio: true,
    });
    setMediaStream(mediaStream);
  };

  const stopVideo = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (requestAnimationId.current !== null) {
      cancelAnimationFrame(requestAnimationId.current);
      requestAnimationId.current = null;
    }
  };

  const handleChangeVideo = () => {
    if (mediaStream) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  const handleBodyPix = async () => {
    if (!useBodyPix && !bodyPixNet) {
      const net = await bodyPix.load();
      setBodyPixNet(net);
    }
    setUseBodyPix((prev) => !prev);
  };

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  React.useEffect(() => {
    const renderCanvas = async () => {
      const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
      const video = videoRef.current;
      if (canvas && video) {
        if (useBodyPix && bodyPixNet) {
          const segmentation = await bodyPixNet.segmentPerson(video, {
            flipHorizontal: false, // ミラーリング
            internalResolution: 0.35,
            segmentationThreshold: 0.7,
            maxDetections: 10,
            scoreThreshold: 0.4,
            nmsRadius: 20,
          });
          bodyPix.drawBokehEffect(canvas, video, segmentation, 5);
        } else {
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(video, 0, 0);
        }
      }

      if (mediaStream) {
        const requestId = requestAnimationFrame(renderCanvas);
        requestAnimationId.current = requestId;
      }
    };

    if (mediaStream) {
      renderCanvas();
    }
  }, [bodyPixNet, mediaStream, useBodyPix]);

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
        <Checkbox toggle checked={useBodyPix} label="BodyPix" onChange={handleBodyPix} />
      </div>
      <Segment>
        <video ref={videoRef} width={width} height={height} autoPlay hidden />
        <canvas id="canvas" width={width} height={height} />
      </Segment>
    </Container>
  );
};

export default App;
