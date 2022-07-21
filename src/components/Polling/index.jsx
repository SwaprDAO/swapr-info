import React from 'react';

import { Typography } from '../../Theme';
import { useSessionStart } from '../../contexts/Application';
import { InlineLink, PollingDot, Wrapper } from './styled';

const Polling = () => {
  const seconds = useSessionStart();

  return (
    <Wrapper width="120">
      <InlineLink href="/">
        <Typography.SmallText sx={{ marginRight: '6px' }} color={'text10'}>
          Updated
        </Typography.SmallText>
        <Typography.SmallText
          sx={{ marginRight: '6px', fontFeatureSettings: '"tnum", "zero", "ss01"' }}
          color={'green1'}
        >
          {seconds ?? '-'}s ago
        </Typography.SmallText>
        <PollingDot />
      </InlineLink>
    </Wrapper>
  );
};

export default Polling;
