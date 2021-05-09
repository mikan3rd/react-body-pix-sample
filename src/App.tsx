import { css } from "@emotion/react";
import React from "react";
import { AlphaPicker, CompactPicker } from "react-color";
import { Checkbox, Container, Divider, Input, Segment, Table } from "semantic-ui-react";

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
    bodyPixType,
    width,
    height,
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
    <Container text>
      <div
        css={css`
          margin-top: 12px;
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
        />
      </div>

      <Segment>
        <div>
          <Checkbox radio checked={bodyPixType === "off"} label="Off" onChange={() => handleChangeBodyPix("off")} />
        </div>

        <Divider />

        <div>
          <Checkbox
            radio
            checked={bodyPixType === "bokeh"}
            label="Bokeh"
            onChange={() => handleChangeBodyPix("bokeh")}
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

      <Segment>
        <video ref={videoRef} width={width} height={height} autoPlay hidden />
        <canvas ref={canvasRef} width={width} height={height} />
      </Segment>
    </Container>
  );
};

export default App;
