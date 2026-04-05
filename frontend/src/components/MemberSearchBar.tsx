import { useState, useEffect } from 'react';
import { useMembers } from '../hooks/useMembers';
import type { IMember } from '../types';

interface MemberSearchBarProps {
  onSelect: (member: IMember) => void;
  placeholder?: string;
}

export function MemberSearchBar({ onSelect, placeholder = 'Search by name or phone...' }: MemberSearchBarProps) {
  const { searchMembers } = useMembers();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IMember[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [highlightedForConfirm, setHighlightedForConfirm] = useState(false);

  useEffect(() => {
    const doSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const found = await searchMembers(query);
      setResults(found);
      setShowDropdown(true);
      setSelectedIndex(-1);
      setHighlightedForConfirm(false);
    };

    // debounce - 200ms feels right but havent tested on slow devices
    const timer = setTimeout(doSearch, 200);
    return () => clearTimeout(timer);
  }, [query, searchMembers]);

  const handleSelect = (member: IMember) => {
    onSelect(member);
    setQuery(member.fullName);
    setShowDropdown(false);
    setResults([]);
    setSelectedIndex(-1);
    setHighlightedForConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
      setHighlightedForConfirm(false);
      return;
    }

    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      setHighlightedForConfirm(false);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      setHighlightedForConfirm(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const actualIndex = selectedIndex >= 0 ? selectedIndex : 0;
      const member = results[actualIndex];
      
      if (!member) return;

      // double-enter: first press highlights, second press confirms
      if (!highlightedForConfirm) {
        setSelectedIndex(actualIndex);
        setHighlightedForConfirm(true);
      } else {
        handleSelect(member);
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setHighlightedForConfirm(false);
        }}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        className="w-full px-3.5 py-2.5 bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-border-subtle rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((m, index) => {
            const isSelected = selectedIndex === index;
            const isConfirming = isSelected && highlightedForConfirm;
            
            return (
              <button
                key={m.id}
                type="button"
                onMouseDown={() => handleSelect(m)}
                onMouseEnter={() => {
                  setSelectedIndex(index);
                  setHighlightedForConfirm(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left text-sm border-b border-border-subtle/50 last:border-0 transition-colors ${
                  isConfirming ? 'bg-accent/10' : isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-medium ${isConfirming ? 'text-accent' : 'text-text-primary'}`}>{m.fullName}</span>
                    <span className="text-text-muted ml-2">{m.phone}</span>
                  </div>
                  {isConfirming && (
                    <span className="text-xs text-accent">Press Enter to confirm</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {showDropdown && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-surface border border-border-subtle rounded-lg shadow-lg p-3 text-sm text-text-muted">
          No members found
        </div>
      )}
    </div>
  );
}
