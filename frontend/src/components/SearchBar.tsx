"use client";

import { useState, useRef, type FormEvent } from "react";
import { searchKeywords } from "@/lib/demo-data";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  loading = false,
  placeholder = "Enter a keyword (e.g. protein powder, gym aesthetic)",
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(input: string) {
    setValue(input);
    if (input.trim().length > 0) {
      const matches = searchKeywords(input).map((k) => k.keyword);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function handleSelect(keyword: string) {
    setValue(keyword);
    setShowSuggestions(false);
    onSearch(keyword);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (value.trim()) handleChange(value);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
        />

        {/* Autocomplete dropdown */}
        {showSuggestions && (
          <ul className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-800 shadow-xl overflow-hidden">
            {suggestions.map((kw) => (
              <li key={kw}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(kw)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100 transition-colors"
                >
                  {kw}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Analyzing
          </span>
        ) : (
          "Analyze"
        )}
      </button>
    </form>
  );
}
