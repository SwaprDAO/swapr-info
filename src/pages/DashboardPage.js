import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { Repeat, Users, Zap, Link } from 'react-feather';
import { withRouter } from 'react-router-dom';
import { useMedia } from 'react-use';
import styled from 'styled-components';

import { Typography } from '../Theme';
import { ReactComponent as BarChartSvg } from '../assets/svg/bar-chart.svg';
import { ReactComponent as DollarSvg } from '../assets/svg/dollar.svg';
import { PageWrapper, ContentWrapper } from '../components';
import { AutoColumn } from '../components/Column';
import ComulativeNetworkDataCard from '../components/ComulativeNetworkDataCard';
import Icon from '../components/Icon';
import LocalLoader from '../components/LocalLoader';
import NetworkDataCardWithDialog from '../components/NetworkDataCardWithDialog';
import Panel from '../components/Panel';
import StackedChart from '../components/StackedChart';
import { SupportedNetwork, NETOWRK_FEE_RECEIVER_ADDRESSES } from '../constants';
import {
  useDashboardChartData,
  useDashboardComulativeData,
  useOneDaySwapsData,
  useOneDayWalletsData,
  usePastMonthWalletsData,
  useSwapsData,
  useUncollectedFeesData,
} from '../contexts/Dashboard';
import { useSelectedNetworkUpdater } from '../contexts/Network';
import { formattedNum } from '../utils';

const GridRow = styled.div`
  display: grid;
  grid-template-columns: minmax(auto, 900px) auto;
  column-gap: 21px;
  row-gap: 21px;
`;

const GridChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 21px;
`;

const GridCard = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  row-gap: 21px;
`;

const RedirectIconWrapper = styled.div`
  & > :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
  }
`;

const PanelLoaderWrapper = ({ maxHeight, isLoading, children }) => (
  <Panel maxHeight={maxHeight || '380px'}>{isLoading ? <LocalLoader /> : children}</Panel>
);
const CardLoaderWrapper = ({ isLoading, children }) => (
  <Panel padding={'24px'}>{isLoading ? <LocalLoader height={'163px'} /> : children}</Panel>
);

