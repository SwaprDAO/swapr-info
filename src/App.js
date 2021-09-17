import React, { useState } from "react";
import styled from "styled-components";
import { Route, Switch, Redirect } from "react-router-dom";
import GlobalPage from "./pages/GlobalPage";
import TokenPage from "./pages/TokenPage";
import PairPage from "./pages/PairPage";
import { useGlobalData, useGlobalChartData } from "./contexts/GlobalData";
import { isAddress } from "./utils";
import AccountPage from "./pages/AccountPage";
import AllTokensPage from "./pages/AllTokensPage";
import AllPairsPage from "./pages/AllPairsPage";

import SideNav from "./components/SideNav";
import AccountLookup from "./pages/AccountLookup";
import {
  OVERVIEW_TOKEN_BLACKLIST,
  PAIR_BLACKLIST,
  SupportedNetwork,
} from "./constants";
import LocalLoader from "./components/LocalLoader";
import { useLatestBlocks } from "./contexts/Application";
import { useSelectedNetwork } from "./contexts/Network";

const AppWrapper = styled.div`
  position: relative;
  width: 100%;
`;
const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: ${({ open }) => (open ? "220px 1fr" : "220px 1fr")};

  @media screen and (max-width: 1400px) {
    grid-template-columns: 220px 1fr;
  }

  @media screen and (max-width: 1080px) {
    grid-template-columns: 1fr;
    max-width: 100vw;
    overflow: hidden;
    grid-gap: 0;
  }
`;

/* const Right = styled.div`
  position: fixed;
  right: 0;
  bottom: 0rem;
  z-index: 99;
  width: ${({ open }) => (open ? "220px" : "64px")};
  height: ${({ open }) => (open ? "fit-content" : "64px")};
  overflow: auto;
  background-color: ${({ theme }) => theme.bg1};
  @media screen and (max-width: 1400px) {
    display: none;
  }
`; */

const Center = styled.div`
  height: 100%;
  transition: width 0.25s ease;
  background-color: ${({ theme }) => theme.onlyLight};
`;

const WarningWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const WarningBanner = styled.div`
  background-color: #ff6871;
  padding: 1.5rem;
  color: white;
  width: 100%;
  text-align: center;
  font-weight: 500;
`;

/**
 * Wrap the component with the header and sidebar pinned tab
 */
const LayoutWrapper = ({ children, savedOpen, setSavedOpen }) => {
  return (
    <>
      <ContentWrapper open={savedOpen}>
        <SideNav />
        <Center id="center">{children}</Center>
        {/* TODO: uncomment once per-network pinning is a thing */}
        {/* <Right open={savedOpen}>
          <PinnedData open={savedOpen} setSavedOpen={setSavedOpen} />
        </Right> */}
      </ContentWrapper>
    </>
  );
};

const DEFAULT_BLOCK_DIFFERENCE_THRESHOLD = 30;

const BLOCK_DIFFERENCE_THRESHOLD = {
  [SupportedNetwork.MAINNET]: DEFAULT_BLOCK_DIFFERENCE_THRESHOLD,
  [SupportedNetwork.XDAI]: DEFAULT_BLOCK_DIFFERENCE_THRESHOLD,
  [SupportedNetwork.ARBITRUM_ONE]: 200, // Arbitrum one has multiple blocks in the same second
};

function App() {
  const [savedOpen, setSavedOpen] = useState(false);

  const globalData = useGlobalData();
  const globalChartData = useGlobalChartData();
  const [latestBlock, headBlock] = useLatestBlocks();
  const selectedNetwork = useSelectedNetwork();

  // show warning
  const showWarning =
    headBlock && latestBlock
      ? headBlock - latestBlock >
        (selectedNetwork
          ? BLOCK_DIFFERENCE_THRESHOLD[selectedNetwork] ||
            DEFAULT_BLOCK_DIFFERENCE_THRESHOLD
          : DEFAULT_BLOCK_DIFFERENCE_THRESHOLD)
      : false;

  return (
    <AppWrapper>
      {showWarning && (
        <WarningWrapper>
          <WarningBanner>
            {`Warning: The data on this site has only synced to block ${latestBlock} (out of ${headBlock}). Please check back soon.`}
          </WarningBanner>
        </WarningWrapper>
      )}
      {globalData &&
      Object.keys(globalData).length > 0 &&
      globalChartData &&
      Object.keys(globalChartData).length > 0 ? (
        <Switch>
          <Route
            exacts
            strict
            path="/token/:tokenAddress"
            render={({ match }) => {
              if (
                OVERVIEW_TOKEN_BLACKLIST.includes(
                  match.params.tokenAddress.toLowerCase()
                )
              ) {
                return <Redirect to="/home" />;
              }
              if (isAddress(match.params.tokenAddress.toLowerCase())) {
                return (
                  <LayoutWrapper
                    savedOpen={savedOpen}
                    setSavedOpen={setSavedOpen}
                  >
                    <TokenPage
                      address={match.params.tokenAddress.toLowerCase()}
                    />
                  </LayoutWrapper>
                );
              } else {
                return <Redirect to="/home" />;
              }
            }}
          />
          <Route
            exacts
            strict
            path="/pair/:pairAddress"
            render={({ match }) => {
              if (
                PAIR_BLACKLIST.includes(match.params.pairAddress.toLowerCase())
              ) {
                return <Redirect to="/home" />;
              }
              if (isAddress(match.params.pairAddress.toLowerCase())) {
                return (
                  <LayoutWrapper
                    savedOpen={savedOpen}
                    setSavedOpen={setSavedOpen}
                  >
                    <PairPage
                      pairAddress={match.params.pairAddress.toLowerCase()}
                    />
                  </LayoutWrapper>
                );
              } else {
                return <Redirect to="/home" />;
              }
            }}
          />
          <Route
            exacts
            strict
            path="/account/:accountAddress"
            render={({ match }) => {
              if (isAddress(match.params.accountAddress.toLowerCase())) {
                return (
                  <LayoutWrapper
                    savedOpen={savedOpen}
                    setSavedOpen={setSavedOpen}
                  >
                    <AccountPage
                      account={match.params.accountAddress.toLowerCase()}
                    />
                  </LayoutWrapper>
                );
              } else {
                return <Redirect to="/home" />;
              }
            }}
          />

          <Route path="/home">
            <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
              <GlobalPage />
            </LayoutWrapper>
          </Route>

          <Route path="/tokens">
            <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
              <AllTokensPage />
            </LayoutWrapper>
          </Route>

          <Route path="/pairs">
            <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
              <AllPairsPage />
            </LayoutWrapper>
          </Route>

          <Route path="/accounts">
            <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
              <AccountLookup />
            </LayoutWrapper>
          </Route>

          <Redirect to="/home" />
        </Switch>
      ) : (
        <LocalLoader fill="true" />
      )}
    </AppWrapper>
  );
}

export default App;
