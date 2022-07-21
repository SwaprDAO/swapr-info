import React, { useRef, useState } from 'react';
import { useClickAway } from 'react-use';

import { StyledIcon } from '..';
import { Typography } from '../../Theme';
import { useDarkModeManager } from '../../contexts/LocalStorage';
import { AutoColumn } from '../Column';
import Icon from '../Icon';
import Row, { RowBetween } from '../Row';
import { ArrowStyled, Dropdown, Wrapper } from './styled';

export default function DropdownBasicSelect({ options, active, disabled, setActive, color, width = null }) {
  const darkMode = useDarkModeManager();

  const [showDropdown, toggleDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  useClickAway(dropdownRef, (event) => {
    if (showDropdown && !containerRef.current.contains(event.target)) toggleDropdown(false);
  });

  return (
    <Wrapper open={showDropdown} color={color} ref={containerRef} width={width} disabled={disabled}>
      {disabled ? (
        <RowBetween justify={'center'}>
          <Typography.SmallHeader sx={{ display: 'flex' }} color={'disabled'}>
            {active}
          </Typography.SmallHeader>
          <StyledIcon disabled={disabled}>
            <ArrowStyled />
          </StyledIcon>
        </RowBetween>
      ) : (
        <RowBetween onClick={() => toggleDropdown(!showDropdown)} justify={'center'}>
          <Typography.SmallHeader sx={{ display: 'flex' }} color={'text8'}>
            {active}
          </Typography.SmallHeader>
          <StyledIcon>
            <Icon icon={<ArrowStyled />} color={'text8'} />
          </StyledIcon>
        </RowBetween>
      )}
      {showDropdown && (
        <Dropdown>
          <div ref={dropdownRef}>
            <AutoColumn gap={'20px'}>
              {Object.keys(options).map((key, index) => {
                let option = options[key];
                return (
                  option !== active && (
                    <Row
                      onClick={() => {
                        toggleDropdown(!showDropdown);
                        setActive(option);
                      }}
                      key={index}
                    >
                      <Typography.SmallHeader
                        color={'text8'}
                        sx={{ display: 'flex', ':hover': { color: darkMode ? '#EBE9F8' : '#464366' } }}
                      >
                        {option}
                      </Typography.SmallHeader>
                    </Row>
                  )
                );
              })}
            </AutoColumn>
          </div>
        </Dropdown>
      )}
    </Wrapper>
  );
}
