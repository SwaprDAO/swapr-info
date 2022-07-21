import React, { useEffect, useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { Flex } from 'rebass';

import { StyledIcon } from '..';
import { Typography } from '../../Theme';
import ArbitrumLogo from '../../assets/svg/arbitrum-one-logo.svg';
import EthereumLogo from '../../assets/svg/ethereum-logo.svg';
import GnosisLogo from '../../assets/svg/gnosis-chain-logo.svg';
import { SupportedNetwork } from '../../constants';
import { AutoColumn } from '../Column';
import Icon from '../Icon';
import Row from '../Row';
import { ArrowStyled, Dropdown, IconWrapper, Wrapper } from './styled';

const NetworkLogo = {
  [SupportedNetwork.MAINNET]: EthereumLogo,
  [SupportedNetwork.ARBITRUM_ONE]: ArbitrumLogo,
  [SupportedNetwork.XDAI]: GnosisLogo,
};

const NetworkIcon = ({ network }) => {
  if (NetworkLogo[network] === undefined) {
    return null;
  }

  return (
    <IconWrapper size={20}>
      <img src={NetworkLogo[network]} alt={network} />
    </IconWrapper>
  );
};

export default function DropdownNetworkSelect({ active, disabled, setActive }) {
  const [showDropdown, toggleDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  const options = Object.values(SupportedNetwork);

  useClickAway(dropdownRef, (event) => {
    if (showDropdown && !containerRef.current.contains(event.target)) toggleDropdown(false);
  });

  // Preload network logos
  useEffect(() => {
    Object.values(NetworkLogo).forEach((image) => {
      new Image().src = image;
    });
  }, []);

  return (
    <Wrapper open={showDropdown} ref={containerRef} disabled={disabled}>
      {disabled ? (
        <Flex justifyContent={'space-between'} alignItems={'center'} width={'100%'} height={'20px'}>
          <Typography.LargeText color={'disabled'} sx={{ display: 'flex' }}>
            {active}
          </Typography.LargeText>
          <StyledIcon disabled={disabled}>
            <ArrowStyled />
          </StyledIcon>
        </Flex>
      ) : (
        <Flex
          onClick={() => toggleDropdown(!showDropdown)}
          justifyContent={'space-between'}
          alignItems={'center'}
          width={'100%'}
        >
          <Typography.LargeText
            color={'text1'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginRight: '6px',
              height: '20px',
            }}
          >
            <NetworkIcon network={active} />
            {active}
          </Typography.LargeText>
          <StyledIcon>
            <Icon icon={<ArrowStyled />} color={'text1'} />
          </StyledIcon>
        </Flex>
      )}
      {showDropdown && (
        <Dropdown>
          <div ref={dropdownRef}>
            <AutoColumn gap={'16px'}>
              {Object.keys(options).map((key, index) => {
                let option = options[key];
                return (
                  option !== active && (
                    <Row
                      onClick={() => {
                        toggleDropdown(!showDropdown);
                        setActive(option);
                      }}
                      key={index}
                    >
                      <Typography.LargeText color={'text1'} sx={{ display: 'flex', alignItems: 'center' }}>
                        <NetworkIcon network={option} />
                        {option}
                      </Typography.LargeText>
                    </Row>
                  )
                );
              })}
            </AutoColumn>
          </div>
        </Dropdown>
      )}
    </Wrapper>
  );
}
