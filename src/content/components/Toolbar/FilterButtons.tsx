import React, { useEffect, useRef, useState } from 'react';
import { useToolbarStore, ToolbarFilterType } from '../../store/useToolbarStore';
import { ToolbarButton } from './ToolbarButton';

const FILTER_PULSE_DURATION = 350;

export const FilterButtons: React.FC = () => {
  const { filterButtonOrder, rotateFilterButtons, filterPulseEvent } = useToolbarStore();

  const [rotatingType, setRotatingType] = useState<ToolbarFilterType | null>(null);
  const [pulsingType, setPulsingType] = useState<ToolbarFilterType | null>(null);
  const previousPrimaryRef = useRef<ToolbarFilterType | null>(filterButtonOrder[0]);

  useEffect(() => {
    const currentPrimary = filterButtonOrder[0];
    const previousPrimary = previousPrimaryRef.current;

    if (previousPrimary !== null && currentPrimary !== previousPrimary) {
      setPulsingType(currentPrimary);
      const timeoutId = window.setTimeout(() => {
        setPulsingType((activeType) => (activeType === currentPrimary ? null : activeType));
      }, FILTER_PULSE_DURATION);

      previousPrimaryRef.current = currentPrimary;
      return () => window.clearTimeout(timeoutId);
    }

    previousPrimaryRef.current = currentPrimary;
  }, [filterButtonOrder]);

  useEffect(() => {
    if (!filterPulseEvent) {
      return;
    }

    setPulsingType(filterPulseEvent.type);
    const timeoutId = window.setTimeout(() => {
      setPulsingType((activeType) => (activeType === filterPulseEvent.type ? null : activeType));
    }, FILTER_PULSE_DURATION);

    return () => window.clearTimeout(timeoutId);
  }, [filterPulseEvent]);

  const handleFilterClick = (type: ToolbarFilterType) => {
    const currentPrimary = filterButtonOrder[0];

    if (type === currentPrimary) {
      return;
    }

    setRotatingType(type);
    rotateFilterButtons(type);

    setTimeout(() => {
      setRotatingType(null);
    }, 300);
  };

  const primaryFilter = filterButtonOrder[0];
  const secondaryFilters = filterButtonOrder.slice(1);

  return (
    <div className="mail-bites-toolbar-filter mail-bites-toolbar-filter--static is-expanded">
      <ToolbarButton
        type={primaryFilter}
        onClick={() => handleFilterClick(primaryFilter)}
        className={`mail-bites-toolbar-filter-primary ${
          rotatingType === primaryFilter ? 'mail-bites-filter-rotate' : ''
        } ${
          pulsingType === primaryFilter ? 'mail-bites-filter-pulse' : ''
        }`}
        ariaLabel={`Filter by ${primaryFilter}`}
      />

      <div className="mail-bites-toolbar-divider mail-bites-toolbar-filter-divider" />
      {secondaryFilters.map((filterType) => (
        <ToolbarButton
          key={filterType}
          type={filterType}
          onClick={() => handleFilterClick(filterType)}
          className={`mail-bites-toolbar-filter-secondary ${
            rotatingType === filterType ? 'mail-bites-filter-rotate' : ''
          } ${
            pulsingType === filterType ? 'mail-bites-filter-pulse' : ''
          }`}
          ariaLabel={`Filter by ${filterType}`}
        />
      ))}
    </div>
  );
};
