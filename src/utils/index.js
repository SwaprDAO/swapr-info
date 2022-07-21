import { BigNumber } from 'bignumber.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import _Decimal from 'decimal.js-light';
import Numeral from 'numeral';
import React from 'react';
import toFormat from 'toformat';

import { getAddress } from '@ethersproject/address';
import { parseUnits } from '@ethersproject/units';
import {
  CurrencyAmount,
  LiquidityMiningCampaign,
  Price,
  PricedToken,
  PricedTokenAmount,
  Token,
  TokenAmount,
  USD,
} from '@swapr/sdk';

import { Typography } from '../Theme';
import { GET_BLOCK, GET_BLOCKS, GET_BLOCK_BY_TIMESTAMPS, SHARE_VALUE } from '../apollo/queries';
import { SupportedNetwork, timeframeOptions, ETHERSCAN_PREFIXES, ChainId, SWAPR_LINK } from '../constants';

// format libraries
const Decimal = toFormat(_Decimal);
BigNumber.set({ EXPONENTIAL_AT: 50 });
dayjs.extend(utc);

export function getTimeframe(timeWindow) {
  const utcEndTime = dayjs.utc();
  // based on window, get starttime
  let utcStartTime;
  switch (timeWindow) {
    case timeframeOptions.WEEK:
      utcStartTime = utcEndTime.subtract(1, 'week').endOf('day').unix() - 1;
      break;
    case timeframeOptions.MONTH:
      utcStartTime = utcEndTime.subtract(1, 'month').endOf('day').unix() - 1;
      break;
    case timeframeOptions.ALL_TIME:
      utcStartTime = utcEndTime.subtract(1, 'year').endOf('day').unix() - 1;
      break;
    default:
      utcStartTime = utcEndTime.subtract(1, 'year').startOf('year').unix() - 1;
      break;
  }
  return utcStartTime;
}

export function getPoolLink(
  selectedNetwork,
  nativeCurrency,
  nativeCurrencyWrapper,
  token0Address,
  token1Address = null,
  remove = false,
) {
  if (!token1Address) {
    return (
      `${SWAPR_LINK}/pools/` +
      (remove ? `remove` : `add`) +
      `/${token0Address === nativeCurrencyWrapper.symbol ? nativeCurrency : token0Address}/${nativeCurrency}?chainId=${
        ChainId[selectedNetwork]
      }`
    );
  } else {
    return (
      `${SWAPR_LINK}/pools/` +
      (remove ? `remove` : `add`) +
      `/${token0Address === nativeCurrencyWrapper.symbol ? nativeCurrency : token0Address}/${
        token1Address === nativeCurrencyWrapper.symbol ? nativeCurrency : token1Address
      }?chainId=${ChainId[selectedNetwork]}`
    );
  }
}

export function getSwapLink(
  selectedNetwork,
  nativeCurrency,
  nativeCurrencyWrapper,
  token0Address,
  token1Address = null,
) {
  if (!token1Address) {
    return `${SWAPR_LINK}/swap?inputCurrency=${token0Address}&chainId=${ChainId[selectedNetwork]}`;
  } else {
    return `${SWAPR_LINK}/swap?inputCurrency=${
      token0Address === nativeCurrencyWrapper.symbol ? nativeCurrency : token0Address
    }&outputCurrency=${token1Address === nativeCurrencyWrapper.symbol ? nativeCurrency : token1Address}&chainId=${
      ChainId[selectedNetwork]
    }`;
  }
}

const getExplorerPrefix = (selectedNetwork) => {
  switch (selectedNetwork) {
    case SupportedNetwork.XDAI:
      return 'https://blockscout.com/poa/xdai';
    case SupportedNetwork.ARBITRUM_ONE:
      return 'https://arbiscan.io/';
    default:
      return `https://${
        ETHERSCAN_PREFIXES[selectedNetwork] || ETHERSCAN_PREFIXES[SupportedNetwork.MAINNET]
      }etherscan.io`;
  }
};

export function getExplorerLink(selectedNetwork, data, type) {
  const prefix = getExplorerPrefix(selectedNetwork);

  // exception. blockscout doesn't have a token-specific address
  if (selectedNetwork === SupportedNetwork.XDAI && type === 'token') {
    return `${prefix}/address/${data}`;
  }

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`;
    }
    case 'token': {
      return `${prefix}/token/${data}`;
    }
    case 'block': {
      return `${prefix}/block/${data}`;
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`;
    }
  }
}

