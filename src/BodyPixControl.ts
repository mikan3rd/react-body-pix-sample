import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";

type BodyPixType = "off" | "bokeh" | "color";

export class BodyPixControl {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;

  bodyPixNet: bodyPix.BodyPix | null = null;
  mediaStream: MediaStream | null = null;
  bodyPixType: BodyPixType = "off";
  segmentation: bodyPix.SemanticPersonSegmentation | null = null;

  width = 640;
  height = 480;
  backgroundBlurAmount = 3;
  edgeBlurAmount = 3;
  flipHorizontal = false;

  constructor(videoRef: BodyPixControl["videoRef"], canvasRef: BodyPixControl["canvasRef"]) {
    this.videoRef = videoRef;
    this.canvasRef = canvasRef;
  }

  get video() {
    return this.videoRef.current;
  }

  get canvas() {
    return this.canvasRef.current;
  }

  get hasMediaStream() {
    return this.mediaStream !== null;
  }

  handleChangeVideo = async () => {
    if (this.mediaStream !== null) {
      this.stopVideo();
    } else {
      await this.startVideo();
    }
  };

  handleChangeBodyPixType = async (bodyPixType: BodyPixType) => {
    if (bodyPixType !== "off" && !this.bodyPixNet) {
      const net = await bodyPix.load();
      this.bodyPixNet = net;
    }
    this.bodyPixType = bodyPixType;
  };

  startVideo = async () => {
    const { width, height } = this;
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width,
        height,
      },
      audio: true,
    });
    this.mediaStream = mediaStream;

    const { video } = this;
    if (video) {
      video.srcObject = mediaStream;
      video.addEventListener("loadeddata", async () => {
        await this.renderCanvas();
      });
    }
  };

  stopVideo = () => {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  };

  renderCanvas = async () => {
    const { mediaStream } = this;

    // cancelAnimationFrame(requestID)だとrequestIDを参照している間に
    // 次のrequestIDが発行されて動き続ける場合があるのでここで止められる制御を入れている
    if (mediaStream === null) {
      return;
    }

    switch (this.bodyPixType) {
      case "off":
        this.drawNormal();
        break;

      case "bokeh":
        await this.drawBokeh();
        break;

      default:
        break;
    }

    // requestAnimationFrame()だとChromeでタブが非アクティブの場合に非常に遅くなってしまう
    // この場合にも対応したい場合はsetTimeoutを使用する
    requestAnimationFrame(this.renderCanvas);
  };

  segmentPerson = async () => {
    const { bodyPixNet, video } = this;
    if (bodyPixNet && video) {
      this.segmentation = await bodyPixNet.segmentPerson(video);
    }
  };

  drawNormal = () => {
    const { canvas, video } = this;
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
    }
  };

  drawBokeh = async () => {
    await this.segmentPerson();
    const { canvas, video, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal } = this;
    if (canvas && video && segmentation) {
      bodyPix.drawBokehEffect(canvas, video, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
    }
  };

  setBackgroundBlurAmount = (backgroundBlurAmount: number) => {
    this.backgroundBlurAmount = backgroundBlurAmount;
  };

  setEdgeBlurAmount = (edgeBlurAmount: number) => {
    this.edgeBlurAmount = edgeBlurAmount;
  };

  setFlipHorizontal = (flipHorizontal: boolean) => {
    this.flipHorizontal = flipHorizontal;
  };
}
