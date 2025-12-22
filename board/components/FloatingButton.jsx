
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FloatingButton as StyledFloatingButton,
  FloatingIcon
} from '@/pages/board/styles/commonStyles';
import Pen from '@/pages/board/components/Icons/Pen.svg';

const FloatingButton = ({ show = true, category = 'general' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/board/create?category=${category}`);
  };

  if (!show) return null;

  return (
    <StyledFloatingButton onClick={handleClick}>
      <FloatingIcon src={Pen} />
    </StyledFloatingButton>
  );
};

export default FloatingButton;