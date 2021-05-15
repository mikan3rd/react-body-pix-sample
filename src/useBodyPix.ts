import "@tensorflow/tfjs";
import * as bodyPix from "@tensorflow-models/body-pix";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
  }
}

type ModelConfig = NonNullable<Parameters<typeof bodyPix.load>[0]>;
type EffectType = "off" | "bokeh" | "colorMask";

export const useBodyPix = () => {
  const [width] = useState(160);
  const [height] = useState(120);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const isMountedRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // const canvasElement = document.createElement("canvas");
  // canvasElement.width = width;
  // canvasElement.height = height;
  // const canvasRef = useRef(canvasElement);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const [mediaStreamState, setMediaStreamState] = useState<MediaStream | null>(null);
  const mediaStreamRef = useRef(mediaStreamState);

  const [effectTypeState, setEffectTypeState] = useState<EffectType>("off");
  const effectTypeRef = useRef(effectTypeState);

  const bodyPixNetRef = useRef<bodyPix.BodyPix | null>(null);

  const [loading, setLoading] = useState(false);

  // bodypix
  const [architecture, setArchitecture] = useState<ModelConfig["architecture"]>("MobileNetV1");
  const [outputStride] = useState<ModelConfig["outputStride"]>(16);
  const [multiplier] = useState<NonNullable<ModelConfig["multiplier"]>>(1.0);
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
    const bodyPixNet = bodyPixNetRef.current;
    const video = videoRef.current;
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (video) {
      ctx?.drawImage(video, 0, 0);
    }
  };

  const drawBokeh = async () => {
    const segmentation = await segmentPerson();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (segmentation && video && canvas) {
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

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (segmentation && video && canvas) {
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

    console.log("!!!");

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

  const getUserMedia = async (mediaStreamConstraints: MediaStreamConstraints) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Browser API navigator.mediaDevices.getUserMedia not available");
      return;
    }
    return await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
  };

  const stopVideoTrack = (mediaStream: MediaStream) => {
    mediaStream.getTracks().forEach((track) => track.stop());
  };

  const requestDevicePermission = useCallback(async () => {
    const mediaStream = await getUserMedia({ video: true, audio: true });
    if (!mediaStream) {
      return;
    }
    stopVideoTrack(mediaStream);
  }, []);

  const setCurrentDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      alert("enumerateDevices() not supported.");
      return;
    }

    const nextDevices = await navigator.mediaDevices.enumerateDevices();
    setDevices(nextDevices);
    console.log(nextDevices); // TODO
  }, []);

  const setMediaStream = (mediaStream: typeof mediaStreamState) => {
    mediaStreamRef.current = mediaStream;
    setMediaStreamState(mediaStream);
  };

  const startVideo = async () => {
    setLoading(true);

    const mediaStream = await getUserMedia({
      video: {
        width,
        height,
      },
      audio: false, // TODO
    });

    if (!mediaStream) {
      setLoading(false);
      return;
    }

    setMediaStream(mediaStream);

    const video = videoRef.current;
    if (video) {
      video.onloadeddata = async () => {
        await renderCanvas();
        setLoading(false);
      };
      video.srcObject = mediaStream;
    }

    const canvas = canvasRef.current;
    const previewVideo = previewVideoRef.current;
    if (canvas && previewVideo) {
      const canvasStream = canvas.captureStream();
      console.log({ canvasStream });
      previewVideo.srcObject = canvasStream;
    }
  };

  const stopVideo = () => {
    if (mediaStreamState) {
      stopVideoTrack(mediaStreamState);
    }

    setMediaStream(null);

    const video = videoRef.current;
    if (video) {
      video.onloadeddata = null;
    }
  };

  const setEffectType = (effectType: typeof effectTypeState) => {
    effectTypeRef.current = effectType;
    setEffectTypeState(effectType);
  };

  const loadBodyPix = useCallback(async () => {
    setLoading(true);

    bodyPixNetRef.current = await bodyPix.load({
      architecture,
      outputStride,
      multiplier,
      quantBytes,
    });

    setLoading(false);
  }, [architecture, multiplier, outputStride, quantBytes]);

  const handleChangeEffectType = async (effectType: typeof effectTypeState) => {
    const bodyPixNet = bodyPixNetRef.current;
    if (effectType !== "off" && !bodyPixNet) {
      await loadBodyPix();
    }
    setEffectType(effectType);
  };

  const handleChangeArchitecture = async (nextArchitecture: typeof architecture) => {
    setArchitecture(nextArchitecture);
  };

  const handleChangeQuantBytes = async (nextQuantBytes: typeof quantBytes) => {
    setQuantBytes(nextQuantBytes);
  };

  const handleChangeInternalResolution = (internalResolution: typeof internalResolutionState) => {
    internalResolutionRef.current = internalResolution;
    setInternalResolutionState(internalResolution);
  };

  const handleChangeSegmentationThreshold = (segmentationThreshold: typeof segmentationThresholdState) => {
    segmentationThresholdRef.current = segmentationThreshold;
    setSegmentationThresholdState(segmentationThreshold);
  };

  const handleChangeMaxDetections = (maxDetections: typeof maxDetectionsState) => {
    maxDetectionsRef.current = maxDetections;
    setMaxDetectionsState(maxDetections);
  };

  const handleChangeScoreThreshold = (scoreThreshold: typeof scoreThresholdState) => {
    scoreThresholdRef.current = scoreThreshold;
    setScoreThresholdState(scoreThreshold);
  };

  const handleChangeNmsRadius = (nmsRadius: typeof nmsRadiusState) => {
    nmsRadiusRef.current = nmsRadius;
    setNmsRadiusState(nmsRadius);
  };

  const handleChangeBackgroundBlurAmount = (backgroundBlurAmount: typeof backgroundBlurAmountState) => {
    backgroundBlurAmountRef.current = backgroundBlurAmount;
    setBackgroundBlurAmountState(backgroundBlurAmount);
  };

  const handleChangeEdgeBlurAmount = (edgeBlurAmount: typeof edgeBlurAmountState) => {
    edgeBlurAmountRef.current = edgeBlurAmount;
    setEdgeBlurAmountState(edgeBlurAmount);
  };

  const handleChangeFlipHorizontal = (flipHorizontal: typeof flipHorizontalState) => {
    flipHorizontalRef.current = flipHorizontal;
    setFlipHorizontalState(flipHorizontal);
  };

  const handleChangeBackgroundColor = (backgroundColor: typeof backgroundColorState) => {
    backgroundColorRef.current = backgroundColor;
    setBackgroundColorState(backgroundColor);
  };

  const handleChangeForegroundColor = (foregroundColor: typeof foregroundColorState) => {
    foregroundColorRef.current = foregroundColor;
    setForegroundColorState(foregroundColor);
  };

  const handleChangeOpacity = (opacity: typeof opacityState) => {
    opacityRef.current = opacity;
    setOpacity(opacity);
  };

  const handleChangeMaskBlurAmount = (maskBlurAmount: typeof maskBlurAmountState) => {
    maskBlurAmountRef.current = maskBlurAmount;
    setMaskBlurAmountState(maskBlurAmount);
  };

  useEffect(() => {
    if (isMountedRef.current) {
      loadBodyPix();
    } else {
      isMountedRef.current = true;
    }
  }, [architecture, outputStride, multiplier, quantBytes, loadBodyPix]);

  useEffect(() => {
    const setFirstDevices = async () => {
      await requestDevicePermission();
      await setCurrentDevices();
    };

    setFirstDevices();
  }, [requestDevicePermission, setCurrentDevices]);

  useEffect(() => {
    // Safariの場合、 ondevicechange に渡す関数内で getUserMedia() を呼ぶと無限ループする不具合があるため注意
    navigator.mediaDevices.ondevicechange = setCurrentDevices;
    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, [setCurrentDevices]);

  return {
    width,
    height,
    devices,
    videoRef,
    canvasRef,
    previewVideoRef,
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
