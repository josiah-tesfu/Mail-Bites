import { useCallback, useRef, useState } from 'react';

import { useAnimations } from '../../hooks/useAnimations';
import { useComposerStore } from '../../store/useComposerStore';
import { useToolbarStore } from '../../store/useToolbarStore';
import { ToolbarButton } from './ToolbarButton';
import { SearchInput } from './SearchInput';
import { FilterButtons } from './FilterButtons';

export const Toolbar = () => {
  const isSearchActive = useToolbarStore((state) => state.isSearchActive);
  const toggleSearch = useToolbarStore((state) => state.toggleSearch);
  const setSearchQuery = useToolbarStore((state) => state.setSearchQuery);
  const setPrimaryFilter = useToolbarStore((state) => state.setPrimaryFilter);
  
  const addComposeBox = useComposerStore((state) => state.addComposeBox);
  const isComposingAnimating = useComposerStore((state) => state.isComposingAnimating);
  const setComposeAnimationState = useComposerStore((state) => state.setComposeAnimationState);
  
  const [isNewEmailAnimating, setIsNewEmailAnimating] = useState(false);
  const [isSearchAnimating, setIsSearchAnimating] = useState(false);
  const newEmailButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  
  const { animateComposeRotation, animateSearchTransform } = useAnimations();

  const handleNewEmailClick = () => {
    if (isNewEmailAnimating || isComposingAnimating) return;

    setIsNewEmailAnimating(true);
    setComposeAnimationState(true);

    const button = newEmailButtonRef.current;
    if (button) {
      animateComposeRotation(button, 'open', () => {
        setIsNewEmailAnimating(false);
        setComposeAnimationState(false);
      });
    } else {
      setIsNewEmailAnimating(false);
      setComposeAnimationState(false);
    }

    addComposeBox();
    setPrimaryFilter('draft');

    if (isSearchActive) {
      toggleSearch();
    }
    setSearchQuery('');
  };

  const handleSearchClick = () => {
    if (isSearchAnimating) return;

    const button = searchButtonRef.current;
    if (!button) {
      toggleSearch();
      return;
    }

    setIsSearchAnimating(true);

    animateSearchTransform(
      button,
      () => {
        // Halfway: button shrunk, now toggle to show input
        toggleSearch();
      },
      () => {
        // Complete: animation finished
        setIsSearchAnimating(false);
      }
    );
  };

  const handleSearchClose = () => {
    toggleSearch();
  };

  return (
    <div className="mail-bites-toolbar">
      <div className="mail-bites-toolbar-actions">
        <ToolbarButton
          ref={newEmailButtonRef}
          type="new-email"
          onClick={handleNewEmailClick}
          isDisabled={isNewEmailAnimating || isComposingAnimating}
        />

        {isSearchActive ? (
          <SearchInput onSearchClose={handleSearchClose} />
        ) : (
          <ToolbarButton
            ref={searchButtonRef}
            type="search"
            onClick={handleSearchClick}
          />
        )}
      </div>

      <div className="mail-bites-toolbar-filters">
        <FilterButtons />
      </div>
    </div>
  );
};
