import { Flex } from 'rebass';
import styled from 'styled-components';

const Wrapper = styled(Flex)`
  width: ${({ width }) => `${width ?? 115}px`};
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-color: ${({ theme }) => theme.text10};
  border-radius: 6px
  padding: 3px;
`;

const PollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.green1};
`;

const InlineLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export { Wrapper, PollingDot, InlineLink };
