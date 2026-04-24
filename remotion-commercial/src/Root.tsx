import React from 'react';
import {Composition} from 'remotion';
import {CareerVividCommercial} from './commercial/CareerVividCommercial';
import {JiawenResumeVideo} from './commercial/JiawenResumeVideo';
import {JiawenNeoBrutal} from './commercial/JiawenNeoBrutal';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CareerVividCommercial"
        component={CareerVividCommercial}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="JiawenResumeVideo"
        component={JiawenResumeVideo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="JiawenNeoBrutal"
        component={JiawenNeoBrutal}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
