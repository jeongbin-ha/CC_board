
import React, { useState } from 'react';
import {
  SearchBox,
  SearchInput,
  SearchIcon,
} from '@/pages/board/styles/commonStyles';
import SearchBlack from '@/pages/board/components/Icons/SearchBlack.svg';
import useResponsive from '@/pages/board/hooks/useResponsive'

const SearchBarTop = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isPC = useResponsive();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <SearchBox style={{margin: '60px 100px 36px 60px', border: 'none', background: '#F8F8F8' }}>
      <SearchIcon onClick={handleSearch} src={SearchBlack} style={{width: '24px', height: '24px'}}/>
      <SearchInput
        placeholder="보고싶은 연극이나 공연진을 검색하세요."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </SearchBox>
  );
};

export default SearchBarTop;