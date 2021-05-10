import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";

type BodyPixType = "off" | "bokeh" | "colorMask";

// requestAnimationFrame()の再起処理とReactのライフサイクルの相性が悪いためクラス変数で管理する
// React.useState()を使うと再起処理内で使用されているstateがうまく反映できない
// React.useRef()を使うと再起処理内の変数は呼び出しごとに更新が反映されるがUIの再レンダリングされない
export class BodyPixControl {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;

  bodyPixNet: bodyPix.BodyPix | null = null;
  mediaStream: MediaStream | null = null;
  bodyPixType: BodyPixType = "off";
  segmentation: bodyPix.SemanticPersonSegmentation | null = null;

  width = 320;
  height = 240;

  // segmentPerson
  internalResolution = 0.5;
  segmentationThreshold = 0.7;
  maxDetections = 10;
  scoreThreshold = 0.3;
  nmsRadius = 20;

  backgroundBlurAmount = 3;
  edgeBlurAmount = 3;
  maskBlurAmount = 0;
  opacity = 0.7;
  flipHorizontal = false;
  foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
  backgroundColor = { r: 0, g: 0, b: 0, a: 255 };

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

  get backgroundColorValue() {
    const {
      backgroundColor: { r, g, b, a },
    } = this;
    return { r, g, b, a: Math.round((a / 255) * 100) / 100 };
  }

  get foregroundColorValue() {
    const {
      foregroundColor: { r, g, b, a },
    } = this;
    return { r, g, b, a: Math.round((a / 255) * 100) / 100 };
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
      audio: false, // TODO
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

  private renderCanvas = async () => {
    // cancelAnimationFrame(requestID)だとrequestIDを参照している間に
    // 次のrequestIDが発行されて動き続ける場合があるのでここで止められる制御を入れている
    if (this.mediaStream === null) {
      return;
    }

    switch (this.bodyPixType) {
      case "off":
        this.drawNormal();
        break;

      case "bokeh":
        await this.drawBokeh();
        break;

      case "colorMask":
        await this.drawMask();
        break;

      default:
        break;
    }

    // requestAnimationFrame()だとChromeでタブが非アクティブの場合に非常に遅くなってしまう
    // この場合にも対応したい場合はsetTimeoutを使用する
    requestAnimationFrame(this.renderCanvas);
  };

  private segmentPerson = async () => {
    const {
      bodyPixNet,
      video,
      internalResolution,
      segmentationThreshold,
      maxDetections,
      scoreThreshold,
      nmsRadius,
    } = this;

    if (bodyPixNet && video) {
      this.segmentation = await bodyPixNet.segmentPerson(video, {
        internalResolution,
        segmentationThreshold,
        maxDetections,
        scoreThreshold,
        nmsRadius,
      });
    }
  };

  private drawNormal = () => {
    const { canvas, video } = this;
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
    }
  };

  private drawBokeh = async () => {
    await this.segmentPerson();
    const { canvas, video, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal } = this;
    if (canvas && video && segmentation) {
      bodyPix.drawBokehEffect(canvas, video, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
    }
  };

  private drawMask = async () => {
    await this.segmentPerson();
    const {
      canvas,
      video,
      segmentation,
      opacity,
      maskBlurAmount,
      flipHorizontal,
      foregroundColor,
      backgroundColor,
    } = this;
    if (canvas && video && segmentation) {
      const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);
      bodyPix.drawMask(canvas, video, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);
    }
  };

  setBackgroundBlurAmount = (backgroundBlurAmount: this["backgroundBlurAmount"]) => {
    this.backgroundBlurAmount = backgroundBlurAmount;
  };

  setEdgeBlurAmount = (edgeBlurAmount: this["edgeBlurAmount"]) => {
    this.edgeBlurAmount = edgeBlurAmount;
  };

  setFlipHorizontal = (flipHorizontal: this["flipHorizontal"]) => {
    this.flipHorizontal = flipHorizontal;
  };

  setMaskBlurAmount = (maskBlurAmount: this["maskBlurAmount"]) => {
    this.maskBlurAmount = maskBlurAmount;
  };

  setOpacity = (opacity: this["opacity"]) => {
    this.opacity = opacity;
  };

  setBackgroundColor = (backgroundColor: this["backgroundColor"]) => {
    this.backgroundColor = backgroundColor;
  };

  setForegroundColor = (foregroundColor: this["foregroundColor"]) => {
    this.foregroundColor = foregroundColor;
  };

  setIternalResolution = (internalResolution: this["internalResolution"]) => {
    this.internalResolution = internalResolution;
  };

  setSegmentationThreshold = (segmentationThreshold: this["segmentationThreshold"]) => {
    this.segmentationThreshold = segmentationThreshold;
  };

  setMaxDetections = (maxDetections: this["maxDetections"]) => {
    this.maxDetections = maxDetections;
  };

  setScoreThreshold = (scoreThreshold: this["scoreThreshold"]) => {
    this.scoreThreshold = scoreThreshold;
  };

  setNmsRadius = (nmsRadius: this["nmsRadius"]) => {
    this.nmsRadius = nmsRadius;
  };
}
