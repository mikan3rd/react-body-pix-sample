import { css } from "@emotion/react";
import React from "react";
import { AlphaPicker, CompactPicker } from "react-color";
import {
  Checkbox,
  Container,
  Dimmer,
  Divider,
  Dropdown,
  Header,
  Input,
  Loader,
  Segment,
  Table,
} from "semantic-ui-react";

import { useBodyPix } from "./useBodyPix";
import { useMediaRecorder } from "./useMediaRecorder";
import { useScreenShare } from "./useScreehShare";

const App: React.VFC = () => {
  const {
    width,
    height,
    videoDeviceId,
    audioDeviceId,
    videoDeviceOptions,
    audioDeviceOptions,
    videoRef,
    canvasRef,
    previewVideoRef,
    loading,
    effectTypeState,
    canvasMediaStreamState,
    hasMediaStream,
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
    setVideoDeviceId,
    setAudioDeviceId,
    startVideo,
    stopVideo,
    handleChangeEffectType,
    handleChangeArchitecture,
    handleChangeQuantBytes,
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
  } = useBodyPix();

  const { canRecord, isRecording, startMediaRecord, stopMediaRecord } = useMediaRecorder();

  const { hasDisplayMediaStream, screenShareVideoRef, startScreenShare, stopScreenShare } = useScreenShare();

  const handleToggleVideo = async () => {
    if (hasMediaStream) {
      stopVideo();
    } else {
      await startVideo();
    }
  };

  const handleToggleMediaRecord = () => {
    if (isRecording) {
      stopMediaRecord();
    } else {
      if (canvasMediaStreamState) {
        startMediaRecord(canvasMediaStreamState);
      } else {
        alert("Please start video");
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (hasDisplayMediaStream) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  return (
    <Container
      text
      css={css`
        &&& {
          padding: 12px 0 64px;
        }
      `}
    >
      <Segment>
        <Dropdown
          labeled
          button
          className="icon"
          icon="video"
          value={videoDeviceId}
          options={videoDeviceOptions}
          onChange={async (e, d) => setVideoDeviceId(d.value as string)}
          css={css`
            &&& {
              display: block;
            }
          `}
        />
        <Dropdown
          labeled
          button
          className="icon"
          icon="microphone"
          value={audioDeviceId}
          options={audioDeviceOptions}
          onChange={async (e, d) => setAudioDeviceId(d.value as string)}
          css={css`
            &&& {
              display: block;
              margin-top: 8px;
            }
          `}
        />
        <Checkbox
          toggle
          checked={hasMediaStream}
          label="Display Video"
          onChange={handleToggleVideo}
          css={css`
            &&& {
              display: block;
              margin-top: 8px;
            }
          `}
        />
        {canRecord && (
          <Checkbox
            toggle
            checked={isRecording}
            disabled={!hasMediaStream}
            label="Record Video"
            onChange={handleToggleMediaRecord}
            css={css`
              &&& {
                display: block;
                margin-top: 8px;
              }
            `}
          />
        )}

        <Checkbox
          toggle
          checked={hasDisplayMediaStream}
          label="Screen Share"
          onChange={handleToggleScreenShare}
          css={css`
            &&& {
              display: block;
              margin-top: 8px;
            }
          `}
        />
      </Segment>

      <Segment
        css={css`
          &&& {
            position: sticky;
            top: 0;
            z-index: 10;
            background-color: white;
          }
        `}
      >
        <div
          css={css`
            position: relative;
            width: ${width}px;
            height: ${height}px;
          `}
        >
          {/* iOSの場合にhiddenなどの非表示要素だとvideoを再生できないため */}
          <video
            ref={videoRef}
            width={width}
            height={height}
            autoPlay
            muted
            playsInline
            css={css`
              position: absolute;
              top: 0;
              left: 0;
            `}
          />
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            css={css`
              position: absolute;
              top: 0;
              left: 0;
            `}
          />
          <video
            ref={previewVideoRef}
            width={width}
            height={height}
            autoPlay
            muted
            playsInline
            hidden
            css={css`
              position: absolute;
              top: 0;
              left: 0;
            `}
          />
        </div>

        <Dimmer active={loading}>
          <Loader />
        </Dimmer>
      </Segment>

      <Segment>
        <video
          ref={screenShareVideoRef}
          autoPlay
          muted
          playsInline
          css={css`
            width: 100%;
          `}
        />
      </Segment>

      <Segment>
        <Header content="BodyPix Effect" />

        <div>
          <Checkbox
            radio
            checked={effectTypeState === "off"}
            label="Off"
            onChange={() => handleChangeEffectType("off")}
            css={css`
              &&& {
                display: block;
              }
            `}
          />
        </div>

        <Divider />

        <div>
          <Checkbox
            radio
            checked={effectTypeState === "bokeh"}
            label="Bokeh"
            onChange={() => handleChangeEffectType("bokeh")}
            css={css`
              &&& {
                display: block;
              }
            `}
          />
          {effectTypeState === "bokeh" && (
            <Table celled striped unstackable>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>backgroundBlurAmount</Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={backgroundBlurAmountState}
                      onChange={(e) => handleChangeBackgroundBlurAmount(Number(e.target.value))}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>edgeBlurAmount</Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={edgeBlurAmountState}
                      onChange={(e) => handleChangeEdgeBlurAmount(Number(e.target.value))}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>flipHorizontal</Table.Cell>
                  <Table.Cell>
                    <Checkbox
                      toggle
                      checked={flipHorizontalState}
                      onChange={async () => handleChangeFlipHorizontal(!flipHorizontalState)}
                    />
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          )}
        </div>

        <Divider />

        <div>
          <Checkbox
            radio
            checked={effectTypeState === "colorMask"}
            label="ColorMask"
            onChange={() => handleChangeEffectType("colorMask")}
            css={css`
              &&& {
                display: block;
              }
            `}
          />
          {effectTypeState === "colorMask" && (
            <Table celled striped unstackable>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>backgroundColor</Table.Cell>
                  <Table.Cell>
                    <CompactPicker
                      color={backgroundColorValue}
                      onChange={({ rgb: { r, g, b } }) =>
                        handleChangeBackgroundColor({ r, g, b, a: backgroundColorState.a })
                      }
                    />
                    <AlphaPicker
                      color={backgroundColorValue}
                      onChange={({ rgb: { r, g, b, a } }) =>
                        handleChangeBackgroundColor({ r, g, b, a: Math.round((a ?? 1) * 255) })
                      }
                      css={css`
                        margin-top: 12px;
                      `}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>foregroundColor</Table.Cell>
                  <Table.Cell>
                    <CompactPicker
                      color={foregroundColorValue}
                      onChange={({ rgb: { r, g, b } }) =>
                        handleChangeForegroundColor({ r, g, b, a: foregroundColorState.a })
                      }
                    />
                    <AlphaPicker
                      color={foregroundColorValue}
                      onChange={({ rgb: { r, g, b, a } }) =>
                        handleChangeForegroundColor({ r, g, b, a: Math.round((a ?? 1) * 255) })
                      }
                      css={css`
                        margin-top: 12px;
                      `}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>opacity</Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step="0.1"
                      value={opacityState}
                      onChange={(e) => handleChangeOpacity(Number(e.target.value))}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>maskBlurAmount</Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={maskBlurAmountState}
                      onChange={(e) => handleChangeMaskBlurAmount(Number(e.target.value))}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>flipHorizontal</Table.Cell>
                  <Table.Cell>
                    <Checkbox
                      toggle
                      checked={flipHorizontalState}
                      onChange={async () => handleChangeFlipHorizontal(!flipHorizontalState)}
                    />
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          )}
        </div>
      </Segment>

      <Segment>
        <Header content="BodyPix Setting" />
        <Table celled striped unstackable>
          <Table.Body>
            <Table.Row>
              <Table.Cell>architecture</Table.Cell>
              <Table.Cell>
                <Dropdown
                  selection
                  compact
                  value={architecture}
                  options={architectureOptions}
                  onChange={async (e, d) => await handleChangeArchitecture(d.value as typeof architecture)}
                />
              </Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>quantBytes</Table.Cell>
              <Table.Cell>
                <Dropdown
                  selection
                  compact
                  value={quantBytes}
                  options={quantBytesOptions}
                  onChange={async (e, d) => await handleChangeQuantBytes(d.value as typeof quantBytes)}
                />
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>

      <Segment>
        <Header content="Segment Setting" />
        <Table celled striped unstackable>
          <Table.Body>
            <Table.Row>
              <Table.Cell>internalResolution</Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step="0.05"
                  value={internalResolutionState}
                  onChange={(e) => handleChangeInternalResolution(Number(e.target.value))}
                />
              </Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>segmentationThreshold</Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step="0.05"
                  value={segmentationThresholdState}
                  onChange={(e) => handleChangeSegmentationThreshold(Number(e.target.value))}
                />
              </Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>maxDetections</Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxDetectionsState}
                  onChange={(e) => handleChangeMaxDetections(Number(e.target.value))}
                />
              </Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>scoreThreshold</Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step="0.05"
                  value={scoreThresholdState}
                  onChange={(e) => handleChangeScoreThreshold(Number(e.target.value))}
                />
              </Table.Cell>
            </Table.Row>

            <Table.Row>
              <Table.Cell>nmsRadius</Table.Cell>
              <Table.Cell>
                <Input
                  type="number"
                  min={1}
                  max={40}
                  value={nmsRadiusState}
                  onChange={(e) => handleChangeNmsRadius(Number(e.target.value))}
                />
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>
    </Container>
  );
};

export default App;
