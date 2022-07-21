import React, { useEffect } from 'react';
import 'feather-icons';
import { useMedia } from 'react-use';
import { Flex } from 'rebass';

import { Typography } from '../Theme';
import { PageWrapper, FullWrapper } from '../components';
import PairList from '../components/PairList';
import Panel from '../components/Panel';
import Search from '../components/Search';
import { useAllPairData } from '../contexts/PairData';

function AllPairsPage() {
  const allPairs = useAllPairData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const below800 = useMedia('(max-width: 800px)');

  return (
    <PageWrapper>
      <FullWrapper>
        <Flex alignItems={'flex-end'} justifyContent={'space-between'}>
          <Typography.LargeHeader>Top Pairs</Typography.LargeHeader>
          {!below800 && <Search small={true} />}
        </Flex>
        <Panel style={{ padding: below800 && '1rem 0 0 0 ' }}>
          <PairList pairs={allPairs} disbaleLinks={true} maxItems={20} />
        </Panel>
      </FullWrapper>
    </PageWrapper>
  );
}

export default AllPairsPage;
