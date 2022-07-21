import { transparentize } from 'polished';
import React, { useCallback, useEffect, useState } from 'react';
import { TrendingUp, List, PieChart, Disc, Menu, Layers } from 'react-feather';
import { withRouter } from 'react-router-dom';
import { useMedia } from 'react-use';
import { Flex } from 'rebass';
import styled from 'styled-components';

import { Typography } from '../../Theme';
import Farms from '../../assets/icons/Farm';
import { ReactComponent as GasInfoSvg } from '../../assets/svg/gas-info.svg';
import { SupportedNetwork } from '../../constants';
import { useNativeCurrencyPrice } from '../../contexts/GlobalData';
import { useNativeCurrencySymbol, useSelectedNetwork, useSelectedNetworkUpdater } from '../../contexts/Network';
import { useGasInfo } from '../../hooks/useGasInfo';
import { useSwprPrice } from '../../hooks/useSwprPrice';
import { formattedNum } from '../../utils';
import { AutoColumn } from '../Column';
import DropdownNetworkSelect from '../DropdownNetworkSelect';
import Icon from '../Icon';
import Link, { BasicLink } from '../Link';
import Polling from '../Polling';
import { AutoRow } from '../Row';
import Title from '../Title';
import { MobileMenu } from './MobileMenu';

const Wrapper = styled.div`
  height: ${({ isMobile }) => (isMobile ? 'initial' : 'calc(100vh - 36px)')};
  padding-left: 36px;
  background-color: ${({ theme }) => transparentize(0.4, theme.bg1)};
  color: ${({ theme }) => theme.text1};
  position: sticky;
  top: 0px;
  background-color: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.bg2};

  @media screen and (max-width: 800px) {
    grid-template-columns: 1fr;
    position: relative;
  }

  @media screen and (max-width: 600px) {
    padding: 1rem;
  }
`;

export const Option = styled(Typography.LargeText)`
  color: ${({ activeText, theme }) => (activeText ? theme.text1 : theme.text10)};
  display: flex;
  align-items: center;

  && {
    font-weight: ${({ activeText }) => (activeText ? '700' : '400')};
  }

  &:hover {
    color: ${({ theme }) => theme.text1};
  }

  // Apply hover directly to the svg path element (needed for the Farms icon)
  &:hover div path {
    fill: ${({ theme }) => theme.text1};
  }
`;

const DesktopWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
`;

const MobileWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MenuIcon = styled(Menu)`
  color: #fff;
`;

const GasInfo = styled.div`
  display: flex;
  margin-left: 12px;
  padding: 4px 5px;
  border: 1px solid rgba(242, 153, 74, 0.65);
  background: rgba(242, 153, 74, 0.08);
  border-radius: 6px;

  div {
    color: ${({ theme }) => theme.orange1};
  }

  align-items: center;
`;

const AnimatedMobileMenu = styled(MobileMenu)`
  position: fixed;
  right: 0;
  left: 0;
  top: ${(props) => (props.open ? '0' : '-100%')};
  background-color: ${({ theme }) => theme.bg1};
  color: #fff;
  transition: top ease 0.3s;
  z-index: 100;
`;

const Overlay = styled.div`
  position: fixed;
  right: 0;
  left: 0;
  top: 0;
  bottom: 0;
  background-color: ${transparentize(0.7, '#000')};
  opacity: ${({ show }) => (show ? 1 : 0)};
  transform: translateY(${(props) => (props.show ? '0' : '10000000px')});
  transition: ${(props) => (props.show ? 'opacity 0.3s ease' : 'transform 0.3s ease 0.3s, opacity 0.3s ease')};
