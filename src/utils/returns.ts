import dayjs from 'dayjs';

import { USER_MINTS_BUNRS_PER_PAIR } from '../apollo/queries';

import { getShareValueOverTime } from '.';

export const priceOverrides = [
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
];

interface ReturnMetrics {
  hodleReturn: number; // difference in asset values t0 -> t1 with t0 deposit amounts
  netReturn: number; // net return from t0 -> t1
  swaprReturn: number; // netReturn - hodlReturn
  impLoss: number;
  fees: number;
}

// used to calculate returns within a given window bounded by two positions
interface Position {
  pair: any;
  liquidityTokenBalance: number;
  liquidityTokenTotalSupply: number;
  reserve0: number;
  reserve1: number;
  reserveUSD: number;
  token0PriceUSD: number;
  token1PriceUSD: number;
}

const PRICE_DISCOVERY_START_TIMESTAMP = 1589747086;

async function getPrincipalForUserPerPair(client, user: string, pairAddress: string) {
  let usd = 0;
  let amount0 = 0;
  let amount1 = 0;

  // get all minst and burns to get principal amounts
  const results = await client.query({
    query: USER_MINTS_BUNRS_PER_PAIR,
    variables: {
      user,
      pair: pairAddress,
    },
  });

  for (const index in results.data.mints) {
    const mint = results.data.mints[index];
    const mintToken0 = mint.pair.token0.id;
    const mintToken1 = mint.pair.token1.id;

    // if trackign before prices were discovered (pre-launch days), hardcode stablecoins
    if (priceOverrides.includes(mintToken0) && mint.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(mint.amount0) * 2;
    } else if (priceOverrides.includes(mintToken1) && mint.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(mint.amount1) * 2;
    } else {
      usd += parseFloat(mint.amountUSD);
    }
    amount0 += parseFloat(mint.amount0);
    amount1 += parseFloat(mint.amount1);
  }

  for (const index in results.data.burns) {
    const burn = results.data.burns[index];
    const burnToken0 = burn.pair.token0.id;
    const burnToken1 = burn.pair.token1.id;

    // if tracking before prices were discovered (pre-launch days), hardcode stablecoins
    if (priceOverrides.includes(burnToken0) && burn.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(burn.amount0) * 2;
    } else if (priceOverrides.includes(burnToken1) && burn.timestamp < PRICE_DISCOVERY_START_TIMESTAMP) {
      usd += parseFloat(burn.amount1) * 2;
    } else {
      usd -= parseFloat(burn.amountUSD);
    }

    amount0 -= parseFloat(burn.amount0);
    amount1 -= parseFloat(burn.amount1);
  }

  return { usd, amount0, amount1 };
}

/**
 * Core algorithm for calculating retursn within one time window.
 * @param positionT0 // users liquidity info and token rates at beginning of window
 * @param positionT1 // '' at the end of the window
 */
export function getMetricsForPositionWindow(positionT0, positionT1): ReturnMetrics {
  // calculate ownership at ends of window, for end of window we need original LP token balance / new total supply
  const t0Ownership =
    Number(positionT0.liquidityTokenTotalSupply) === 0
      ? 0
      : Number(positionT0.liquidityTokenBalance) / Number(positionT0.liquidityTokenTotalSupply);
  const t1Ownership =
    Number(positionT1.liquidityTokenTotalSupply) === 0
      ? 0
      : Number(positionT0.liquidityTokenBalance) / Number(positionT1.liquidityTokenTotalSupply);

  // get starting amounts of token0 and token1 deposited by LP
  const token0_amount_t0 = t0Ownership * Number(positionT0.reserve0);
  const token1_amount_t0 = t0Ownership * Number(positionT0.reserve1);

  // get current token values
  const token0_amount_t1 = t1Ownership * Number(positionT1.reserve0);
  const token1_amount_t1 = t1Ownership * Number(positionT1.reserve1);

  // calculate squares to find imp loss and fee differences
  const sqrK_t0 = Math.sqrt(token0_amount_t0 * token1_amount_t0);
  // eslint-disable-next-line eqeqeq
  const priceRatioT1 =
    Number(positionT1.token0PriceUSD) !== 0 ? Number(positionT1.token1PriceUSD) / Number(positionT1.token0PriceUSD) : 0;

  const token0_amount_no_fees = positionT1.token1PriceUSD && priceRatioT1 ? sqrK_t0 * Math.sqrt(priceRatioT1) : 0;
  const token1_amount_no_fees =
    Number(positionT1.token1PriceUSD) && priceRatioT1 ? sqrK_t0 / Math.sqrt(priceRatioT1) : 0;
  const no_fees_usd =
    token0_amount_no_fees * Number(positionT1.token0PriceUSD) +
    token1_amount_no_fees * Number(positionT1.token1PriceUSD);

  const difference_fees_token0 = token0_amount_t1 - token0_amount_no_fees;
  const difference_fees_token1 = token1_amount_t1 - token1_amount_no_fees;
  const difference_fees_usd =
    difference_fees_token0 * Number(positionT1.token0PriceUSD) +
    difference_fees_token1 * Number(positionT1.token1PriceUSD);

  // calculate USD value at t0 and t1 using initial token deposit amounts for asset return
  const assetValueT0 =
    token0_amount_t0 * Number(positionT0.token0PriceUSD) + token1_amount_t0 * Number(positionT0.token1PriceUSD);
  const assetValueT1 =
    token0_amount_t0 * Number(positionT1.token0PriceUSD) + token1_amount_t0 * Number(positionT1.token1PriceUSD);

  const imp_loss_usd = no_fees_usd - assetValueT1;
  const swapr_return = difference_fees_usd + imp_loss_usd;

  // get net value change for combined data
  const netValueT0 = t0Ownership * Number(positionT0.reserveUSD);
  const netValueT1 = t1Ownership * Number(positionT1.reserveUSD);

  return {
    hodleReturn: assetValueT1 - assetValueT0,
    netReturn: netValueT1 - netValueT0,
    swaprReturn: swapr_return,
    impLoss: imp_loss_usd,
    fees: difference_fees_usd,
  };
}

