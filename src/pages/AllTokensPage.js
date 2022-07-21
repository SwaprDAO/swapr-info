import React, { useEffect } from 'react';
import 'feather-icons';
import { useMedia } from 'react-use';
import { Flex } from 'rebass';

import { Typography } from '../Theme';
import { PageWrapper, FullWrapper } from '../components';
import Panel from '../components/Panel';
import Search from '../components/Search';
import TopTokenList from '../components/TokenList';
import { useAllTokenData } from '../contexts/TokenData';

function AllTokensPage() {
  const allTokens = useAllTokenData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const below600 = useMedia('(max-width: 800px)');

  return (
    <PageWrapper>
      <FullWrapper>
        <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
          <Typography.LargeHeader>Top Tokens</Typography.LargeHeader>
          {!below600 && <Search small={true} />}
        </Flex>
        <Panel style={{ padding: below600 && '1rem 0 0 0 ' }}>
          <TopTokenList tokens={allTokens} itemMax={20} />
        </Panel>
      </FullWrapper>
    </PageWrapper>
  );
}

export default AllTokensPage;