`;

function SideNav({ history }) {
  const below1080 = useMedia('(max-width: 1080px)');
  const below1180 = useMedia('(max-width: 1180px)');

  const selectedNetwork = useSelectedNetwork();
  const updateSelectedNetwork = useSelectedNetworkUpdater();

  const { gas } = useGasInfo();
  const { loading, price } = useSwprPrice();
  const nativeCurrencySymbol = useNativeCurrencySymbol();
  const [nativeCurrencyPrice] = useNativeCurrencyPrice();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [swprPrice, setSwprPrice] = useState(0);

  const formattedNativeCurrencyPrice = nativeCurrencyPrice ? formattedNum(nativeCurrencyPrice, true) : '-';
  const formattedSwprPrice = swprPrice ? formattedNum(swprPrice, true) : '-';

  useEffect(() => {
    if (!loading && nativeCurrencyPrice) {
      setSwprPrice(price * nativeCurrencyPrice);
    }
  }, [loading, price, nativeCurrencyPrice, swprPrice]);

  const handleMobileMenuOpen = () => {
    setMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleSelectedNetworkChange = useCallback(
    (network) => {
      updateSelectedNetwork(network);
      history.push('/');
    },
    [updateSelectedNetwork, history],
  );

  return (
    <Wrapper isMobile={below1080}>
      {!below1080 ? (
        <DesktopWrapper style={{ marginTop: '36px' }}>
          <AutoColumn gap={'24px'}>
            <Title />
            {history.location.pathname !== '/dashboard' ? (
              <DropdownNetworkSelect
                active={selectedNetwork}
                setActive={handleSelectedNetworkChange}
                options={Object.values(SupportedNetwork)}
              />
            ) : (
              <DropdownNetworkSelect active={'All'} disabled={true} options={[{ ALL: 'All' }]} />
            )}
            {!below1080 && (
              <AutoColumn gap={'lg'} style={{ marginTop: '1rem' }}>
                <BasicLink to="/dashboard">
                  <Option activeText={history.location.pathname === '/dashboard' ?? undefined}>
                    <Layers size={20} style={{ marginRight: '.75rem' }} />
                    Dashboard
                  </Option>
                </BasicLink>
                <BasicLink to="/home">
                  <Option activeText={history.location.pathname === '/home' ?? undefined}>
                    <TrendingUp size={20} style={{ marginRight: '.75rem' }} />
                    Overview
                  </Option>
                </BasicLink>
                <BasicLink to="/tokens">
                  <Option
                    activeText={
                      (history.location.pathname.split('/')[1] === 'tokens' ||
                        history.location.pathname.split('/')[1] === 'token') ??
                      undefined
                    }
                  >
                    <Disc size={20} style={{ marginRight: '.75rem' }} />
                    Tokens
                  </Option>
                </BasicLink>
                <BasicLink to="/pairs">
                  <Option
                    activeText={
                      (history.location.pathname.split('/')[1] === 'pairs' ||
                        history.location.pathname.split('/')[1] === 'pair') ??
                      undefined
                    }
                  >
                    <PieChart size={20} style={{ marginRight: '.75rem' }} />
                    Pairs
                  </Option>
                </BasicLink>
                <BasicLink to="/farming">
                  <Option activeText={history.location.pathname.split('/')[1] === 'farming' ?? undefined}>
                    <Icon
                      icon={
                        <Farms
                          height={20}
                          width={20}
                          color={history.location.pathname.split('/')[1] === 'farming' ? 'text1' : 'text10'}
                        />
                      }
                    />
                    Farms
                  </Option>
                </BasicLink>

                <BasicLink to="/accounts">
                  <Option
                    activeText={
                      (history.location.pathname.split('/')[1] === 'accounts' ||
                        history.location.pathname.split('/')[1] === 'account') ??
                      undefined
                    }
                  >
                    <List size={20} style={{ marginRight: '.75rem' }} />
                    Accounts
                  </Option>
                </BasicLink>
              </AutoColumn>
            )}
          </AutoColumn>
          <AutoColumn gap={'12px'} style={{ marginBottom: '4rem' }}>
            <Typography.Text>
              <Link external={true} color={'text10'} href="https://swapr.eth.limo">
                Swapr
              </Link>
            </Typography.Text>
            <Typography.Text>
              <Link external={true} color={'text10'} href="https://dxdao.eth.limo">
                DXdao
              </Link>
            </Typography.Text>
            <Typography.Text>
              <Link external={true} color={'text10'} href="https://twitter.com/SwaprEth">
                Twitter
              </Link>
            </Typography.Text>
            <Typography.Text>
              <Link external={true} color={'text10'} href="https://discord.com/invite/4QXEJQkvHH">
                Discord
              </Link>
            </Typography.Text>
            <Typography.Text>
              <Link external={true} color={'text10'} href="https://github.com/SwaprDAO/swapr-info">
                Github
              </Link>
            </Typography.Text>
            <Typography.Text>
              <Link external={true} color={'text10'} href="https://dxdocs.eth.limo">
                DXdocs
              </Link>
            </Typography.Text>
            <Flex marginTop={'6px'}>
              <Typography.SmallText sx={{ marginRight: '16px' }}>
                {nativeCurrencySymbol}:{' '}
                <Typography.Custom sx={{ display: 'inline', fontWeight: 700, fontSize: 10 }}>
                  {formattedNativeCurrencyPrice}
                </Typography.Custom>
              </Typography.SmallText>
              <Typography.SmallText>
                SWPR:{' '}
                <Typography.Custom sx={{ display: 'inline', fontWeight: 700, fontSize: 10 }}>
                  {formattedSwprPrice}
                </Typography.Custom>
              </Typography.SmallText>
            </Flex>
            {!below1180 && (
              <Flex>
                <Polling />
                {gas.normal > 0 && (
                  <GasInfo>
                    <GasInfoSvg />
                    <Typography.TinyText sx={{ marginLeft: '2px' }}>{gas.normal}</Typography.TinyText>
                  </GasInfo>
                )}
              </Flex>
            )}
          </AutoColumn>
        </DesktopWrapper>
      ) : (
        <>
          <AnimatedMobileMenu open={mobileMenuOpen} onClose={handleMobileMenuClose} />
          <Overlay show={mobileMenuOpen} onClick={handleMobileMenuClose} />
          <MobileWrapper>
            <Title />
            <AutoRow justify="flex-end" gap="8px">
              {history.location.pathname !== '/dashboard' ? (
                <DropdownNetworkSelect
                  active={selectedNetwork}
                  setActive={handleSelectedNetworkChange}
                  options={Object.values(SupportedNetwork)}
                />
              ) : (
                <DropdownNetworkSelect active={'All'} disabled={true} options={[{ ALL: 'All' }]} />
              )}
              <MenuIcon onClick={handleMobileMenuOpen} />
            </AutoRow>
          </MobileWrapper>
        </>
      )}
    </Wrapper>
  );
}

export default withRouter(SideNav);