/**
 * formats data for historical chart for an LPs position in 1 pair over time
 * @param startDateTimestamp // day to start tracking at
 * @param currentPairData // current stat of the pair
 * @param pairSnapshots // history of entries and exits for lp on this pair
 * @param currentNativeCurrencyPrice // current price of native currency used for usd conversions
 */
export async function getHistoricalPairReturns(
  client,
  blockClient,
  startDateTimestamp,
  currentPairData,
  pairSnapshots,
  currentNativeCurrencyPrice,
) {
  // catch case where data not puplated yet
  if (!currentPairData.createdAtTimestamp) {
    return [];
  }
  let dayIndex: number = Math.round(startDateTimestamp / 86400); // get unique day bucket unix
  const currentDayIndex: number = Math.round(dayjs.utc().unix() / 86400);
  const sortedPositions = mergeLiquiditySnapshot(pairSnapshots);

  if (sortedPositions[0].timestamp > startDateTimestamp) {
    dayIndex = Math.round(sortedPositions[0].timestamp / 86400);
  }

  const dayTimestamps = [];
  while (dayIndex < currentDayIndex) {
    // only account for days where this pair existed
    if (dayIndex * 86400 >= parseInt(currentPairData.createdAtTimestamp)) {
      dayTimestamps.push(dayIndex * 86400);
    }
    dayIndex = dayIndex + 1;
  }

  const shareValues = await getShareValueOverTime(client, blockClient, currentPairData.id, dayTimestamps);
  const shareValuesFormatted = {};
  shareValues?.map((share) => {
    shareValuesFormatted[share.timestamp] = share;
  });

  // set the default position and data
  let positionT0 = sortedPositions[0];
  const formattedHistory = [];
  let netFees = 0;

  // keep track of up to date metrics as we parse each day
  for (const index in dayTimestamps) {
    // get the bounds on the day
    const dayTimestamp = dayTimestamps[index];
    const timestampCeiling = dayTimestamp + 86400;

    // for each change in position value that day, create a window and update
    const dailyChanges = sortedPositions.filter((snapshot) => {
      return snapshot.timestamp < timestampCeiling && snapshot.timestamp > dayTimestamp;
    });

    for (let i = 0; i < dailyChanges.length; i++) {
      const positionT1 = dailyChanges[i];
      const localReturns = getMetricsForPositionWindow(positionT0, positionT1);
      netFees = netFees + localReturns.fees;
      positionT0 = positionT1;
    }

    // now treat the end of the day as a hypothetical position
    let positionT1 = shareValuesFormatted[dayTimestamp + 86400];
    if (!positionT1) {
      positionT1 = {
        pair: currentPairData.id,
        liquidityTokenBalance: positionT0.liquidityTokenBalance,
        totalSupply: currentPairData.totalSupply,
        reserve0: currentPairData.reserve0,
        reserve1: currentPairData.reserve1,
        reserveUSD: currentPairData.reserveUSD,
        token0PriceUSD: currentPairData.token0.derivedNativeCurrency * currentNativeCurrencyPrice,
        token1PriceUSD: currentPairData.token1.derivedNativeCurrency * currentNativeCurrencyPrice,
      };
    }

    if (positionT1) {
      positionT1.liquidityTokenTotalSupply = positionT1.totalSupply;
      positionT1.liquidityTokenBalance = positionT0.liquidityTokenBalance;
      const currentLiquidityValue =
        (parseFloat(positionT1.liquidityTokenBalance) / parseFloat(positionT1.liquidityTokenTotalSupply)) *
        parseFloat(positionT1.reserveUSD);
      const localReturns = getMetricsForPositionWindow(positionT0, positionT1);
      const localFees = netFees + localReturns.fees;

      formattedHistory.push({
        date: dayTimestamp,
        usdValue: currentLiquidityValue,
        fees: localFees,
      });
    }
  }

  return formattedHistory;
}

