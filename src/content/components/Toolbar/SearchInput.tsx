import React, { useEffect, useRef, useState } from 'react';
import { useToolbarStore } from '../../store/useToolbarStore';

interface SearchInputProps {
  onSearchClose: () => void;
  onSearchQueryChange: (query: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearchClose,
  onSearchQueryChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const { searchQuery, setSearchQuery } = useToolbarStore();
  const [value, setValue] = useState(searchQuery);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setSearchQuery(newValue);

    // Debounce the callback
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      onSearchQueryChange(newValue);
    }, 300);
  };

  const handleBlur = () => {
    if (!value.trim()) {
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
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label="Search emails"
      />
    </div>
  );
};