export function getSwaprAppLink(nativeCurrency, linkVariable, selectedNetwork) {
  if (!linkVariable) {
    return SWAPR_LINK;
  }

  return `${SWAPR_LINK}/${nativeCurrency}/${linkVariable}?chainId=${selectedNetwork}`;
}

export function getSwaprLink(route, networkId) {
  return `${SWAPR_LINK}${route}?chainId=${networkId}`;
}

export function localNumber(val) {
  return Numeral(val).format('0,0');
}

export const toNiceDate = (date) => {
  let x = dayjs.utc(dayjs.unix(date)).format('MMM DD');
  return x;
};

export const toWeeklyDate = (date) => {
  const formatted = dayjs.utc(dayjs.unix(date));
  date = new Date(formatted);
  const day = new Date(formatted).getDay();
  var lessDays = day === 6 ? 0 : day + 1;
  var wkStart = new Date(new Date(date).setDate(date.getDate() - lessDays));
  var wkEnd = new Date(new Date(wkStart).setDate(wkStart.getDate() + 6));
  return dayjs.utc(wkStart).format('MMM DD') + ' - ' + dayjs.utc(wkEnd).format('MMM DD');
};

export function getTimestampsForChanges() {
  const utcCurrentTime = dayjs();
  const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix();
  const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix();
  const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix();
  return [t1, t2, tWeek];
}

export async function splitQuery(query, localClient, vars, list, skipCount = 100) {
  let fetchedData = {};
  let allFound = false;
  let skip = 0;

  while (!allFound) {
    let end = list.length;
    if (skip + skipCount < list.length) {
      end = skip + skipCount;
    }
    let sliced = list.slice(skip, end);
    let result = await localClient.query({
      query: query(...vars, sliced),
    });
    fetchedData = {
      ...fetchedData,
      ...result.data,
    };
    if (Object.keys(result.data).length < skipCount || skip + skipCount > list.length) {
      allFound = true;
    } else {
      skip += skipCount;
    }
  }

  return fetchedData;
}

/**
 * @notice Fetches first block after a given timestamp
 * @dev Query speed is optimized by limiting to a 600-second period
 * @param {Int} timestamp in seconds
 */
export async function getBlockFromTimestamp(blockClient, timestamp) {
  let result = await blockClient.query({
    query: GET_BLOCK,
    variables: {
      timestampFrom: timestamp,
      timestampTo: timestamp + 600,
    },
  });
  return result?.data?.blocks?.[0]?.number;
}

export const getBlocksByTimestamps = async (blockClient, timestamps) => {
  try {
    let blocks = [];
    let lastId = '';
    let fetchMore = true;

    while (fetchMore) {
      const { data } = await blockClient.query({
        query: GET_BLOCK_BY_TIMESTAMPS,
        variables: {
          timestamps,
          lastId,
        },
      });

      if (data.blocks.length === 0) {
        fetchMore = false;
        continue;
      }

      lastId = data.blocks[data.blocks.length - 1].id;
      blocks = blocks.concat(data.blocks);
    }

    return blocks;
  } catch (error) {
    console.log(error);
  }
};

/**
 * @notice Fetches block objects for an array of timestamps.
 * @dev blocks are returned in chronological order (ASC) regardless of input.
 * @dev blocks are returned at string representations of Int
 * @dev timestamps are returns as they were provided; not the block time.
 * @param {Array} timestamps
 */
export async function getBlocksFromTimestamps(blockClient, timestamps, skipCount = 500) {
  if (timestamps?.length === 0) {
    return [];
  }

  let fetchedData = await splitQuery(GET_BLOCKS, blockClient, [], timestamps, skipCount);

  let blocks = [];
  if (fetchedData) {
    for (var t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          timestamp: t.split('t')[1],
          number: fetchedData[t][0]['number'],
        });
      }
    }
  }

  return blocks;
}

/**
 * @notice Example query using time travel queries
 * @dev TODO - handle scenario where blocks are not available for a timestamps (e.g. current time)
 * @param {String} pairAddress
 * @param {Array} timestamps
 */