/**
 * For a given pair and user, get the return metrics
 * @param user
 * @param pair
 * @param nativeCurrencyPrice
 */
export async function getLPReturnsOnPair(client, user: string, pair, nativeCurrencyPrice: number, snapshots) {
  // initialize values
  const principal = await getPrincipalForUserPerPair(client, user, pair.id);
  let netReturn = 0;
  let swaprReturn = 0;
  let fees = 0;

  snapshots = snapshots.filter((entry) => {
    return entry.pair.id === pair.id;
  });

  // snaphots to be used for the fees computation
  const derivedSnapshots = mergeLiquiditySnapshot(snapshots);

  // get data about the current position
  const derivedCurrentPosition: Position = {
    pair,
    liquidityTokenBalance: derivedSnapshots[derivedSnapshots.length - 1]?.liquidityTokenBalance,
    liquidityTokenTotalSupply: pair.totalSupply,
    reserve0: pair.reserve0,
    reserve1: pair.reserve1,
    reserveUSD: pair.reserveUSD,
    token0PriceUSD: pair.token0.derivedNativeCurrency * nativeCurrencyPrice,
    token1PriceUSD: pair.token1.derivedNativeCurrency * nativeCurrencyPrice,
  };

  for (const index in derivedSnapshots) {
    // get positions at both bounds of the window
    const positionT0 = derivedSnapshots[index];
    const positionT1 =
      parseInt(index) === derivedSnapshots.length - 1 ? derivedCurrentPosition : derivedSnapshots[parseInt(index) + 1];

    const results = getMetricsForPositionWindow(positionT0, positionT1);
    netReturn = netReturn + results.netReturn;
    swaprReturn = swaprReturn + results.swaprReturn;
    fees = fees + results.fees;
  }

  return {
    principal,
    net: {
      return: netReturn,
    },
    swapr: {
      return: swaprReturn,
    },
    fees: {
      sum: fees,
    },
  };
}

/**
 * Sanitizes the liquidityPositionSnapshots by merging the liquidityMiningPositionSnapshots back
 * into the liquidity position when the two happened in the same timestamp.
 *
 * @param snapshots Array of liquidity and mining snaphots
 * @returns Array of merged snapshots, without the mining positions
 */
export function mergeLiquiditySnapshot(snapshots: any[]): any[] {
  // aggregate snapshots by timestamp to obtain an object like
  // {
  //   0: {
  //     LiquidityMiningPositionSnapshot: { ... },
  //     LiquidityPositionSnapshot: { ... }
  //   },
  //   1: { ... }
  // }
  const snapshotsPerTimestamp = snapshots.reduce(
    (accumulator, snapshot) => ({
      ...accumulator,
      [snapshot.timestamp]: {
        ...accumulator[snapshot.timestamp],
        [snapshot.__typename]: {
          ...(accumulator[snapshot.timestamp] ? accumulator[snapshot.timestamp][snapshot.__typename] : {}),
          ...snapshot,
        },
      },
    }),
    {},
  );

  // merge the snapshots and add the LP amount back to the liquidityPosition snapshot
  // if there's a liquidityMiningPositionSnapshot at the same timestamp.
  // the user still owns the LP tokens so the liquidityPosition should still have the amount
  const mergedSnapshots = Object.keys(snapshotsPerTimestamp).reduce((accumulator, current) => {
    if (
      snapshotsPerTimestamp[current].LiquidityMiningPositionSnapshot &&
      snapshotsPerTimestamp[current].LiquidityPositionSnapshot
    ) {
      return {
        ...accumulator,
        [current]: {
          LiquidityPositionSnapshot: {
            ...accumulator[snapshotsPerTimestamp[current]]?.LiquidityPositionSnapshot,
            ...snapshotsPerTimestamp[current].LiquidityPositionSnapshot,
            liquidityTokenBalance: snapshotsPerTimestamp[current].LiquidityMiningPositionSnapshot.liquidityTokenBalance,
          },
        },
      };
    }

    return {
      ...accumulator,
      [current]: {
        ...accumulator[snapshotsPerTimestamp[current]],
        ...snapshotsPerTimestamp[current],
      },
    };
  }, {});

  // snaphots to be used for the fees computation
  const derivedSnapshots = Object.values(mergedSnapshots)
    .filter((mergedSnapshot: any) => mergedSnapshot.LiquidityPositionSnapshot)
    .map((mergedSnapshot: any) => ({
      ...mergedSnapshot.LiquidityPositionSnapshot,
    }))
    .sort((first, second) => first.timestamp - second.timestamp);

  return derivedSnapshots;
}
