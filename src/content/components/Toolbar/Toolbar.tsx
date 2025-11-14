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
  
  const addComposeBox = useComposerStore((state) => state.addComposeBox);
  const isComposingAnimating = useComposerStore((state) => state.isComposingAnimating);
  const setComposeAnimationState = useComposerStore((state) => state.setComposeAnimationState);
  const expandedComposeIndex = useComposerStore((state) => state.expandedComposeIndex);
  const composeDrafts = useComposerStore((state) => state.composeDrafts);
  
  const [isNewEmailAnimating, setIsNewEmailAnimating] = useState(false);
  const [isSearchAnimating, setIsSearchAnimating] = useState(false);
  const newEmailButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  
  const { animateComposeRotation, animateSearchTransform } = useAnimations();

  const isExpandedDraftEmpty = useCallback(() => {
    if (expandedComposeIndex === null || expandedComposeIndex < 0) {
      return false;
    }

    const draft = composeDrafts.get(expandedComposeIndex);
    if (!draft) {
      return true;
    }

    const recipient = draft.to?.trim() ?? '';
    const subject = draft.subject?.trim() ?? '';
    const body = draft.body?.trim() ?? '';
    return recipient === '' && subject === '' && body === '';
  }, [expandedComposeIndex, composeDrafts]);

  const pulseComposeBox = useCallback((index: number) => {
    const composeElement = document.querySelector<HTMLElement>(
      `.mail-bites-response-box[data-compose-index="${index}"]`
    );
    if (!composeElement) {
      return;
    }

    composeElement.classList.remove('mail-bites-anim-bezel-surface');
    void composeElement.offsetWidth;
    composeElement.classList.add('mail-bites-anim-bezel-surface');
  }, []);

  const handleNewEmailClick = () => {
    if (isNewEmailAnimating || isComposingAnimating) return;

    if (
      expandedComposeIndex !== null &&
      expandedComposeIndex >= 0 &&
      isExpandedDraftEmpty()
    ) {
      pulseComposeBox(expandedComposeIndex);
      return;
    }

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
      <ToolbarButton
        ref={newEmailButtonRef}
        type="new-email"
        onClick={handleNewEmailClick}
        isDisabled={isNewEmailAnimating || isComposingAnimating}
      />
      
      {isSearchActive ? (
        <SearchInput
          onSearchClose={handleSearchClose}
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
