"use client";

import { useState, useRef, type FormEvent } from "react";
import { searchKeywords } from "@/lib/demo-data";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  loading?: boolean;
}

const SAMPLE_KEYWORDS = [
  "protein powder",
  "creatine",
  "gym aesthetic",
  "pre workout",
  "whey isolate",
];

export default function SearchBar({ onSearch, loading = false }: SearchBarProps) {
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
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden w-full">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Analyze Search Distribution
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Discover where your audience searches across platforms
        </p>

        {/* Keyword input */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
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
            placeholder="Enter a keyword (e.g. protein powder, gym aesthetic)"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors shadow-sm"
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {suggestions.map((kw) => (
                <li key={kw}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(kw)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    {kw}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Filter dropdowns (static/disabled for premium look) */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select
            disabled
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
          >
            <option>All Countries</option>
          </select>
          <select
            disabled
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
          >
            <option>All Languages</option>
          </select>
          <select
            disabled
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
          >
            <option>General (default)</option>
          </select>
        </div>

        {/* Bottom row: sample pills + analyze button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Try:</span>
            {SAMPLE_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => handleSelect(kw)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
              >
                {kw}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
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
        </div>
      </form>
    </div>
  );
}
