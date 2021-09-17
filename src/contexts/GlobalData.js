import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useTimeframe } from "./Application";
import {
  getPercentChange,
  getBlockFromTimestamp,
  getBlocksFromTimestamps,
  get2DayPercentChange,
  getTimeframe,
} from "../utils";
import {
  GLOBAL_DATA,
  GLOBAL_TXNS,
  GLOBAL_CHART,
  NATIVE_CURRENCY_PRICE,
  ALL_PAIRS,
  ALL_TOKENS,
  TOP_LPS_PER_PAIRS,
} from "../apollo/queries";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { useAllPairData } from "./PairData";
import { FACTORY_ADDRESS } from "../constants";
import {
  useBlocksSubgraphClient,
  useSelectedNetwork,
  useSwaprSubgraphClient,
} from "./Network";

const UPDATE = "UPDATE";
const UPDATE_TXNS = "UPDATE_TXNS";
const UPDATE_CHART = "UPDATE_CHART";
const UPDATE_NATIVE_CURRENCY_PRICE = "UPDATE_NATIVE_CURRENCY_PRICE";
const NATIVE_CURRENCY_PRICE_KEY = "NATIVE_CURRENCY_PRICE_KEY";
const UPDATE_ALL_PAIRS_IN_SWAPR = "UPDAUPDATE_ALL_PAIRS_IN_SWAPRTE_TOP_PAIRS";
const UPDATE_ALL_TOKENS_IN_SWAPR = "UPDATE_ALL_TOKENS_IN_SWAPR";
const UPDATE_TOP_LPS = "UPDATE_TOP_LPS";
const RESET = "RESET";

// format dayjs with the libraries that we need
dayjs.extend(utc);
dayjs.extend(weekOfYear);

const GlobalDataContext = createContext();

export function useGlobalDataContext() {
  return useContext(GlobalDataContext);
}

