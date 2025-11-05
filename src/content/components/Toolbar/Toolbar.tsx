import { useRef, useState } from 'react';

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
    }

    addComposeBox();
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

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    // TODO: Trigger conversation filtering
  };

  return (
    <div className="mail-bites-toolbar">
      <ToolbarButton
        ref={newEmailButtonRef}
        type="new-email"
        onClick={handleNewEmailClick}
        isDisabled={isNewEmailAnimating || isComposingAnimating}
      />
      
      {isSearchActive ? (
        <SearchInput
          onSearchClose={handleSearchClose}
          onSearchQueryChange={handleSearchQueryChange}
        />
      ) : (
        <ToolbarButton
          ref={searchButtonRef}
          type="search"
          onClick={handleSearchClick}
        />
      )}

      <FilterButtons />
    </div>
  );
};
