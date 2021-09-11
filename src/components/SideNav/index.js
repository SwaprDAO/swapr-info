import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { AutoColumn } from "../Column";
import Title from "../Title";
import { BasicLink } from "../Link";
import { useMedia } from "react-use";
import { transparentize } from "polished";
import { TYPE } from "../../Theme";
import { withRouter } from "react-router-dom";
import { TrendingUp, List, PieChart, Disc, Menu } from "react-feather";
import Link from "../Link";
import { useSessionStart } from "../../contexts/Application";
import DropdownSelect from "../DropdownSelect";
import {
  useSelectedNetwork,
  useSelectedNetworkUpdater,
} from "../../contexts/Network";
import { SupportedNetwork } from "../../constants";
import { AutoRow } from "../Row";
import { MobileMenu } from "./MobileMenu";

const Wrapper = styled.div`
  height: ${({ isMobile }) => (isMobile ? "initial" : "100vh")};
  background-color: ${({ theme }) => transparentize(0.4, theme.bg1)};
  color: ${({ theme }) => theme.text1};
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  position: sticky;
  top: 0px;
  z-index: 9999;
  box-sizing: border-box;
  /* background-color: #1b1c22; */
  background: linear-gradient(193.68deg, #1b1c22 0.68%, #000000 100.48%);
  color: ${({ theme }) => theme.bg2};

  @media screen and (max-width: 800px) {
    grid-template-columns: 1fr;
    position: relative;
  }

  @media screen and (max-width: 600px) {
    padding: 1rem;
  }
`;

export const Option = styled.div`
  font-weight: 500;
  font-size: 14px;
  opacity: ${({ activeText }) => (activeText ? 1 : 0.6)};
  color: ${({ theme }) => theme.white};
  display: flex;
  :hover {
    opacity: 1;
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

const HeaderText = styled.div`
  margin-right: 0.75rem;
  font-size: 0.825rem;
  font-weight: 500;
  display: inline-box;
  display: -webkit-inline-box;
  opacity: 0.8;
  :hover {
    opacity: 1;
  }
  a {
    color: ${({ theme }) => theme.white};
  }
`;

const Polling = styled.div`
  position: fixed;
  display: flex;
  left: 0;
  bottom: 0;
  padding: 1rem;
  color: white;
  opacity: 0.4;
  transition: opacity 0.25s ease;
  :hover {
    opacity: 1;
  }
`;

const PollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  margin-right: 0.5rem;
  margin-top: 3px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.green1};
`;

const AnimatedMobileMenu = styled(MobileMenu)`
  position: fixed;
  right: 0;
  left: 0;
  top: ${(props) => (props.open ? "0" : "-100%")};
  background-color: ${({ theme }) => theme.bg2};
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
  background-color: ${transparentize(0.7, "#000")};
  opacity: ${({ show }) => (show ? 1 : 0)};
  transform: translateY(${(props) => (props.show ? "0" : "10000000px")});
  transition: ${(props) =>
    props.show
      ? "opacity 0.3s ease"
      : "transform 0.3s ease 0.3s, opacity 0.3s ease"};
`;

function SideNav({ history }) {
  const below1080 = useMedia("(max-width: 1080px)");

  const below1180 = useMedia("(max-width: 1180px)");

  const seconds = useSessionStart();

  const selectedNetwork = useSelectedNetwork();
  const updateSelectedNetwork = useSelectedNetworkUpdater();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileMenuOpen = () => {
    setMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleSelectedNetworkChange = useCallback(
    (network) => {
      updateSelectedNetwork(network);
      history.push("/");
    },
    [updateSelectedNetwork, history]
  );

  return (
    <Wrapper isMobile={below1080}>
      {!below1080 ? (
        <DesktopWrapper>
          <AutoColumn
            gap="1rem"
            style={{ marginLeft: ".75rem", marginTop: "1.5rem" }}
          >
            <Title />
            <DropdownSelect
              active={selectedNetwork}
              setActive={handleSelectedNetworkChange}
              options={Object.values(SupportedNetwork)}
            />
            {!below1080 && (
              <AutoColumn gap="1.25rem" style={{ marginTop: "1rem" }}>
                <BasicLink to="/home">
                  <Option
                    activeText={
                      history.location.pathname === "/home" ?? undefined
                    }
                  >
                    <TrendingUp size={20} style={{ marginRight: ".75rem" }} />
                    Overview
                  </Option>
                </BasicLink>
                <BasicLink to="/tokens">
                  <Option
                    activeText={
                      (history.location.pathname.split("/")[1] === "tokens" ||
                        history.location.pathname.split("/")[1] === "token") ??
                      undefined
                    }
                  >
                    <Disc size={20} style={{ marginRight: ".75rem" }} />
                    Tokens
                  </Option>
                </BasicLink>
                <BasicLink to="/pairs">
                  <Option
                    activeText={
                      (history.location.pathname.split("/")[1] === "pairs" ||
                        history.location.pathname.split("/")[1] === "pair") ??
                      undefined
                    }
                  >
                    <PieChart size={20} style={{ marginRight: ".75rem" }} />
                    Pairs
                  </Option>
                </BasicLink>

                <BasicLink to="/accounts">
                  <Option
                    activeText={
                      (history.location.pathname.split("/")[1] === "accounts" ||
                        history.location.pathname.split("/")[1] ===
                          "account") ??
                      undefined
                    }
                  >
                    <List size={20} style={{ marginRight: ".75rem" }} />
                    Accounts
                  </Option>
                </BasicLink>
              </AutoColumn>
            )}
          </AutoColumn>
          <AutoColumn
            gap="0.5rem"
            style={{ marginLeft: ".75rem", marginBottom: "4rem" }}
          >
            <HeaderText>
              <Link href="https://dxdao.eth.link" target="_blank">
                DXdao
              </Link>
            </HeaderText>
            <HeaderText>
              <Link href="https://twitter.com/SwaprEth" target="_blank">
                Twitter
              </Link>
            </HeaderText>
          </AutoColumn>
          {!below1180 && (
            <Polling style={{ marginLeft: ".5rem" }}>
              <PollingDot />
              <a href="/" style={{ color: "white" }}>
                <TYPE.small color={"white"}>
                  Updated {!!seconds ? seconds + "s" : "-"} ago <br />
                </TYPE.small>
              </a>
            </Polling>
          )}
        </DesktopWrapper>
      ) : (
        <>
          <AnimatedMobileMenu
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
          />
          <Overlay show={mobileMenuOpen} onClick={handleMobileMenuClose} />
          <MobileWrapper>
            <Title />
            <AutoRow justify="flex-end" gap="8px">
              <DropdownSelect
                active={selectedNetwork}
                setActive={handleSelectedNetworkChange}
                options={Object.values(SupportedNetwork)}
              />
              <MenuIcon onClick={handleMobileMenuOpen} />
            </AutoRow>
          </MobileWrapper>
        </>
      )}
    </Wrapper>
  );
}

export default withRouter(SideNav);
