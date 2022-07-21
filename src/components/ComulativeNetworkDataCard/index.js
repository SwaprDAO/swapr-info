import PropTypes from 'prop-types';
import React from 'react';

import { Typography } from '../../Theme';
import { Wrapper, Header, Value, Content, Network, Data, NetworkData, Title } from './styled';

const DataCard = ({ title, icon, comulativeValue, networksValues, customNetworkAction }) => (
  <Wrapper>
    <Header>
      <Title>
        {icon}
        <Typography.SmallHeader>{title}</Typography.SmallHeader>
      </Title>
      <Value>{comulativeValue}</Value>
    </Header>
    <Content>
      {networksValues.map(({ network, value }, index) => (
        <NetworkData
          key={network}
          align={index === networksValues.length - 1 ? 'right' : 'left'}
          marginBottom={index === networksValues.length - 1 ? '0' : '16px'}
        >
          <Network>
            {customNetworkAction &&
              React.cloneElement(customNetworkAction, { onClick: () => customNetworkAction.props.onClick(network) })}
            {network}
          </Network>
          <Data>{value}</Data>
        </NetworkData>
      ))}
    </Content>
  </Wrapper>
);

DataCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  comulativeValue: PropTypes.any,
  networksValues: PropTypes.array,
  customNetworkAction: PropTypes.node,
};

export default DataCard;
