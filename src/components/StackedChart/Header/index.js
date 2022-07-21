import PropTypes from 'prop-types';
import React from 'react';

import { Typography } from '../../../Theme';
import DropdownBasicSelect from '../../DropdownBasicSelect';
import { Container, DailyChange, FlexContainer } from './styled';

const Header = ({
  title,
  value,
  dailyChange,
  date,
  filterOptions,
  activeFilter,
  onFilterChange,
  isValueCurrency,
  showTimeFilter,
}) => (
  <Container>
    <div>
      <Typography.SmallHeader sx={{ textTransform: 'uppercase', marginBottom: 12 }}>{title}</Typography.SmallHeader>
      <FlexContainer>
        <Typography.LargeBoldHeader sx={{ marginRight: 10 }}>
          {isValueCurrency && '$'} {value}
        </Typography.LargeBoldHeader>
        <DailyChange>{dailyChange}</DailyChange>
      </FlexContainer>
      <Typography.Text>{date}</Typography.Text>
    </div>
    {showTimeFilter && (
      <div>
        <DropdownBasicSelect active={activeFilter} setActive={onFilterChange} options={filterOptions} width={80} />
      </div>
    )}
  </Container>
);

Header.propTypes = {
  title: PropTypes.string,
  dailyChange: PropTypes.any,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  date: PropTypes.string,
  filterOptions: PropTypes.object,
  activeFilter: PropTypes.string,
  onFilterChange: PropTypes.func.isRequired,
  isValueCurrency: PropTypes.bool,
  showTimeFilter: PropTypes.bool,
};

Header.defaultProps = {
  isValueCurrency: true,
  showTimeFilter: true,
};

export default Header;
