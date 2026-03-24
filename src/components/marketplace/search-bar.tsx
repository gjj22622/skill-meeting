'use client';

import { useState } from 'react';

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ initialQuery = '', onSearch, placeholder = '搜尋 Skill...' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
      <input
        className="input-field"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1 }}
      />
      <button className="btn-primary" type="submit">
        🔍 搜尋
      </button>
    </form>
  );
}
