import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";
import { useMemo, useRef, useState } from "react";

type ModelConfig = NonNullable<Parameters<typeof bodyPix.load>[0]>;
type EffectType = "off" | "bokeh" | "colorMask";

export const useBodyPix = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const video = videoRef.current;
  const canvas = canvasRef.current;

  const [mediaStreamState, setMediaStreamState] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef<typeof mediaStreamState>(mediaStreamState);

  const [effectTypeState, setEffectTypeState] = useState<EffectType>("off");
  const effectTypeRef = useRef<typeof effectTypeState>(effectTypeState);

  const bodyPixNetRef = useRef<bodyPix.BodyPix | null>(null);
  const bodyPixNet = bodyPixNetRef.current;

  const [loading, setLoading] = useState(false);

  // bodypix
  const [architecture, setArchitecture] = useState<ModelConfig["architecture"]>("MobileNetV1");
  const [outputStride, setOutputStride] = useState<ModelConfig["outputStride"]>(16);
  const [multiplier, setMultiplier] = useState<NonNullable<ModelConfig["multiplier"]>>(1.0);
  const [quantBytes, setQuantBytes] = useState<NonNullable<ModelConfig["quantBytes"]>>(4);

  const loadBodyPix = async () => {
    setLoading(true);

    bodyPixNetRef.current = await bodyPix.load({
      architecture,
      outputStride,
      multiplier,
      quantBytes,
    });

    setLoading(false);
  };

  const segmentPerson = async () => {
    const { internalResolution, segmentationThreshold, maxDetections, scoreThreshold, nmsRadius } = this;

    if (bodyPixNet && video) {
      return await bodyPixNet.segmentPerson(video, {
        internalResolution,
        segmentationThreshold,
        maxDetections,
        scoreThreshold,
        nmsRadius,
      });
    }
  };

  const drawNormal = () => {
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
    }
  };

  const drawBokeh = async () => {
    const segmentation = await segmentPerson();
    const { backgroundBlurAmount, edgeBlurAmount, flipHorizontal } = this;
    if (canvas && video && segmentation) {
      bodyPix.drawBokehEffect(canvas, video, segmentation, backgroundBlurAmount, edgeBlurAmount, flipHorizontal);
    }
  };

  const drawMask = async () => {
    const segmentation = await segmentPerson();
    const { opacity, maskBlurAmount, flipHorizontal, foregroundColor, backgroundColor } = this;
    if (canvas && video && segmentation) {
      const backgroundDarkeningMask = bodyPix.toMask(segmentation, foregroundColor, backgroundColor);
      bodyPix.drawMask(canvas, video, backgroundDarkeningMask, opacity, maskBlurAmount, flipHorizontal);
    }
  };

  const renderCanvas = async () => {
    // cancelAnimationFrame(requestID)だとrequestIDを参照している間に
    // 次のrequestIDが発行されて動き続ける場合があるのでここで止められる制御を入れている
    if (mediaStreamRef.current === null) {
      return;
    }

    switch (effectTypeRef.current) {
      case "off":
        drawNormal();
        break;

      case "bokeh":
        await drawBokeh();
        break;

      case "colorMask":
        await drawMask();
        break;

      default:
        break;
    }

    // requestAnimationFrame()だとChromeでタブが非アクティブの場合に非常に遅くなってしまう
    // この場合にも対応したい場合はsetTimeoutを使用する
    requestAnimationFrame(renderCanvas);
  };

  const setMediaStream = (mediaStream: typeof mediaStreamState) => {
    mediaStreamRef.current = mediaStream;
    setMediaStreamState(mediaStream);
  };

  const setEffectType = (effectType: typeof effectTypeState) => {
    effectTypeRef.current = effectType;
    setEffectTypeState(effectType);
  };

  const handleChangeEffectType = async (effectType: typeof effectTypeState) => {
    if (effectType !== "off" && !bodyPixNet) {
      await loadBodyPix();
    }
    setEffectType(effectType);
  };

  const handleChangeArchitecture = async (nextArchitecture: typeof architecture) => {
    setArchitecture(nextArchitecture);
    await loadBodyPix();
  };

  const handleChangeQuantBytes = async (nextQuantBytes: typeof quantBytes) => {
    setQuantBytes(nextQuantBytes);
    await loadBodyPix();
  };

  const hasMediaStream = useMemo(() => mediaStreamState !== null, [mediaStreamState]);

  return {
    videoRef,
    canvasRef,
    loading,
    hasMediaStream,
    handleChangeArchitecture,
    handleChangeQuantBytes,
    handleChangeEffectType,
  };
};
