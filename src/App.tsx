import { css } from "@emotion/react";
import React from "react";
import { AlphaPicker, CompactPicker } from "react-color";
import { Checkbox, Container, Divider, Dropdown, Header, Input, Segment, Table } from "semantic-ui-react";

import { BodyPixControl } from "./BodyPixControl";

const App: React.VFC = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const [bodyPixControl] = React.useState(new BodyPixControl(videoRef, canvasRef));
  const [, setReRender] = React.useState(0);

  const triggerReRender = () => {
    setReRender((prev) => prev + 1);
  };

  const handleChangeBodyPix = async (bodyPixType: BodyPixControl["bodyPixType"]) => {
    await bodyPixControl.handleChangeBodyPixType(bodyPixType);
    triggerReRender();
  };

  const {
    hasMediaStream,
    quantBytes,
    quantBytesOptions,
    bodyPixType,
    width,
    height,
    internalResolution,
    segmentationThreshold,
    maxDetections,
    scoreThreshold,
    nmsRadius,
    backgroundBlurAmount,
    edgeBlurAmount,
    flipHorizontal,
    maskBlurAmount,
    opacity,
    backgroundColor,
    backgroundColorValue,
    foregroundColor,
    foregroundColorValue,
  } = bodyPixControl;

  return (
    <Container
      text
      css={css`
        &&& {
          padding: 12px 0 64px;
        }
      `}
    >
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
        <Checkbox
          toggle
          checked={hasMediaStream}
          label="Video"
          onChange={async () => {
            await bodyPixControl.handleChangeVideo();
            triggerReRender();
          }}
          css={css`
            &&& {
              display: block;
              margin-bottom: 12px;
            }
          `}
        />
        <video ref={videoRef} width={width} height={height} autoPlay hidden />
        <canvas ref={canvasRef} width={width} height={height} />
      </Segment>

      <Segment>
        <Header content="BodyPix Setting" />
        <Table celled striped unstackable>
          <Table.Body>
            <Table.Row>
              <Table.Cell>quantBytes</Table.Cell>
              <Table.Cell>
                <Dropdown
                  selection
                  compact
                  value={quantBytes}
                  options={quantBytesOptions}
                  onChange={async (e, d) => {
                    await bodyPixControl.setQuantBytes(d.value as typeof quantBytes);
                    triggerReRender();
                  }}
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
                  value={internalResolution}
                  onChange={(e) => {
                    bodyPixControl.setIternalResolution(Number(e.target.value));
                    triggerReRender();
                  }}
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
                  value={segmentationThreshold}
                  onChange={(e) => {
                    bodyPixControl.setSegmentationThreshold(Number(e.target.value));
                    triggerReRender();
                  }}
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
                  value={maxDetections}
                  onChange={(e) => {
                    bodyPixControl.setMaxDetections(Number(e.target.value));
                    triggerReRender();
                  }}
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
                  value={scoreThreshold}
                  onChange={(e) => {
                    bodyPixControl.setScoreThreshold(Number(e.target.value));
                    triggerReRender();
                  }}
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
                  value={nmsRadius}
                  onChange={(e) => {
                    bodyPixControl.setNmsRadius(Number(e.target.value));
                    triggerReRender();
                  }}
                />
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>

      <Segment>
        <Header content="BodyPix Effect" />

        <div>
          <Checkbox
            radio
            checked={bodyPixType === "off"}
            label="Off"
            onChange={() => handleChangeBodyPix("off")}
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
            checked={bodyPixType === "bokeh"}
            label="Bokeh"
            onChange={() => handleChangeBodyPix("bokeh")}
            css={css`
              &&& {
                display: block;
              }
            `}
          />
          {bodyPixType === "bokeh" && (
            <Table celled striped unstackable>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>backgroundBlurAmount</Table.Cell>
                  <Table.Cell>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={backgroundBlurAmount}
                      onChange={(e) => {
                        bodyPixControl.setBackgroundBlurAmount(Number(e.target.value));
                        triggerReRender();
                      }}
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
                      value={edgeBlurAmount}
                      onChange={(e) => {
                        bodyPixControl.setEdgeBlurAmount(Number(e.target.value));
                        triggerReRender();
                      }}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>flipHorizontal</Table.Cell>
                  <Table.Cell>
                    <Checkbox
                      toggle
                      checked={flipHorizontal}
                      onChange={async () => {
                        bodyPixControl.setFlipHorizontal(!flipHorizontal);
                        triggerReRender();
                      }}
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
            checked={bodyPixType === "colorMask"}
            label="ColorMask"
            onChange={() => handleChangeBodyPix("colorMask")}
            css={css`
              &&& {
                display: block;
              }
            `}
          />
          {bodyPixType === "colorMask" && (
            <Table celled striped unstackable>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>backgroundColor</Table.Cell>
                  <Table.Cell>
                    <CompactPicker
                      color={backgroundColorValue}
                      onChange={({ rgb: { r, g, b } }) => {
                        bodyPixControl.setBackgroundColor({ r, g, b, a: backgroundColor.a });
                        triggerReRender();
                      }}
                    />
                    <AlphaPicker
                      color={backgroundColorValue}
                      onChange={({ rgb: { r, g, b, a } }) => {
                        bodyPixControl.setBackgroundColor({ r, g, b, a: Math.round((a ?? 1) * 255) });
                        triggerReRender();
                      }}
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
                      onChange={({ rgb: { r, g, b } }) => {
                        bodyPixControl.setForegroundColor({ r, g, b, a: foregroundColor.a });
                        triggerReRender();
                      }}
                    />
                    <AlphaPicker
                      color={foregroundColorValue}
                      onChange={({ rgb: { r, g, b, a } }) => {
                        bodyPixControl.setForegroundColor({ r, g, b, a: Math.round((a ?? 1) * 255) });
                        triggerReRender();
                      }}
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
                      value={opacity}
                      onChange={(e) => {
                        bodyPixControl.setOpacity(Number(e.target.value));
                        triggerReRender();
                      }}
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
                      value={maskBlurAmount}
                      onChange={(e) => {
                        bodyPixControl.setMaskBlurAmount(Number(e.target.value));
                        triggerReRender();
                      }}
                    />
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell>flipHorizontal</Table.Cell>
                  <Table.Cell>
                    <Checkbox
                      toggle
                      checked={flipHorizontal}
                      onChange={async () => {
                        bodyPixControl.setFlipHorizontal(!flipHorizontal);
                        triggerReRender();
                      }}
                    />
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          )}
        </div>
      </Segment>
    </Container>
  );
};

export default App;
