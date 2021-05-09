import { css } from "@emotion/react";
import React from "react";
import { Checkbox, Container, Input, Segment } from "semantic-ui-react";

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

  const { hasMediaStream, bodyPixType, width, height, backgroundBlurAmount } = bodyPixControl;

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
      <Segment
        css={css`
          margin-top: 12px;
        `}
      >
        <div>
          <Checkbox radio checked={bodyPixType === "off"} label="Off" onChange={() => handleChangeBodyPix("off")} />
        </div>
        <div
          css={css`
            margin-top: 12px;
          `}
        >
          <Checkbox
            radio
            checked={bodyPixType === "bokeh"}
            label="Bokeh"
            onChange={() => handleChangeBodyPix("bokeh")}
          />
          <div>
            <Input
              label="backgroundBlurAmount"
              type="number"
              min={0}
              max={20}
              value={backgroundBlurAmount}
              onChange={(e) => {
                bodyPixControl.setBackgroundBlurAmount(Number(e.target.value));
                triggerReRender();
              }}
            />
          </div>
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
