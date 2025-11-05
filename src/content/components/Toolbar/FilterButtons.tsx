import React, { useState } from 'react';
import { useToolbarStore, ToolbarFilterType } from '../../store/useToolbarStore';
import { ToolbarButton } from './ToolbarButton';

export const FilterButtons: React.FC = () => {
  const {
    filterButtonOrder,
    isFilterCollapsed,
    rotateFilterButtons,
    toggleFilterCollapse
  } = useToolbarStore();

  const [rotatingType, setRotatingType] = useState<ToolbarFilterType | null>(null);

  const handleFilterClick = (type: ToolbarFilterType) => {
    const currentPrimary = filterButtonOrder[0];

    if (isFilterCollapsed) {
      if (type === currentPrimary) {
        toggleFilterCollapse();
      }
      return;
    }

    if (type === currentPrimary) {
      toggleFilterCollapse();
      return;
    }

    // Trigger rotation animation
    setRotatingType(type);
    rotateFilterButtons(type);
    toggleFilterCollapse();

    // Reset animation state after duration
    setTimeout(() => {
      setRotatingType(null);
    }, 300);
  };

  const primaryFilter = filterButtonOrder[0];
  const secondaryFilters = filterButtonOrder.slice(1);

  return (
    <div
      className={`mail-bites-toolbar-filter ${
        isFilterCollapsed ? 'is-collapsed' : 'is-expanded'
      }`}
    >
      <ToolbarButton
        type={primaryFilter}
        onClick={() => handleFilterClick(primaryFilter)}
        className={`mail-bites-toolbar-filter-primary ${
          rotatingType === primaryFilter ? 'mail-bites-filter-rotate' : ''
        }`}
        ariaLabel={`Filter by ${primaryFilter}`}
      />

      {!isFilterCollapsed && (
        <>
          <div className="mail-bites-toolbar-divider mail-bites-toolbar-filter-divider" />
          {secondaryFilters.map((filterType) => (
            <ToolbarButton
              key={filterType}
              type={filterType}
              onClick={() => handleFilterClick(filterType)}
              className={`mail-bites-toolbar-filter-secondary ${
                rotatingType === filterType ? 'mail-bites-filter-rotate' : ''
              }`}
              ariaLabel={`Filter by ${filterType}`}
            />
          ))}
        </>
      )}
    </div>
  );
};
