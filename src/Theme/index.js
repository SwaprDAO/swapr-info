import 'inter-ui';
import React from 'react';
import { Text } from 'rebass';
import styled, { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle } from 'styled-components';

import { useDarkModeManager } from '../contexts/LocalStorage';

export default function ThemeProvider({ children }) {
  const [darkMode] = useDarkModeManager();

  return <StyledComponentsThemeProvider theme={theme(darkMode)}>{children}</StyledComponentsThemeProvider>;
}

const theme = (darkMode, color) => ({
  customColor: color,
  textColor: darkMode ? color : 'black',

  panelColor: darkMode ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 0)',
  backgroundColor: darkMode ? '#212429' : '#F7F8FA',

  swaprPurple: darkMode ? '#4526A2' : 'black',

  concreteGray: darkMode ? '#292C2F' : '#FAFAFA',
  inputBackground: darkMode ? '#1F1F1F' : '#FAFAFA',
  shadowColor: darkMode ? '#000' : '#2F80ED',
  mercuryGray: darkMode ? '#333333' : '#E1E1E1',

  text1: darkMode ? '#FAFAFA' : '#1F1F1F',
  text2: darkMode ? '#C3C5CB' : '#565A69',
  text3: darkMode ? '#6C7284' : '#888D9B',
  text4: darkMode ? '#565A69' : '#C3C5CB',
  text5: darkMode ? '#2C2F36' : '#EDEEF2',
  text6: darkMode ? '#C0BAF7' : '',
  text7: darkMode ? '#8780BF' : '',
  text8: darkMode ? '#BCB3F0' : '#A7A0E4',
  text9: darkMode ? '#EBE9F8' : '#464366',
  text10: darkMode ? '#C9C7DB' : '',

  swaprLink: '#8c6fff',
  loaderBase: '#2A2F42',
  loaderHighlight: '#3E4259',

  // special case text types
  white: '#FFFFFF',

  // backgrounds / greys
  bg1: darkMode ? '#0C0B11' : '#FAFAFA',
  bg2: darkMode ? '#2C2F36' : '#F7F8FA',
  bg3: darkMode ? '#40444F' : '#EDEEF2',
  bg4: darkMode ? '#565A69' : '#CED0D9',
  bg5: darkMode ? '#565A69' : '#888D9B',
  bg6: darkMode ? '#000' : '#FFFFFF',

  // borders
  bd1: darkMode ? '#464366' : '#464366',

  //specialty colors
  dropdownBg: darkMode ? 'rgba(104, 110, 148, 0.2)' : '',
  modalBG: darkMode ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
  advancedBG: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)',
  onlyLight: darkMode ? '#22242a' : 'transparent',
  divider: darkMode ? 'rgba(43, 43, 43, 0.435)' : 'rgba(43, 43, 43, 0.035)',

  //primary colors
  primary1: darkMode ? '#0D47A1' : '#2962FF',
  primary2: darkMode ? '#1976D2' : '#82B1FF',
  primary3: darkMode ? '#1E88E5' : '#438AFF',
  primary4: darkMode ? '#376bad70' : '#F6DDE8',
  primary5: darkMode ? '#153d6f70' : '#FDEAF1',

  // color text
  primaryText1: darkMode ? '#6da8ff' : '#4526A2',

  // secondary colors
  secondary1: darkMode ? '#2172E5' : '#4526A2',
  secondary2: darkMode ? '#17000b26' : '#F6DDE8',
  secondary3: darkMode ? '#17000b26' : '#FDEAF1',

  shadow1: darkMode ? '#000' : '#2F80ED',
  disabled: '#616161',

  // other
  red1: '#FF5252',
  orange1: '#f2994a',
  green1: '#75CAB5',
  yellow1: '#FFE270',
  yellow2: '#F3841E',
  link: '#0D47A1',
  blue: '#1976D2',

  background: darkMode ? 'black' : `radial-gradient(50% 50% at 50% 50%, #4526A2 0%, #fff 0%)`,
});

const TextWrapper = styled(Text)`
  color: ${({ color, theme }) => theme[color]};
`;

