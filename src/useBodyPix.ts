import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";
import { useMemo, useRef, useState } from "react";

type ModelConfig = NonNullable<Parameters<typeof bodyPix.load>[0]>;
type EffectType = "off" | "bokeh" | "colorMask";

export const useBodyPix = () => {
  const [width] = useState(320);
  const [height] = useState(240);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const video = videoRef.current;
  const canvas = canvasRef.current;

  const [mediaStreamState, setMediaStreamState] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef(mediaStreamState);

  const [effectTypeState, setEffectTypeState] = useState<EffectType>("off");
  const effectTypeRef = useRef(effectTypeState);

  const bodyPixNetRef = useRef<bodyPix.BodyPix | null>(null);
  const bodyPixNet = bodyPixNetRef.current;

  const [loading, setLoading] = useState(false);

  // bodypix
  const [architecture, setArchitecture] = useState<ModelConfig["architecture"]>("MobileNetV1");
  const [outputStride, setOutputStride] = useState<ModelConfig["outputStride"]>(16);
  const [multiplier, setMultiplier] = useState<NonNullable<ModelConfig["multiplier"]>>(1.0);
  const [quantBytes, setQuantBytes] = useState<NonNullable<ModelConfig["quantBytes"]>>(4);

  // segmentPerson
  const [internalResolutionState, setInternalResolutionState] = useState(0.5);
  const internalResolutionRef = useRef(internalResolutionState);

  const [segmentationThresholdState, setSegmentationThresholdState] = useState(0.7);
  const segmentationThresholdRef = useRef(segmentationThresholdState);

  const [maxDetectionsState, setMaxDetectionsState] = useState(10);
  const maxDetectionsRef = useRef(maxDetectionsState);

  const [scoreThresholdState, setScoreThresholdState] = useState(0.3);
  const scoreThresholdRef = useRef(scoreThresholdState);

  const [nmsRadiusState, setNmsRadiusState] = useState(20);
  const nmsRadiusRef = useRef(nmsRadiusState);

  // effect
  const [backgroundBlurAmountState, setBackgroundBlurAmountState] = useState(3);
  const backgroundBlurAmountRef = useRef(backgroundBlurAmountState);

  const [edgeBlurAmountState, setEdgeBlurAmountState] = useState(3);
  const edgeBlurAmountRef = useRef(edgeBlurAmountState);

  const [maskBlurAmountState, setMaskBlurAmountState] = useState(0);
  const maskBlurAmountRef = useRef(maskBlurAmountState);

  const [opacityState, setOpacity] = useState(0.7);
  const opacityRef = useRef(opacityState);

  const [flipHorizontalState, setFlipHorizontalState] = useState(false);
  const flipHorizontalRef = useRef(flipHorizontalState);

  const [foregroundColorState, setForegroundColorState] = useState({ r: 0, g: 0, b: 0, a: 0 });
  const foregroundColorRef = useRef(foregroundColorState);

  const [backgroundColorState, setBackgroundColorState] = useState({ r: 0, g: 0, b: 0, a: 255 });
  const backgroundColorRef = useRef(backgroundColorState);

  const hasMediaStream = useMemo(() => mediaStreamState !== null, [mediaStreamState]);

  const architectureOptions: { text: typeof architecture; value: typeof architecture }[] = useMemo(
    () => [
      { value: "ResNet50", text: "ResNet50" },
      { value: "MobileNetV1", text: "MobileNetV1" },
    ],
    [],
  );

  const quantBytesOptions: { text: typeof quantBytes; value: typeof quantBytes }[] = useMemo(
    () => [
      { value: 4, text: 4 },
      { value: 2, text: 2 },
      { value: 1, text: 1 },
    ],
    [],
  );

  // for react-color
  const backgroundColorValue = useMemo(() => {
    const { r, g, b, a } = backgroundColorState;
    return { r, g, b, a: Math.round((a / 255) * 100) / 100 };
  }, [backgroundColorState]);

  const foregroundColorValue = useMemo(() => {
    const { r, g, b, a } = foregroundColorState;
    return { r, g, b, a: Math.round((a / 255) * 100) / 100 };
  }, [foregroundColorState]);

  const segmentPerson = async () => {
    if (bodyPixNet && video) {
      return await bodyPixNet.segmentPerson(video, {
        internalResolution: internalResolutionRef.current,
        segmentationThreshold: segmentationThresholdRef.current,
        maxDetections: maxDetectionsRef.current,
        scoreThreshold: scoreThresholdRef.current,
        nmsRadius: nmsRadiusRef.current,
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
    if (canvas && video && segmentation) {
      bodyPix.drawBokehEffect(
        canvas,
        video,
        segmentation,
        backgroundBlurAmountRef.current,
        edgeBlurAmountRef.current,
        flipHorizontalRef.current,
      );
    }
  };

  const drawMask = async () => {
    const segmentation = await segmentPerson();
    if (canvas && video && segmentation) {
      const backgroundDarkeningMask = bodyPix.toMask(
        segmentation,
        foregroundColorRef.current,
        backgroundColorRef.current,
      );
      bodyPix.drawMask(
        canvas,
        video,
        backgroundDarkeningMask,
        opacityRef.current,
        maskBlurAmountRef.current,
        flipHorizontalRef.current,
      );
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

  const startVideo = async () => {
    setLoading(true);

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width,
        height,
      },
      audio: false, // TODO
    });
    setMediaStream(mediaStream);

    if (video) {
      video.srcObject = mediaStream;
      video.onloadeddata = async () => {
        await renderCanvas();
        setLoading(false);
      };
    }
  };

  const stopVideo = () => {
    mediaStreamState?.getTracks().forEach((track) => track.stop());
    setMediaStream(null);
    if (video) {
      video.onloadeddata = null;
    }
  };

  const setEffectType = (effectType: typeof effectTypeState) => {
    effectTypeRef.current = effectType;
    setEffectTypeState(effectType);
  };

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

  const handleChangeInternalResolution = (internalResolution: typeof internalResolutionState) => {
    setInternalResolutionState(internalResolution);
    internalResolutionRef.current = internalResolution;
  };

  const handleChangeSegmentationThreshold = (segmentationThreshold: typeof segmentationThresholdState) => {
    setSegmentationThresholdState(segmentationThreshold);
    segmentationThresholdRef.current = segmentationThreshold;
  };

  const handleChangeMaxDetections = (maxDetections: typeof maxDetectionsState) => {
    setMaxDetectionsState(maxDetections);
    maxDetectionsRef.current = maxDetections;
  };

  const handleChangeScoreThreshold = (scoreThreshold: typeof scoreThresholdState) => {
    setScoreThresholdState(scoreThreshold);
    scoreThresholdRef.current = scoreThreshold;
  };

  const handleChangeNmsRadius = (nmsRadius: typeof nmsRadiusState) => {
    setNmsRadiusState(nmsRadius);
    nmsRadiusRef.current = nmsRadius;
  };

  const handleChangeBackgroundBlurAmount = (backgroundBlurAmount: typeof backgroundBlurAmountState) => {
    setBackgroundBlurAmountState(backgroundBlurAmount);
    backgroundBlurAmountRef.current = backgroundBlurAmount;
  };

  const handleChangeEdgeBlurAmount = (edgeBlurAmount: typeof edgeBlurAmountState) => {
    setEdgeBlurAmountState(edgeBlurAmount);
    edgeBlurAmountRef.current = edgeBlurAmount;
  };

  const handleChangeFlipHorizontal = (flipHorizontal: typeof flipHorizontalState) => {
    setFlipHorizontalState(flipHorizontal);
    flipHorizontalRef.current = flipHorizontal;
  };

  const handleChangeBackgroundColor = (backgroundColor: typeof backgroundColorState) => {
    setBackgroundColorState(backgroundColor);
    backgroundColorRef.current = backgroundColor;
  };

  const handleChangeForegroundColor = (foregroundColor: typeof foregroundColorState) => {
    setForegroundColorState(foregroundColor);
    foregroundColorRef.current = foregroundColor;
  };

  const handleChangeOpacity = (opacity: typeof opacityState) => {
    setOpacity(opacity);
    opacityRef.current = opacity;
  };

  const handleChangeMaskBlurAmount = (maskBlurAmount: typeof maskBlurAmountState) => {
    setMaskBlurAmountState(maskBlurAmount);
    maskBlurAmountRef.current = maskBlurAmount;
  };

  return {
    width,
    height,
    videoRef,
    canvasRef,
    loading,
    hasMediaStream,
    effectTypeState,
    architecture,
    architectureOptions,
    quantBytes,
    quantBytesOptions,
    internalResolutionState,
    segmentationThresholdState,
    maxDetectionsState,
    scoreThresholdState,
    nmsRadiusState,
    backgroundBlurAmountState,
    edgeBlurAmountState,
    flipHorizontalState,
    backgroundColorState,
    backgroundColorValue,
    foregroundColorState,
    foregroundColorValue,
    opacityState,
    maskBlurAmountState,
    startVideo,
    stopVideo,
    handleChangeArchitecture,
    handleChangeQuantBytes,
    handleChangeEffectType,
    handleChangeInternalResolution,
    handleChangeSegmentationThreshold,
    handleChangeMaxDetections,
    handleChangeScoreThreshold,
    handleChangeNmsRadius,
    handleChangeBackgroundBlurAmount,
    handleChangeEdgeBlurAmount,
    handleChangeFlipHorizontal,
    handleChangeBackgroundColor,
    handleChangeForegroundColor,
    handleChangeOpacity,
    handleChangeMaskBlurAmount,
  };
};