export async function getShareValueOverTime(client, blockClient, pairAddress, timestamps) {
  if (!timestamps) {
    const utcCurrentTime = dayjs();
    const utcSevenDaysBack = utcCurrentTime.subtract(8, 'day').unix();
    timestamps = getTimestampRange(utcSevenDaysBack, 86400, 7);
  }

  // get blocks based on timestamps
  const blocks = await getBlocksByTimestamps(blockClient, timestamps);

  // perform multiple queries with subsets of blocks
  // to avoid payloads too large
  let result = { data: {} };
  for (let blocksChunk of chunk(blocks, 100)) {
    const { data } = await client.query({
      query: SHARE_VALUE(pairAddress, blocksChunk),
    });

    result = {
      ...result,
      data: {
        ...result.data,
        ...data,
      },
    };
  }

  let values = [];
  for (var row in result?.data) {
    let timestamp = row.split('t')[1];
    let sharePriceUsd = parseFloat(result.data[row]?.reserveUSD) / parseFloat(result.data[row]?.totalSupply);
    if (timestamp) {
      values.push({
        timestamp,
        sharePriceUsd,
        totalSupply: result.data[row].totalSupply,
        reserve0: result.data[row].reserve0,
        reserve1: result.data[row].reserve1,
        reserveUSD: result.data[row].reserveUSD,
        token0DerivedNativeCurrency: result.data[row].token0.derivedNativeCurrency,
        token1DerivedNativeCurrency: result.data[row].token1.derivedNativeCurrency,
        roiUsd: values && values[0] ? sharePriceUsd / values[0]['sharePriceUsd'] : 1,
        nativeCurrencyPrice: 0,
        token0PriceUSD: 0,
        token1PriceUSD: 0,
      });
    }
  }

  // add eth prices
  let index = 0;
  for (var brow in result?.data) {
    let timestamp = brow.split('b')[1];
    if (timestamp) {
      values[index].nativeCurrencyPrice = result.data[brow].nativeCurrencyPrice;
      values[index].token0PriceUSD = result.data[brow].nativeCurrencyPrice * values[index].token0DerivedNativeCurrency;
      values[index].token1PriceUSD = result.data[brow].nativeCurrencyPrice * values[index].token1DerivedNativeCurrency;
      index += 1;
    }
  }

  return values;
}

/**
 * @notice Creates an evenly-spaced array of timestamps
 * @dev Periods include a start and end timestamp. For example, n periods are defined by n+1 timestamps.
 * @param {Int} timestamp_from in seconds
 * @param {Int} period_length in seconds
 * @param {Int} periods
 */
export function getTimestampRange(timestamp_from, period_length, periods) {
  let timestamps = [];
  for (let i = 0; i <= periods; i++) {
    timestamps.push(timestamp_from + i * period_length);
  }
  return timestamps;
}

export const toNiceDateYear = (date) => dayjs.utc(dayjs.unix(date)).format('MMMM DD, YYYY');

export const isAddress = (value) => {
  try {
    return getAddress(value.toLowerCase());
  } catch {
    return false;
  }
};

export const toK = (num) => {
  return Numeral(num).format('0.[00]a');
};

export const setThemeColor = (theme) => document.documentElement.style.setProperty('--c-token', theme || '#333333');

export const Big = (number) => new BigNumber(number);

export const urls = {
  showTransaction: (tx, selectedNetwork) => getExplorerLink(selectedNetwork, tx, 'transaction'),
  showAddress: (address, selectedNetwork) => getExplorerLink(selectedNetwork, address, 'address'),
  showToken: (address, selectedNetwork) => getExplorerLink(selectedNetwork, address, 'token'),
  showBlock: (block, selectedNetwork) => getExplorerLink(selectedNetwork, block, 'block'),
};

