import React, { useState } from 'react';

import { Typography } from '../../Theme';
import { Networks } from '../../constants';
import { formattedNum } from '../../utils';
import DialogWithChart from './Dialog';
import { Wrapper, Content, Header, OpenChartIcon, Network, Data, NetworkData, Title } from './styled';

interface NetworksValue {
  [Networks.ARBITRUM_ONE]: string | number;
  [Networks.MAINNET]: string | number;
  [Networks.XDAI]: string | number;
}

interface NetworkDataCardWithDialogProps {
  title: string;
  chartTitle: string;
  icon: React.ReactNode;
  networksValues: NetworksValue[];
  historicalDataHook: any;
}

const NetworkDataCardWithDialog = ({
  title,
  chartTitle,
  icon,
  networksValues,
  historicalDataHook,
}: NetworkDataCardWithDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleDialog = () => {
    setIsDialogOpen((value) => !value);
  };

  return (
    <Wrapper>
      <Header>
        <Title>
          {icon}
          {/* FIXME: fix when we convert the whole project to ts */}
          <Typography.SmallHeader sx={''} color={''} className={''}>
            {title}
          </Typography.SmallHeader>
        </Title>
        <OpenChartIcon size={24} onClick={toggleDialog} />
      </Header>
      <Content>
        {Object.keys(networksValues).map((network, index) => (
          <NetworkData key={network} align={index === networksValues.length - 1 ? 'right' : 'left'}>
            <Network>{network}</Network>
            <Data>{formattedNum(networksValues[network])}</Data>
          </NetworkData>
        ))}
      </Content>
      {isDialogOpen && (
        <DialogWithChart
          title={chartTitle}
          historicalDataHook={historicalDataHook}
          isOpen={isDialogOpen}
          onClose={toggleDialog}
        />
      )}
    </Wrapper>
  );
};

export default NetworkDataCardWithDialog;