const INITIAL_STATE = {};

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { data } = payload;
      return {
        ...state,
        globalData: data,
      };
    }
    case UPDATE_TXNS: {
      const { transactions } = payload;
      return {
        ...state,
        transactions,
      };
    }
    case UPDATE_CHART: {
      const { daily, weekly } = payload;
      return {
        ...state,
        chartData: {
          daily,
          weekly,
        },
      };
    }
    case UPDATE_NATIVE_CURRENCY_PRICE: {
      const {
        nativeCurrencyPrice,
        oneDayPrice,
        nativeCurrencyPriceChange,
      } = payload;
      return {
        [NATIVE_CURRENCY_PRICE_KEY]: nativeCurrencyPrice,
        oneDayPrice,
        nativeCurrencyPriceChange,
      };
    }

    case UPDATE_ALL_PAIRS_IN_SWAPR: {
      const { allPairs } = payload;
      return {
        ...state,
        allPairs,
      };
    }

    case UPDATE_ALL_TOKENS_IN_SWAPR: {
      const { allTokens } = payload;
      return {
        ...state,
        allTokens,
      };
    }

    case UPDATE_TOP_LPS: {
      const { topLps } = payload;
      return {
        ...state,
        topLps,
      };
    }

    case RESET: {
      return INITIAL_STATE;
    }

    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`);
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const update = useCallback((data) => {
    dispatch({
      type: UPDATE,
      payload: {
        data,
      },
    });
  }, []);

  const updateTransactions = useCallback((transactions) => {
    dispatch({
      type: UPDATE_TXNS,
      payload: {
        transactions,
      },
    });
  }, []);

  const updateChart = useCallback((daily, weekly) => {
    dispatch({
      type: UPDATE_CHART,
      payload: {
        daily,
        weekly,
      },
    });
  }, []);

  const updateNativeCurrencyPrice = useCallback(
    (nativeCurrencyPrice, oneDayPrice, nativeCurrencyPriceChange) => {
      dispatch({
        type: UPDATE_NATIVE_CURRENCY_PRICE,
        payload: {
          nativeCurrencyPrice,
          oneDayPrice,
          nativeCurrencyPriceChange,
        },
      });
    },
    []
  );

  const updateAllPairsInSwapr = useCallback((allPairs) => {
    dispatch({
      type: UPDATE_ALL_PAIRS_IN_SWAPR,
      payload: {
        allPairs,
      },
    });
  }, []);

  const updateAllTokensInSwapr = useCallback((allTokens) => {
    dispatch({
      type: UPDATE_ALL_TOKENS_IN_SWAPR,
      payload: {
        allTokens,
      },
    });
  }, []);

  const updateTopLps = useCallback((topLps) => {
    dispatch({
      type: UPDATE_TOP_LPS,
      payload: {
        topLps,
      },
    });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: RESET });
  }, []);

  return (
    <GlobalDataContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update,
            updateTransactions,
            updateChart,
            updateNativeCurrencyPrice,
            updateTopLps,
            updateAllPairsInSwapr,
            updateAllTokensInSwapr,
            reset,
          },
        ],
        [
          state,
          update,
          updateTransactions,
          updateTopLps,
          updateChart,
          updateNativeCurrencyPrice,
          updateAllPairsInSwapr,
          updateAllTokensInSwapr,
          reset,
        ]
      )}
    >
      {children}
    </GlobalDataContext.Provider>
  );
}

/**
 * Gets all the global data for the overview page.
 * Needs current native currency price and the old native currency price to get
 * 24 hour USD changes.
 * @param {*} nativeCurrencyPrice
 * @param {*} oldNativeCurrencyPrice
 */
async function getGlobalData(
  factoryAddress,
  client,
  blockClient,
  nativeCurrencyPrice,
  oldNativeCurrencyPrice
) {
  // data for each day , historic data used for % changes
  let data = {};
  let oneDayData = {};
  let twoDayData = {};

  try {
    // get timestamps for the days
    const utcCurrentTime = dayjs();
    const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
    const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
    const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
    const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();

    // get the blocks needed for time travel queries
    let [
      oneDayBlock,
      twoDayBlock,
      oneWeekBlock,
      twoWeekBlock,
    ] = await getBlocksFromTimestamps(blockClient, [
      utcOneDayBack,
      utcTwoDaysBack,
      utcOneWeekBack,
      utcTwoWeeksBack,
    ]);

    // fetch the global data
    let result = await client.query({
      query: GLOBAL_DATA(factoryAddress),
      fetchPolicy: "network-only",
    });
    data = result.data.swaprFactories[0];

    // fetch the historical data
    let oneDayResult = await client.query({
      query: GLOBAL_DATA(factoryAddress, oneDayBlock?.number),
      fetchPolicy: "network-only",
    });
    oneDayData = oneDayResult.data.swaprFactories[0];

    let twoDayResult = await client.query({
      query: GLOBAL_DATA(factoryAddress, twoDayBlock?.number),
      fetchPolicy: "network-only",
    });
    twoDayData = twoDayResult.data.swaprFactories[0];

    let oneWeekResult = await client.query({
      query: GLOBAL_DATA(factoryAddress, oneWeekBlock?.number),
      fetchPolicy: "network-only",
    });
    const oneWeekData = oneWeekResult.data.swaprFactories[0];

    let twoWeekResult = await client.query({
      query: GLOBAL_DATA(factoryAddress, twoWeekBlock?.number),
      fetchPolicy: "network-only",
    });
    const twoWeekData = twoWeekResult.data.swaprFactories[0];

    // format the total liquidity in USD
    data.totalLiquidityUSD =
      data.totalLiquidityNativeCurrency * nativeCurrencyPrice;
    if (data && oneDayData && twoDayData && twoWeekData) {
      let [oneDayVolumeUSD, volumeChangeUSD] = get2DayPercentChange(
        data.totalVolumeUSD,
        oneDayData.totalVolumeUSD ? oneDayData.totalVolumeUSD : 0,
        twoDayData.totalVolumeUSD ? twoDayData.totalVolumeUSD : 0
      );

      const [oneWeekVolume, weeklyVolumeChange] = get2DayPercentChange(
        data.totalVolumeUSD,
        oneWeekData.totalVolumeUSD,
        twoWeekData.totalVolumeUSD
      );

      const [oneDayTxns, txnChange] = get2DayPercentChange(
        data.txCount,
        oneDayData.txCount ? oneDayData.txCount : 0,
        twoDayData.txCount ? twoDayData.txCount : 0
      );

      const liquidityChangeUSD = getPercentChange(
        data.totalLiquidityNativeCurrency * nativeCurrencyPrice,
        oneDayData.totalLiquidityNativeCurrency * oldNativeCurrencyPrice
      );

      // add relevant fields with the calculated amounts
      data.oneDayVolumeUSD = oneDayVolumeUSD;
      data.oneWeekVolume = oneWeekVolume;
      data.weeklyVolumeChange = weeklyVolumeChange;
      data.volumeChangeUSD = volumeChangeUSD;
      data.liquidityChangeUSD = liquidityChangeUSD;
      data.oneDayTxns = oneDayTxns;
      data.txnChange = txnChange;
    }
  } catch (e) {
    console.log(e);
  }

  return data;
}

/**
 * Get historical data for volume and liquidity used in global charts
 * on main page
 * @param {*} oldestDateToFetch // start of window to fetch from
 */
const getChartData = async (client, oldestDateToFetch) => {
  let data = [];
  let weeklyData = [];
  const utcEndTime = dayjs.utc();
  let skip = 0;
  let allFound = false;

  try {
    while (!allFound) {
      let result = await client.query({
        query: GLOBAL_CHART,
        variables: {
          startTime: oldestDateToFetch,
          skip,
        },
        fetchPolicy: "network-only",
      });
      skip += 1000;
      data = data.concat(result.data.swaprDayDatas);
      if (result.data.swaprDayDatas.length < 1000) {
        allFound = true;
      }
    }

    if (data && data.length > 0) {
      let dayIndexSet = new Set();
      let dayIndexArray = [];
      const oneDay = 24 * 60 * 60;

      // for each day, parse the daily volume and format for chart array
      data.forEach((dayData, i) => {
        // add the day index to the set of days
        dayIndexSet.add((data[i].date / oneDay).toFixed(0));
        dayIndexArray.push(data[i]);
        dayData.dailyVolumeUSD = parseFloat(dayData.dailyVolumeUSD);
      });

      // fill in empty days ( there will be no day datas if no trades made that day )
      let timestamp = data[0].date ? data[0].date : oldestDateToFetch;
      let latestLiquidityUSD = data[0].totalLiquidityUSD;
      let latestDayDats = data[0].mostLiquidTokens;
      let index = 1;
      while (timestamp < utcEndTime.unix() - oneDay) {
        const nextDay = timestamp + oneDay;
        let currentDayIndex = (nextDay / oneDay).toFixed(0);
        if (!dayIndexSet.has(currentDayIndex)) {
          data.push({
            date: nextDay,
            dailyVolumeUSD: 0,
            totalLiquidityUSD: latestLiquidityUSD,
            mostLiquidTokens: latestDayDats,
          });
        } else {
          latestLiquidityUSD = dayIndexArray[index].totalLiquidityUSD;
          latestDayDats = dayIndexArray[index].mostLiquidTokens;
          index = index + 1;
        }
        timestamp = nextDay;
      }
    }

    // format weekly data for weekly sized chunks
    data = data.sort((a, b) => (parseInt(a.date) > parseInt(b.date) ? 1 : -1));
    let startIndexWeekly = -1;
    let currentWeek = -1;
    data.forEach((entry, i) => {
      const week = dayjs.utc(dayjs.unix(data[i].date)).week();
      if (week !== currentWeek) {
        currentWeek = week;
        startIndexWeekly++;
      }
      weeklyData[startIndexWeekly] = weeklyData[startIndexWeekly] || {};
      weeklyData[startIndexWeekly].date = data[i].date;
      weeklyData[startIndexWeekly].weeklyVolumeUSD =
        (weeklyData[startIndexWeekly].weeklyVolumeUSD ?? 0) +
        data[i].dailyVolumeUSD;
    });
  } catch (e) {
    console.log(e);
  }
  return [data, weeklyData];
};

/**
 * Get and format transactions for global page
 */
const getGlobalTransactions = async (client) => {
  let transactions = {};

  try {
    let result = await client.query({
      query: GLOBAL_TXNS,
      fetchPolicy: "network-only",
    });
    transactions.mints = [];
    transactions.burns = [];
    transactions.swaps = [];
    result?.data?.transactions &&
      result.data.transactions.map((transaction) => {
        if (transaction.mints.length > 0) {
          transaction.mints.map((mint) => {
            return transactions.mints.push(mint);
          });
        }
        if (transaction.burns.length > 0) {
          transaction.burns.map((burn) => {
            return transactions.burns.push(burn);
          });
        }
        if (transaction.swaps.length > 0) {
          transaction.swaps.map((swap) => {
            return transactions.swaps.push(swap);
          });
        }
        return true;
      });
  } catch (e) {
    console.log(e);
  }

  return transactions;
};

/**
 * Gets the current price of the selected network's native currency, 24 hour price, and % change between them
 */
const getNativeCurrencyPrice = async (client, blockClient) => {
  const utcCurrentTime = dayjs();
  const utcOneDayBack = utcCurrentTime
    .subtract(1, "day")
    .startOf("minute")
    .unix();

  let nativeCurrencyPrice = 0;
  let nativeCurrencyPriceOneDay = 0;
  let priceChangeNativeCurrency = 0;

  try {
    let oneDayBlock = await getBlockFromTimestamp(blockClient, utcOneDayBack);
    let result = await client.query({
      query: NATIVE_CURRENCY_PRICE(),
      fetchPolicy: "network-only",
    });
    let resultOneDay = await client.query({
      query: NATIVE_CURRENCY_PRICE(oneDayBlock),
      fetchPolicy: "network-only",
    });
    const currentPrice = result?.data?.bundles[0]?.nativeCurrencyPrice;
    const oneDayBackPrice = resultOneDay?.data?.bundles[0]?.nativeCurrencyPrice;
    priceChangeNativeCurrency = getPercentChange(currentPrice, oneDayBackPrice);
    nativeCurrencyPrice = currentPrice;
    nativeCurrencyPriceOneDay = oneDayBackPrice;
  } catch (e) {
    console.log(e);
  }

  return [
    nativeCurrencyPrice,
    nativeCurrencyPriceOneDay,
    priceChangeNativeCurrency,
  ];
};

const PAIRS_TO_FETCH = 500;
const TOKENS_TO_FETCH = 500;

/**
 * Loop through every pair on swapr, used for search
 */
async function getAllPairsOnSwapr(client) {
  try {
    let allFound = false;
    let pairs = [];
    let skipCount = 0;
    while (!allFound) {
      let result = await client.query({
        query: ALL_PAIRS,
        variables: {
          skip: skipCount,
        },
        fetchPolicy: "network-only",
      });
      skipCount = skipCount + PAIRS_TO_FETCH;
      pairs = pairs.concat(result?.data?.pairs);
      if (
        result?.data?.pairs.length < PAIRS_TO_FETCH ||
        pairs.length > PAIRS_TO_FETCH
      ) {
        allFound = true;
      }
    }
    return pairs;
  } catch (e) {
    console.log(e);
  }
}

/**
 * Loop through every token on swapr, used for search
 */
async function getAllTokensOnSwapr(client) {
  try {
    let allFound = false;
    let skipCount = 0;
    let tokens = [];
    while (!allFound) {
      let result = await client.query({
        query: ALL_TOKENS,
        variables: {
          skip: skipCount,
        },
        fetchPolicy: "network-only",
      });
      tokens = tokens.concat(result?.data?.tokens);
      if (
        result?.data?.tokens?.length < TOKENS_TO_FETCH ||
        tokens.length > TOKENS_TO_FETCH
      ) {
        allFound = true;
      }
      skipCount = skipCount += TOKENS_TO_FETCH;
    }
    return tokens;
  } catch (e) {
    console.log(e);
  }
}

/**
 * Hook that fetches overview data, plus all tokens and pairs for search
 */
export function useGlobalData() {
  const client = useSwaprSubgraphClient();
  const blockClient = useBlocksSubgraphClient();
  const [
    state,
    { update, updateAllPairsInSwapr, updateAllTokensInSwapr },
  ] = useGlobalDataContext();
  const [
    nativeCurrencyPrice,
    oldNativeCurrencyPrice,
  ] = useNativeCurrencyPrice();
  const selectedNetwork = useSelectedNetwork();

  const data = state?.globalData;

  useEffect(() => {
    async function fetchData() {
      let globalData = await getGlobalData(
        FACTORY_ADDRESS[selectedNetwork],
        client,
        blockClient,
        nativeCurrencyPrice,
        oldNativeCurrencyPrice
      );
      globalData && update(globalData);

      let allPairs = await getAllPairsOnSwapr(client, blockClient);
      updateAllPairsInSwapr(allPairs);

      let allTokens = await getAllTokensOnSwapr(client, blockClient);
      updateAllTokensInSwapr(allTokens);
    }
    if (
      selectedNetwork &&
      !data &&
      nativeCurrencyPrice &&
      oldNativeCurrencyPrice
    ) {
      fetchData();
    }
  }, [
    nativeCurrencyPrice,
    oldNativeCurrencyPrice,
    update,
    data,
    updateAllPairsInSwapr,
    updateAllTokensInSwapr,
    client,
    blockClient,
    selectedNetwork,
  ]);

  return data || {};
}

export function useGlobalChartData() {
  const [state, { updateChart }] = useGlobalDataContext();
  const [oldestDateFetch, setOldestDateFetched] = useState();
  const [activeWindow] = useTimeframe();
  const client = useSwaprSubgraphClient();

  const chartDataDaily = state?.chartData?.daily;
  const chartDataWeekly = state?.chartData?.weekly;

  /**
   * Keep track of oldest date fetched. Used to
   * limit data fetched until its actually needed.
   * (dont fetch year long stuff unless year option selected)
   */
  useEffect(() => {
    // based on window, get starttime
    let startTime = getTimeframe(activeWindow);

    if ((activeWindow && startTime < oldestDateFetch) || !oldestDateFetch) {
      setOldestDateFetched(startTime);
    }
  }, [activeWindow, oldestDateFetch]);

  /**
   * Fetch data if none fetched or older data is needed
   */
  useEffect(() => {
    async function fetchData() {
      // historical stuff for chart
      let [newChartData, newWeeklyData] = await getChartData(
        client,
        oldestDateFetch
      );
      updateChart(newChartData, newWeeklyData);
    }
    if (oldestDateFetch && !(chartDataDaily && chartDataWeekly)) {
      fetchData();
    }
  }, [chartDataDaily, chartDataWeekly, oldestDateFetch, updateChart, client]);

  return [chartDataDaily, chartDataWeekly];
}

export function useGlobalTransactions() {
  const client = useSwaprSubgraphClient();
  const blockClient = useBlocksSubgraphClient();
  const [state, { updateTransactions }] = useGlobalDataContext();
  const transactions = state?.transactions;
  useEffect(() => {
    async function fetchData() {
      if (!transactions) {
        let txns = await getGlobalTransactions(client, blockClient);
        updateTransactions(txns);
      }
    }
    fetchData();
  }, [updateTransactions, transactions, client, blockClient]);
  return transactions;
}

export function useNativeCurrencyPrice() {
  const client = useSwaprSubgraphClient();
  const blockClient = useBlocksSubgraphClient();
  const [state, { updateNativeCurrencyPrice }] = useGlobalDataContext();
  const nativeCurrencyPrice = state?.[NATIVE_CURRENCY_PRICE_KEY];
  const nativeCurrencyPriceOld = state?.["oneDayPrice"];

  useEffect(() => {
    async function checkForNativeCurrencyPrice() {
      let [newPrice, oneDayPrice, priceChange] = await getNativeCurrencyPrice(
        client,
        blockClient
      );
      if (newPrice !== nativeCurrencyPrice) {
        updateNativeCurrencyPrice(newPrice, oneDayPrice, priceChange);
      }
    }
    checkForNativeCurrencyPrice();
  }, [updateNativeCurrencyPrice, nativeCurrencyPrice, client, blockClient]);

  return [nativeCurrencyPrice, nativeCurrencyPriceOld];
}

export function useAllPairsInSwapr() {
  const [state] = useGlobalDataContext();
  let allPairs = state?.allPairs;

  return allPairs || [];
}

export function useAllTokensInSwapr() {
  const [state] = useGlobalDataContext();
  let allTokens = state?.allTokens;

  return allTokens || [];
}

/**
 * Get the top liquidity positions based on USD size
 * @TODO Not a perfect lookup needs improvement
 */
export function useTopLps(client) {
  const [state, { updateTopLps }] = useGlobalDataContext();
  let topLps = state?.topLps;

  const allPairs = useAllPairData();

  useEffect(() => {
    async function fetchData() {
      // get top 20 by reserves
      let topPairs = Object.keys(allPairs)
        ?.sort((a, b) =>
          parseFloat(allPairs[a].reserveUSD > allPairs[b].reserveUSD ? -1 : 1)
        )
        ?.slice(0, 99)
        .map((pair) => pair);

      let topLpLists = await Promise.all(
        topPairs.map(async (pair) => {
          // for each one, fetch top LPs
          try {
            const { data: results } = await client.query({
              query: TOP_LPS_PER_PAIRS,
              variables: {
                pair: pair.toString(),
              },
              fetchPolicy: "network-only",
            });
            if (results) {
              return results.liquidityPositions;
            }
          } catch (e) {
            console.error(e);
          }
        })
      );

      // get the top lps from the results formatted
      const topLps = [];
      topLpLists
        .filter((i) => !!i) // check for ones not fetched correctly
        .map((list) => {
          return list.map((entry) => {
            const pairData = allPairs[entry.pair.id];
            return topLps.push({
              user: entry.user,
              pairName: pairData.token0.symbol + "-" + pairData.token1.symbol,
              pairAddress: entry.pair.id,
              token0: pairData.token0.id,
              token1: pairData.token1.id,
              token0Symbol: pairData.token0.symbol,
              token1Symbol: pairData.token1.symbol,
              usd:
                (parseFloat(entry.liquidityTokenBalance) /
                  parseFloat(pairData.totalSupply)) *
                parseFloat(pairData.reserveUSD),
            });
          });
        });

      const sorted = topLps.sort((a, b) => (a.usd > b.usd ? -1 : 1));
      const shorter = sorted.splice(0, 100);
      updateTopLps(shorter);
    }

    if (!topLps && allPairs && Object.keys(allPairs).length > 0) {
      fetchData();
    }
  });

  return topLps;
}

export function useGlobalContextResetter() {
  const [, { reset }] = useGlobalDataContext();
  return reset;
}