export const formatTime = (unix) => {
  const now = dayjs();
  const timestamp = dayjs.unix(unix);

  const inSeconds = now.diff(timestamp, 'second');
  const inMinutes = now.diff(timestamp, 'minute');
  const inHours = now.diff(timestamp, 'hour');
  const inDays = now.diff(timestamp, 'day');

  if (inHours >= 24) {
    return `${inDays} ${inDays === 1 ? 'day' : 'days'} ago`;
  } else if (inMinutes >= 60) {
    return `${inHours} ${inHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (inSeconds >= 60) {
    return `${inMinutes} ${inMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return `${inSeconds} ${inSeconds === 1 ? 'second' : 'seconds'} ago`;
  }
};

export const formatNumber = (num) => {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
};

// using a currency library here in case we want to add more in future
export const formatDollarAmount = (num, digits) => {
  const formatter = new Intl.NumberFormat([], {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter.format(num);
};

export const toSignificant = (number, significantDigits) => {
  Decimal.set({ precision: significantDigits + 1, rounding: Decimal.ROUND_UP });
  const updated = new Decimal(number).toSignificantDigits(significantDigits);
  return updated.toFormat(updated.decimalPlaces(), { groupSeparator: '' });
};

export const formattedNum = (number, usd = false, acceptNegatives = false) => {
  if (isNaN(number) || number === '' || number === undefined) {
    return usd ? '$0' : 0;
  }

  let num = parseFloat(number);

  if (num > 500000000) {
    return (usd ? '$' : '') + toK(num.toFixed(0), true);
  }

  if (num === 0) {
    if (usd) {
      return '$0';
    }
    return 0;
  }

  if (num < 0.0001 && num > 0) {
    return usd ? '< $0.0001' : '< 0.0001';
  }

  if (num > 1000) {
    return usd ? formatDollarAmount(num, 0) : Number(parseFloat(num).toFixed(0)).toLocaleString();
  }

  if (usd) {
    if (num < 0.1) {
      return formatDollarAmount(num, 4);
    } else {
      return formatDollarAmount(num, 2);
    }
  }

  return Number(parseFloat(num).toFixed(5)).toLocaleString();
};

export function rawPercent(percentRaw) {
  let percent = parseFloat(percentRaw * 100);
  if (!percent || percent === 0) {
    return '0%';
  }
  if (percent < 1 && percent > 0) {
    return '< 1%';
  }
  return percent.toFixed(0) + '%';
}

export function formattedPercent(percent = false) {
  percent = parseFloat(percent);
  if (!percent || percent === 0) {
    return <Typography.SmallHeader color={'text1'}>0%</Typography.SmallHeader>;
  }

  if (percent < 0.0001 && percent > 0) {
    return <Typography.SmallHeader color={'green1'}>{'< 0.0001%'}</Typography.SmallHeader>;
  }

  if (percent < 0 && percent > -0.0001) {
    return <Typography.SmallHeader color={'red1'}>{'< 0.0001%'}</Typography.SmallHeader>;
  }

  let fixedPercent = percent.toFixed(2);
  if (fixedPercent === '0.00') {
    return '0%';
  }
  if (fixedPercent > 0) {
    if (fixedPercent > 100) {
      return (
        <Typography.SmallHeader color={'green1'}>{`+${percent?.toFixed(0).toLocaleString()}%`}</Typography.SmallHeader>
      );
    } else {
      return <Typography.SmallHeader color={'green1'}>{`+${fixedPercent}%`}</Typography.SmallHeader>;
    }
  } else {
    return <Typography.SmallHeader color={'red1'}>{`${fixedPercent}%`}</Typography.SmallHeader>;
  }
}

/**
 * gets the amoutn difference plus the % change in change itself (second order change)
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 * @param {*} value48HoursAgo
 */
export const get2DayPercentChange = (valueNow, value24HoursAgo, value48HoursAgo) => {
  // get volume info for both 24 hour periods
  let currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo);
  let previousChange = parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo);

  const adjustedPercentChange = (parseFloat(currentChange - previousChange) / parseFloat(previousChange)) * 100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow, value24HoursAgo) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) / parseFloat(value24HoursAgo)) * 100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

export function isEquivalent(a, b) {
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);
  if (aProps.length !== bProps.length) {
    return false;
  }
  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i];
    if (a[propName] !== b[propName]) {
      return false;
    }
  }
  return true;
}