const DashboardPage = ({ history }) => {
  const oneDayTransactions = useOneDaySwapsData();
  const oneDayWalletsData = useOneDayWalletsData();
  const chartData = useDashboardChartData();
  const comulativeData = useDashboardComulativeData();
  const switchNetwork = useSelectedNetworkUpdater();
  const { uncollectedFeesData, loading: isLoadingUncollectedFees } = useUncollectedFeesData();

  const [formattedLiquidityData, setFormattedLiquidityData] = useState([]);
  const [formattedVolumeData, setFormattedVolumeData] = useState([]);
  const [formattedComulativeData, setFormattedComulativeData] = useState({ trades: [], volume: [] });

  // breakpoints
  const below800 = useMedia('(max-width: 800px)');
  const below1540 = useMedia('(max-width: 1510px)');

  const handleReceiverLookup = (network) => {
    switchNetwork(network);
    history.push(`/account/${NETOWRK_FEE_RECEIVER_ADDRESSES[network]}`);
  };

  useEffect(() => {
    if (chartData && chartData.daily) {
      // group daily volume and liquidity data by date
      const formattedData = Object.values(
        chartData.daily.reduce(
          (accumulator, current) => ({
            ...accumulator,
            [current.date]: {
              time: dayjs.unix(current.date).utc().format('YYYY-MM-DD'),
              tvl: {
                ...accumulator[current.date]?.tvl,
                [current.network]: parseFloat(current.totalLiquidityUSD),
              },
              volume: {
                ...accumulator[current.date]?.volume,
                [current.network]: parseFloat(current.dailyVolumeUSD),
              },
            },
          }),
          {},
        ),
      );

      setFormattedLiquidityData(formattedData.map(({ time, tvl }) => ({ time, ...tvl })));
      setFormattedVolumeData(formattedData.map(({ time, volume }) => ({ time, ...volume })));
    }
  }, [chartData]);

  useEffect(() => {
    if (comulativeData && Object.keys(comulativeData).length > 0) {
      const totalTradesPerNetwork = [];
      const totalVolumePerNetwork = [];

      Object.keys(comulativeData)
        // include only network specific data
        .filter((key) => Object.values(SupportedNetwork).includes(key))
        .forEach((network) => {
          totalTradesPerNetwork.push({
            network,
            value: formattedNum(comulativeData[network].totalTrades),
          });
          totalVolumePerNetwork.push({
            network,
            value: `$ ${formattedNum(comulativeData[network].totalVolume)}`,
          });
        });

      setFormattedComulativeData({ trades: totalTradesPerNetwork, volume: totalVolumePerNetwork });
    }
  }, [comulativeData]);

  const formattedUncollectedFees = useMemo(
    () =>
      Object.keys(uncollectedFeesData ?? {})
        .filter((key) => Object.values(SupportedNetwork).includes(key))
        .map((network) => ({ network, value: `$ ${formattedNum(uncollectedFeesData[network])}` })),
    [uncollectedFeesData],
  );

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const isVolumeAndTvlLoading = chartData === undefined || Object.keys(chartData).length === 0;
  const isComulativeDataLoading =
    formattedComulativeData.trades.length === 0 || formattedComulativeData.volume.length === 0;
  const isLoadingOneDayTransactions = oneDayTransactions === undefined || Object.keys(oneDayTransactions).length === 0;
  const isLoadingOneDayWallets = oneDayWalletsData === undefined || Object.keys(oneDayWalletsData).length === 0;

  return (
    <PageWrapper>
      <ContentWrapper>
        <Typography.LargeHeader>
          {below800 ? 'Analytics Dashboard' : 'Swapr Protocol Analytics Dashboard'}
        </Typography.LargeHeader>
        {formattedLiquidityData && (
          <>
            {below800 ? (
              <AutoColumn style={{ marginTop: '6px' }} gap={'16px'}>
                <PanelLoaderWrapper maxHeight={'auto'} isLoading={isVolumeAndTvlLoading}>
                  <StackedChart title={'TVL'} type={'AREA'} data={formattedLiquidityData} />
                </PanelLoaderWrapper>
                <PanelLoaderWrapper maxHeight={'auto'} isLoading={isVolumeAndTvlLoading}>
                  <StackedChart title={'Volume'} type={'BAR'} data={formattedVolumeData} />
                </PanelLoaderWrapper>
                <CardLoaderWrapper isLoading={isComulativeDataLoading}>
                  <ComulativeNetworkDataCard
                    title={'All time volume'}
                    icon={<Icon icon={<DollarSvg height={16} width={16} />} />}
                    comulativeValue={`$ ${formattedNum(comulativeData.totalVolume)}`}
                    networksValues={formattedComulativeData.volume}
                  />
                </CardLoaderWrapper>
                <CardLoaderWrapper isLoading={isComulativeDataLoading}>
                  <ComulativeNetworkDataCard
                    title={'Total transactions'}
                    icon={<Icon icon={<BarChartSvg height={16} width={16} />} />}
                    comulativeValue={formattedNum(comulativeData.totalTrades)}
                    networksValues={formattedComulativeData.trades}
                  />
                </CardLoaderWrapper>
                <CardLoaderWrapper isLoading={isLoadingUncollectedFees}>
                  <ComulativeNetworkDataCard
                    title={'Uncollected fees'}
                    icon={<Icon icon={<Zap size={16} />} />}
                    comulativeValue={`$ ${formattedNum(uncollectedFeesData?.total ?? 0)}`}
                    networksValues={formattedUncollectedFees}
                    customNetworkAction={
                      <RedirectIconWrapper onClick={handleReceiverLookup}>
                        <Icon icon={<Link size={14} />} color={'text6'} />
                      </RedirectIconWrapper>
                    }
                  />
                </CardLoaderWrapper>
                <CardLoaderWrapper isLoading={isLoadingOneDayTransactions}>
                  <NetworkDataCardWithDialog
                    title={'Trades (today)'}
                    icon={<Icon icon={<Repeat size={16} />} />}
                    dialogContent={'content'}
                    networksValues={oneDayTransactions}
                    historicalDataHook={useSwapsData}
                  />
                </CardLoaderWrapper>
                <CardLoaderWrapper isLoading={isLoadingOneDayWallets}>
                  <NetworkDataCardWithDialog
                    title={'Wallets (today)'}
                    chartTitle={'Wallets'}
                    icon={<Icon icon={<Users size={16} />} />}
                    networksValues={oneDayWalletsData}
                    historicalDataHook={usePastMonthWalletsData}
                  />
                </CardLoaderWrapper>
              </AutoColumn>
            ) : below1540 ? (
              <AutoColumn style={{ marginTop: '6px' }} gap={'16px'}>
                <PanelLoaderWrapper maxHeight={'auto'} isLoading={isVolumeAndTvlLoading}>
                  <StackedChart title={'TVL'} type={'AREA'} data={formattedLiquidityData} />
                </PanelLoaderWrapper>
                <PanelLoaderWrapper maxHeight={'auto'} isLoading={isVolumeAndTvlLoading}>
                  <StackedChart title={'Volume'} type={'BAR'} data={formattedVolumeData} />
                </PanelLoaderWrapper>
                <AutoColumn gap={'16px'}>
                  <CardLoaderWrapper isLoading={isComulativeDataLoading}>
                    <ComulativeNetworkDataCard
                      title={'All time volume'}
                      icon={<Icon icon={<DollarSvg height={16} width={16} />} />}
                      comulativeValue={`$ ${formattedNum(comulativeData.totalVolume)}`}
                      networksValues={formattedComulativeData.volume}
                    />
                  </CardLoaderWrapper>
                  <CardLoaderWrapper isLoading={isComulativeDataLoading}>
                    <ComulativeNetworkDataCard
                      title={'Total transactions'}
                      icon={<Icon icon={<BarChartSvg height={16} width={16} />} />}
                      comulativeValue={formattedNum(comulativeData.totalTrades)}
                      networksValues={formattedComulativeData.trades}
                    />
                  </CardLoaderWrapper>
                  <CardLoaderWrapper isLoading={isLoadingUncollectedFees}>
                    <ComulativeNetworkDataCard
                      title={'Uncollected fees'}
                      icon={<Icon icon={<Zap size={16} />} />}
                      comulativeValue={`$ ${formattedNum(uncollectedFeesData?.total ?? 0)}`}
                      networksValues={formattedUncollectedFees}
                      customNetworkAction={
                        <RedirectIconWrapper onClick={handleReceiverLookup}>
                          <Icon icon={<Link size={14} />} color={'text6'} />
                        </RedirectIconWrapper>
                      }
                    />
                  </CardLoaderWrapper>
                  <CardLoaderWrapper isLoading={isLoadingOneDayTransactions}>
                    <NetworkDataCardWithDialog
                      title={'Trades (today)'}
                      icon={<Icon icon={<Repeat size={16} />} />}
                      dialogContent={'content'}
                      networksValues={oneDayTransactions}
                      historicalDataHook={useSwapsData}
                    />
                  </CardLoaderWrapper>
                  <CardLoaderWrapper isLoading={isLoadingOneDayWallets}>
                    <NetworkDataCardWithDialog
                      title={'Wallets (today)'}
                      chartTitle={'Wallets'}
                      icon={<Icon icon={<Users size={16} />} />}
                      networksValues={oneDayWalletsData}
                      historicalDataHook={usePastMonthWalletsData}
                    />
                  </CardLoaderWrapper>
                </AutoColumn>
              </AutoColumn>
            ) : (
              <GridRow>
                <GridChart>
                  <PanelLoaderWrapper isLoading={isVolumeAndTvlLoading}>
                    <StackedChart title={'TVL'} type={'AREA'} minHeight={250} data={formattedLiquidityData} />
                  </PanelLoaderWrapper>
                  <PanelLoaderWrapper isLoading={isVolumeAndTvlLoading}>
                    <StackedChart title={'Volume'} type={'BAR'} minHeight={250} data={formattedVolumeData} />
                  </PanelLoaderWrapper>
                </GridChart>
                <div>
                  <GridCard>
                    <CardLoaderWrapper isLoading={isComulativeDataLoading}>
                      <ComulativeNetworkDataCard
                        title={'All time volume'}
                        icon={<Icon icon={<DollarSvg height={16} width={16} />} />}
                        comulativeValue={`$ ${formattedNum(comulativeData.totalVolume)}`}
                        networksValues={formattedComulativeData.volume}
                      />
                    </CardLoaderWrapper>
                    <CardLoaderWrapper isLoading={isComulativeDataLoading}>
                      <ComulativeNetworkDataCard
                        title={'Total transactions'}
                        icon={<Icon icon={<BarChartSvg height={16} width={16} />} />}
                        comulativeValue={formattedNum(comulativeData.totalTrades)}
                        networksValues={formattedComulativeData.trades}
                      />
                    </CardLoaderWrapper>
                    <CardLoaderWrapper isLoading={isLoadingUncollectedFees}>
                      <ComulativeNetworkDataCard
                        title={'Uncollected fees'}
                        icon={<Icon icon={<Zap size={16} />} />}
                        comulativeValue={`$ ${formattedNum(uncollectedFeesData?.total ?? 0)}`}
                        networksValues={formattedUncollectedFees}
                        customNetworkAction={
                          <RedirectIconWrapper onClick={handleReceiverLookup}>
                            <Icon icon={<Link size={14} />} color={'text6'} />
                          </RedirectIconWrapper>
                        }
                      />
                    </CardLoaderWrapper>
                    <CardLoaderWrapper isLoading={isLoadingOneDayTransactions}>
                      <NetworkDataCardWithDialog
                        title={'Trades (today)'}
                        chartTitle={'Trades'}
                        icon={<Icon icon={<Repeat size={16} />} />}
                        networksValues={oneDayTransactions}
                        historicalDataHook={useSwapsData}
                      />
                    </CardLoaderWrapper>
                    <CardLoaderWrapper isLoading={isLoadingOneDayWallets}>
                      <NetworkDataCardWithDialog
                        title={'Wallets (today)'}
                        chartTitle={'Wallets'}
                        icon={<Icon icon={<Users size={16} />} />}
                        networksValues={oneDayWalletsData}
                        historicalDataHook={usePastMonthWalletsData}
                      />
                    </CardLoaderWrapper>
                  </GridCard>
                </div>
              </GridRow>
            )}
          </>
        )}
      </ContentWrapper>
    </PageWrapper>
  );
};

export default withRouter(DashboardPage);
