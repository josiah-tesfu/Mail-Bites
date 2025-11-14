import React, { useEffect, useRef } from 'react';
import { useToolbarStore } from '../../store/useToolbarStore';

interface SearchInputProps {
  onSearchClose: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearchClose
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchQuery = useToolbarStore((state) => state.searchQuery);
  const setSearchQuery = useToolbarStore((state) => state.setSearchQuery);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
  };

  const handleBlur = () => {
    if (!searchQuery.trim()) {
      onSearchClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onSearchClose();
    }
  };

  return (
    <div className="mail-bites-search-container">
      <input
        ref={inputRef}
        type="text"
      className="mail-bites-search-input"
      placeholder=""
      value={searchQuery}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label="Search emails"
      />
    </div>
  );
};
