import { ToolbarActionType } from '../types/actionTypes.js';
import {
  TOOLBAR_ACTION_ICON_MAP,
  TOOLBAR_ACTION_LABELS,
  resolveAssetPath
} from '../utils/constants.js';

/**
 * ToolbarBuilder - Builds toolbar DOM elements
 * Phase 3.1: Class created with method stubs, not yet integrated
 * Phase 3.6: Implemented toolbar building methods
 */
export class ToolbarBuilder {
  /**
   * Phase 3.6: Build complete toolbar
   * @param isMoreThingsExpanded Whether more-things is expanded
   * @param onButtonClick Callback when toolbar button clicked
   * @param onExpandedIconClick Callback when expanded icon clicked
   */
  build(
    isMoreThingsExpanded: boolean,
    onButtonClick: (type: ToolbarActionType, button: HTMLButtonElement) => void,
    onExpandedIconClick: (button: HTMLButtonElement) => void
  ): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'mail-bites-toolbar';

    const newEmailButton = this.buildToolbarButton('new-email', onButtonClick);
    const searchButton = this.buildToolbarButton('search', onButtonClick);

    toolbar.appendChild(newEmailButton);
    toolbar.appendChild(searchButton);

    if (isMoreThingsExpanded) {
      const icon1 = this.buildExpandedIcon('icon1', onExpandedIconClick);
      const icon2 = this.buildExpandedIcon('icon2', onExpandedIconClick);
      const icon3 = this.buildExpandedIcon('icon3', onExpandedIconClick);
      
      toolbar.appendChild(icon1);
      toolbar.appendChild(icon2);
      toolbar.appendChild(icon3);
    } else {
      const moreThingsButton = this.buildToolbarButton('more-things', onButtonClick);
      toolbar.appendChild(moreThingsButton);
    }

    return toolbar;
  }

  /**
   * Phase 3.6: Build individual toolbar button
   */
  private buildToolbarButton(
    type: ToolbarActionType,
    onClick: (type: ToolbarActionType, button: HTMLButtonElement) => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mail-bites-action mail-bites-toolbar-action-${type}`;
    button.title = TOOLBAR_ACTION_LABELS[type] || '';
    button.setAttribute('aria-label', TOOLBAR_ACTION_LABELS[type] || '');

    const icon = document.createElement('img');
    icon.src = resolveAssetPath(TOOLBAR_ACTION_ICON_MAP[type] || '');
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      onClick(type, button);
    });

    return button;
  }

  /**
   * Phase 3.6: Build expanded icon button
   */
  private buildExpandedIcon(
    id: string,
    onClick: (button: HTMLButtonElement) => void
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mail-bites-action mail-bites-expanded-icon is-appearing-expanded';
    button.title = 'Action';
    button.setAttribute('aria-label', 'Action');

    const icon = document.createElement('img');
    icon.src = resolveAssetPath('delete-button.png');
    icon.alt = '';
    icon.decoding = 'async';
    icon.loading = 'lazy';

    button.appendChild(icon);

    button.addEventListener('animationend', () => {
      button.classList.remove('is-appearing-expanded');
    }, { once: true });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      onClick(button);
    });

    return button;
  }
}