export const Typography = {
  Custom: ({ color, children, sx }) => (
    <TextWrapper color={color || 'text1'} sx={sx}>
      {children}
    </TextWrapper>
  ),

  TinyText: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={400}
      fontSize={'8px'}
      lineHeight={'10px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),
  SmallText: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={400}
      fontSize={10}
      lineHeight={'10px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),
  Text: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={400}
      fontSize={13}
      lineHeight={'16px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),
  LargeText: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={400}
      fontSize={14}
      lineHeight={'17px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),

  SmallHeader: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={400}
      fontSize={16}
      lineHeight={'19px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),
  LargeHeader: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={400}
      fontSize={24}
      lineHeight={'29px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),
  LargeBoldHeader: ({ color, children, sx, className }) => (
    <TextWrapper
      fontWeight={700}
      fontSize={24}
      lineHeight={'29px'}
      color={color || 'text1'}
      sx={sx}
      className={className}
    >
      {children}
    </TextWrapper>
  ),
};

export const TYPE = {
  main(props) {
    return <TextWrapper fontWeight={500} fontSize={14} color={'text1'} {...props} />;
  },

  body(props) {
    return <TextWrapper fontWeight={400} fontSize={14} color={'text1'} {...props} />;
  },

  small(props) {
    return <TextWrapper fontWeight={500} fontSize={11} color={'text1'} {...props} />;
  },

  header(props) {
    return <TextWrapper fontWeight={600} color="text1" {...props} />;
  },

  largeHeader(props) {
    return <TextWrapper fontWeight={500} color={'text1'} fontSize={24} {...props} />;
  },

  light(props) {
    return <TextWrapper fontWeight={400} color={'text3'} fontSize={14} {...props} />;
  },

  pink(props) {
    return <TextWrapper fontWeight={props.faded ? 400 : 600} color={props.faded ? 'text1' : 'text1'} {...props} />;
  },
};

export const Hover = styled.div`
  :hover {
    cursor: pointer;
  }
`;

export const Link = styled.a.attrs({
  target: '_blank',
  rel: 'noopener noreferrer',
})`
  text-decoration: none;
  cursor: pointer;
  color: ${({ theme }) => theme.primary1};
  font-weight: 500;
  :hover {
    text-decoration: underline;
  }
  :focus {
    outline: none;
    text-decoration: underline;
  }
  :active {
    text-decoration: none;
  }
`;

export const ThemedBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  max-width: 100vw !important;
  height: 200vh;
  mix-blend-mode: color;
  background: ${({ backgroundColor }) =>
    `radial-gradient(50% 50% at 50% 50%, ${backgroundColor} 0%, rgba(255, 255, 255, 0) 100%)`};
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 9999;

  transform: translateY(-110vh);
`;

export const GlobalStyle = createGlobalStyle`
  html { 
    font-family: "Inter", sans-serif;    
   -webkit-font-smoothing: antialiased;
  }

  @supports (font-variation-settings: normal) {
    html, input, textarea, button {
      font-family: 'Inter var', sans-serif;
      font-feature-settings: "zero","ss01";
    }
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-size: 14px;    
    background-color: ${({ theme }) => theme.bg1};

    scroll-behavior: smooth;
    overflow-y: overlay;
    overflow-x: hidden;

    ::-webkit-scrollbar {
      width: 10px;
      border-left: 1px solid rgba(255,255,255,0.2);
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background-color: #B6B5B7;
      border-radius: 100px;    
    }
  }

  
  a {
    text-decoration: none;

    :hover {
      text-decoration: none
    }
  }

  
.three-line-legend {
	width: 100%;
	height: 70px;
	position: absolute;
	padding: 8px;
	font-size: 12px;
	color: #20262E;
	background-color: rgba(255, 255, 255, 0.23);
	text-align: left;
  pointer-events: none;
}

.three-line-legend-dark {
	width: 100%;
	height: 70px;
	position: absolute;
	padding: 8px;
	font-size: 12px;
	color: white;
	background-color: rgba(255, 255, 255, 0.23);
	text-align: left;
  pointer-events: none;
}

.basic-chart {
  background-color: transparent;
  color: white;
}

.crosshair-custom-tooltip {
  width: 200px;
	padding: 8px;
	box-sizing: border-box;
	font-size: 12px;
	color: white;
	background-color: rgb(34, 36, 42);
	border: 1px solid rgb(64, 68, 79);
	border-radius: 8px;
}

.crosshair-tooltip {
	width: 200px;
	position: absolute;
	display: none;
	padding: 8px;
	box-sizing: border-box;
	font-size: 12px;
	color: white;
	background-color: rgb(34, 36, 42);
	z-index: 10;
	top: 12px;
	left: 12px;
	pointer-events: none;
	border: 1px solid rgb(64, 68, 79);
	border-radius: 8px;
}

.crosshair-item {
  display: flex;
  justify-content: space-between;
}

.crosshair-item-legend {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 8px;
}

@media screen and (max-width: 800px) {
  .three-line-legend {
    display: none !important;
  }
}

.tv-lightweight-charts{
  width: 100% !important;
  

  & > * {
    width: 100% !important;
  }
}


 
`;