export function getLpTokenPrice(pair, nativeCurrency, totalSupply, reserveNativeCurrency) {
  const decimalTotalSupply = new Decimal(totalSupply);
  // the following check avoids division by zero when total supply is zero
  // (case in which a pair has been created but liquidity has never been proviided)
  const priceDenominator = decimalTotalSupply.isZero()
    ? '1'
    : parseUnits(
        new Decimal(totalSupply).toFixed(pair.liquidityToken.decimals),
        pair.liquidityToken.decimals,
      ).toString();
  return new Price(
    pair.liquidityToken,
    nativeCurrency,
    priceDenominator,
    parseUnits(new Decimal(reserveNativeCurrency).toFixed(nativeCurrency.decimals), nativeCurrency.decimals).toString(),
  );
}

export function toLiquidityMiningCampaign(
  chainId,
  targetedPair,
  targetedPairLpTokenTotalSupply,
  targetedPairReserveNativeCurrency,
  campaign,
  nativeCurrency,
) {
  const rewards = campaign.rewards.map((reward) => {
    const rewardToken = reward.token;
    const properRewardToken = new Token(
      chainId,
      getAddress(rewardToken.id),
      parseInt(rewardToken.decimals),
      rewardToken.symbol,
      rewardToken.name,
    );

    const rewardTokenPriceNativeCurrency = new Price(
      properRewardToken,
      nativeCurrency,
      parseUnits('1', nativeCurrency.decimals).toString(),
      parseUnits(
        new Decimal(rewardToken.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
        nativeCurrency.decimals,
      ).toString(),
    );

    const pricedRewardToken = new PricedToken(
      chainId,
      getAddress(rewardToken.id),
      parseInt(rewardToken.decimals),
      rewardTokenPriceNativeCurrency,
      rewardToken.symbol,
      rewardToken.name,
    );
    return new PricedTokenAmount(pricedRewardToken, parseUnits(reward.amount, rewardToken.decimals).toString());
  });
  const lpTokenPriceNativeCurrency = getLpTokenPrice(
    targetedPair,
    nativeCurrency,
    targetedPairLpTokenTotalSupply,
    targetedPairReserveNativeCurrency,
  );
  const stakedPricedToken = new PricedToken(
    chainId,
    getAddress(targetedPair.liquidityToken.address),
    targetedPair.liquidityToken.decimals,
    lpTokenPriceNativeCurrency,
    targetedPair.liquidityToken.symbol,
    targetedPair.liquidityToken.name,
  );
  const staked = new PricedTokenAmount(
    stakedPricedToken,
    parseUnits(campaign.stakedAmount, stakedPricedToken.decimals).toString(),
  );
  return new LiquidityMiningCampaign(
    campaign.startsAt,
    campaign.endsAt,
    targetedPair,
    rewards,
    staked,
    campaign.locked,
    new TokenAmount(
      targetedPair.liquidityToken,
      parseUnits(campaign.stakingCap, targetedPair.liquidityToken.decimals).toString(),
    ),
    getAddress(campaign.id),
  );
}

export function getStakedAmountUSD(campaign, nativeCurrencyUSDPrice, nativeCurrency) {
  const nativeCurrencyPrice = new Price(
    nativeCurrency,
    USD,
    parseUnits('1', USD.decimals).toString(),
    parseUnits(new Decimal(nativeCurrencyUSDPrice).toFixed(18), USD.decimals).toString(),
  );
  return CurrencyAmount.usd(
    parseUnits(
      campaign.staked.nativeCurrencyAmount.multiply(nativeCurrencyPrice).toFixed(USD.decimals),
      USD.decimals,
    ).toString(),
  );
}

/**
 * Given a URI that may be ipfs, ipns, http, or https protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export function uriToHttp(uri) {
  const protocol = uri.split(':')[0].toLowerCase();
  switch (protocol) {
    case 'https':
      return [uri];
    case 'http':
      return ['https' + uri.substr(4)];
    case 'ipfs':
      const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
      return [`https://ipfs.io/ipfs/${hash}/`];
    case 'ipns':
      const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
      return [`https://cloudflare-ipfs.com/ipns/${name}/`, `https://ipfs.io/ipns/${name}/`];
    default:
      return [];
  }
}

export function chunk(arr, chunkSize) {
  const chunked = [];

  for (let i = 0, len = arr.length; i < len; i += chunkSize) {
    chunked.push(arr.slice(i, i + chunkSize));
  }

  return chunked;
}
