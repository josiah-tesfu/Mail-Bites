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
   */
  build(
    primaryFilter: 'unread' | 'read' | 'draft',
    isFilterCollapsed: boolean,
    onButtonClick: (type: ToolbarActionType, button: HTMLButtonElement) => void
  ): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'mail-bites-toolbar';

    const newEmailButton = this.buildToolbarButton('new-email', onButtonClick);
    const searchButton = this.buildToolbarButton('search', onButtonClick);

    toolbar.appendChild(newEmailButton);
    toolbar.appendChild(searchButton);

    const filterWrapper = document.createElement('div');
    filterWrapper.className = 'mail-bites-toolbar-filter';
    filterWrapper.classList.add(
      isFilterCollapsed ? 'is-collapsed' : 'is-expanded'
    );

    const primaryButton = this.buildToolbarButton(primaryFilter, onButtonClick);
    primaryButton.classList.add('mail-bites-toolbar-filter-primary');
    filterWrapper.appendChild(primaryButton);

    if (!isFilterCollapsed) {
      const divider = this.buildDivider();
      divider.classList.add('mail-bites-toolbar-filter-divider');
      filterWrapper.appendChild(divider);

      for (const secondary of this.getSecondaryFilters(primaryFilter)) {
        const button = this.buildToolbarButton(secondary, onButtonClick);
        button.classList.add('mail-bites-toolbar-filter-secondary');
        filterWrapper.appendChild(button);
      }
    }

    toolbar.appendChild(filterWrapper);

    return toolbar;
  }

  /**
   * Build vertical divider
   */
  private buildDivider(): HTMLElement {
    const divider = document.createElement('div');
    divider.className = 'mail-bites-toolbar-divider';
    return divider;
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

  private getSecondaryFilters(primary: 'unread' | 'read' | 'draft'): Array<'unread' | 'read' | 'draft'> {
    const filters: Array<'unread' | 'read' | 'draft'> = ['unread', 'read', 'draft'];
    return filters.filter((filter) => filter !== primary);
  }
}
