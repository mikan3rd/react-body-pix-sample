import "@tensorflow/tfjs";
import { css } from "@emotion/react";
import * as bodyPix from "@tensorflow-models/body-pix";
import React from "react";
import { Checkbox, Container, Segment } from "semantic-ui-react";

const width = 640;
const height = 480;

const App: React.VFC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const bodyPixNetRef = React.useRef<bodyPix.BodyPix | null>(null);

  // mediaStreamRef ... requestAnimationFrame内で使用するため必要
  // mediaStreamState ... ON/OFFに切り替えをレンダリングに反映するために必要
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const [mediaStreamState, setMediaStreamState] = React.useState<MediaStream | null>(null);

  // 上記のコメントと同じ理由
  const useBodyPixRef = React.useRef(false);
  const [useBodyPixState, setBodyPixState] = React.useState(false);

  const setMediaStream = (mediaStream: MediaStream | null) => {
    mediaStreamRef.current = mediaStream;
    setMediaStreamState(mediaStream);
  };

  const setBodyPix = (useBodyPix: boolean) => {
    useBodyPixRef.current = useBodyPix;
    setBodyPixState(useBodyPix);
  };

  const renderCanvas = async () => {
    // cancelAnimationFrame(requestID)だとrequestIDを参照している間に
    // 次のrequestIDが発行されて動き続ける場合があるのでここで止められる制御を入れている
    if (mediaStreamRef.current === null) {
      return;
    }

    const canvas = canvasRef.current;
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

    // requestAnimationFrame()だとChromeでタブが非アクティブの場合に非常に遅くなってしまう
    // この場合にも対応したい場合はsetTimeoutを使用する
    requestAnimationFrame(renderCanvas);
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
      videoRef.current.addEventListener("loadeddata", async () => {
        await renderCanvas();
      });
    }
  };

  const stopVideo = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  };

  const handleChangeVideo = () => {
    if (mediaStreamRef.current !== null) {
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

    setBodyPix(!useBodyPix);
  };

  return (
    <Container text>
      <div
        css={css`
          margin-top: 12px;
        `}
      >
        <Checkbox toggle checked={mediaStreamState !== null} label="Video" onChange={handleChangeVideo} />
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
        <canvas ref={canvasRef} width={width} height={height} />
      </Segment>
    </Container>
  );
};

export default App;
