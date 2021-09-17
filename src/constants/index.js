export const SupportedNetwork = Object.freeze({
  MAINNET: "Mainnet",
  XDAI: "xDAI",
  ARBITRUM_ONE: "Arbitrum",
});

export const ChainId = Object.freeze({
  [SupportedNetwork.MAINNET]: 1,
  [SupportedNetwork.XDAI]: 100,
  [SupportedNetwork.ARBITRUM_ONE]: 42161,
});

export const SupportedNetworkForChainId = Object.freeze({
  [ChainId[SupportedNetwork.MAINNET]]: SupportedNetwork.MAINNET,
  [ChainId[SupportedNetwork.XDAI]]: SupportedNetwork.XDAI,
  [ChainId[SupportedNetwork.ARBITRUM_ONE]]: SupportedNetwork.ARBITRUM_ONE,
});

export const ChainIdForSupportedNetwork = Object.freeze({
  [SupportedNetwork.MAINNET]: ChainId[SupportedNetwork.MAINNET],
  [SupportedNetwork.XDAI]: ChainId[SupportedNetwork.XDAI],
  [SupportedNetwork.ARBITRUM_ONE]: ChainId[SupportedNetwork.ARBITRUM_ONE],
});

export const NETWORK_SUBGRAPH_URLS = Object.freeze({
  [SupportedNetwork.MAINNET]: "luzzif/swapr-mainnet-alpha",
  [SupportedNetwork.XDAI]: "luzzif/swapr-xdai",
  [SupportedNetwork.ARBITRUM_ONE]: "luzzif/swapr-arbitrum-one-v2",
});

export const FACTORY_ADDRESS = {
  [SupportedNetwork.MAINNET]: "0xd34971BaB6E5E356fd250715F5dE0492BB070452",
  [SupportedNetwork.XDAI]: "0x5d48c95adffd4b40c1aaadc4e08fc44117e02179",
  [SupportedNetwork.ARBITRUM_ONE]: "0x359f20ad0f42d75a5077e65f30274cabe6f4f01a",
};

export const NATIVE_CURRENCY_SYMBOL = {
  [SupportedNetwork.MAINNET]: "ETH",
  [SupportedNetwork.XDAI]: "xDAI",
  [SupportedNetwork.ARBITRUM_ONE]: "ETH",
};

export const NATIVE_CURRENCY_WRAPPER = {
  [SupportedNetwork.MAINNET]: {
    symbol: "WETH",
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  },
  [SupportedNetwork.XDAI]: {
    symbol: "WXDAI",
    address: "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
  },
  [SupportedNetwork.ARBITRUM_ONE]: {
    symbol: "WETH",
    address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  },
};

export const DXD_ADDRESS = {
  [SupportedNetwork.MAINNET]: "0xa1d65E8fB6e87b60FECCBc582F7f97804B725521",
  [SupportedNetwork.XDAI]: "0xb90d6bec20993be5d72a5ab353343f7a0281f158",
  [SupportedNetwork.ARBITRUM_ONE]: "0xc3ae0333f0f34aa734d5493276223d95b8f9cb37",
};

export const SWPR_ADDRESS = {
  [SupportedNetwork.MAINNET]: "0x6cacdb97e3fc8136805a9e7c342d866ab77d0957",
  [SupportedNetwork.ARBITRUM_ONE]: "0xde903e2712288a1da82942dddf2c20529565ac30",
};

export const ETHERSCAN_PREFIXES = {
  [SupportedNetwork.MAINNET]: "",
};

export const BUNDLE_ID = "1";

export const timeframeOptions = {
  WEEK: "1 week",
  MONTH: "1 month",
  // THREE_MONTHS: '3 months',
  // YEAR: '1 year',
  ALL_TIME: "All time",
};

// hide from overview list
export const OVERVIEW_TOKEN_BLACKLIST = [
  "0x495c7f3a713870f68f8b418b355c085dfdc412c3",
  "0xc3761eb917cd790b30dad99f6cc5b4ff93c4f9ea",
  "0xe31debd7abff90b06bca21010dd860d8701fd901",
  "0xfc989fbb6b3024de5ca0144dc23c18a063942ac1",
];

// pair blacklist
export const PAIR_BLACKLIST = ["0xb6a741f37d6e455ebcc9f17e2c16d0586c3f57a5"];

/**
 * For tokens that cause erros on fee calculations
 */
export const FEE_WARNING_TOKENS = [
  "0xd46ba6d942050d489dbd938a2c909a5d5039a161",
];
