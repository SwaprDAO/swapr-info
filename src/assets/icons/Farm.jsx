import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  & > svg path {
    fill: ${({ theme, color }) => (color ? theme[color] : theme.green1)};
  }
`;

const Farms = ({ color, width, height }) => (
  <Wrapper color={color}>
    <svg width={width} height={height} viewBox={`0 0 16 17`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.792 6.82568C10.648 4.59368 9.744 2.41768 8.048 0.72168C6.336 2.43368 5.392 4.60968 5.208 6.82568C6.232 7.36968 7.176 8.07368 8 8.92968C8.824 8.08168 9.768 7.37768 10.792 6.82568ZM8.04 3.27368C8.544 4.09768 8.896 5.01768 9.08 5.97768C8.704 6.21768 8.352 6.48168 8.008 6.76168C7.672 6.48968 7.312 6.22568 6.944 5.98568C7.144 5.02568 7.512 4.10568 8.04 3.27368ZM8 11.4817C7.344 10.4817 6.512 9.60968 5.552 8.92168C5.448 8.84968 5.336 8.79368 5.232 8.71368C5.336 8.78568 5.448 8.84968 5.544 8.91368C3.984 7.78568 2.072 7.12168 0 7.12168C0 11.3777 2.688 14.9777 6.424 16.3137C6.928 16.4977 7.456 16.6337 8 16.7217C8.544 16.6257 9.064 16.4897 9.576 16.3137C13.312 14.9777 16 11.3777 16 7.12168C12.656 7.12168 9.72 8.85768 8 11.4817ZM9.056 14.8017C8.704 14.9217 8.352 15.0177 7.992 15.0977C7.64 15.0257 7.296 14.9297 6.968 14.8097C4.336 13.8657 2.408 11.6177 1.808 8.92968C2.688 9.13768 3.528 9.49768 4.304 9.99368L4.288 10.0017C4.392 10.0737 4.496 10.1457 4.6 10.2017L4.656 10.2337C5.448 10.8097 6.128 11.5217 6.664 12.3537L8 14.4017L9.336 12.3617C9.888 11.5217 10.576 10.8017 11.36 10.2337L11.416 10.1937C11.488 10.1537 11.56 10.1057 11.632 10.0577L11.624 10.0417C12.408 9.52168 13.28 9.13768 14.192 8.92168C13.592 11.6177 11.672 13.8657 9.056 14.8017ZM5.592 8.94568C5.576 8.93768 5.56 8.92168 5.552 8.91368C5.552 8.91368 5.56 8.91368 5.56 8.92168C5.568 8.92968 5.576 8.93768 5.592 8.94568Z" />
    </svg>
  </Wrapper>
);

Farms.defaultProps = {
  color: 'text1',
  width: 16,
  height: 17,
};

Farms.propTypes = {
  color: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default Farms;