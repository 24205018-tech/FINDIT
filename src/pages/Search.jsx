import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import SearchBar from '../components/SearchBar.jsx';
import ItemCard from '../components/ItemCard.jsx';
import LoadingSpinner, { SkeletonCards } from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Select from '../components/Select.jsx';
import Input from '../components/Input.jsx';
import Icon from '../components/Icons.jsx';
import Button from '../components/Button.jsx';
import useItems from '../hooks/useItems.js';
import { categoryOptions, colourValue } from '../utils/helpers.js';

const STATUS_OPTIONS = ['All', 'Active', 'Claimed', 'Recovered', 'Reported'];

/**
 * Search page. `useMemo` keeps the filtered result set derived purely
 * from query + filter state — no wasted re-filtering on unrelated renders.
 */
export default function Search() {
  const { allItems, loading } = useItems();

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all'); // all | lost | found
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [colour, setColour] = useState('');
  const [brand, setBrand] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const locations = useMemo(
    () => [...new Set(allItems.map((i) => i.location))].sort(),
    [allItems]
  );
  const colours = useMemo(
    () => [...new Set(allItems.map((i) => i.colour).filter((c) => c && c !== '—'))].sort(),
    [allItems]
  );
  const brands = useMemo(
    () => [...new Set(allItems.map((i) => i.brand).filter((b) => b && b !== '—'))].sort(),
    [allItems]
  );

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    let list = allItems.filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.colour} ${item.brand} ${item.location} ${item.description} ${item.details}`.toLowerCase();

      if (q && !q.split(/\s+/).every((token) => haystack.includes(token))) return false;
      if (kind !== 'all' && item.kind !== kind) return false;
      if (category && item.category !== category) return false;
      if (location && item.location !== location) return false;
      if (colour && item.colour !== colour) return false;
      if (brand && item.brand !== brand) return false;
      if (status !== 'All' && item.status !== status) return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return b.date.localeCompare(a.date);
      if (sortBy === 'oldest') return a.date.localeCompare(b.date);
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [allItems, q, kind, category, location, colour, brand, dateFrom, dateTo, status, sortBy]);

  const activeFilterCount =
    [kind !== 'all', Boolean(category), Boolean(location), Boolean(colour), Boolean(brand), Boolean(dateFrom || dateTo), status !== 'All'].filter(Boolean).length;

  const resetFilters = () => {
    setKind('all');
    setCategory('');
    setLocation('');
    setColour('');
    setBrand('');
    setDateFrom('');
    setDateTo('');
    setStatus('All');
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Explore"
        title="Search Items"
        subtitle={`Browse ${allItems.length} campus reports — combine any filters to narrow the hunt.`}
      />

      <SearchBar query={query} onQuery={setQuery} onClear={() => setQuery('')} />

      <div className="search-toolbar">
        <div className="segmented">
          {['all', 'lost', 'found'].map((k) => (
            <button
              key={k}
              type="button"
              className={kind === k ? 'is-active' : ''}
              onClick={() => setKind(k)}
            >
              {k === 'all' ? 'All' : k === 'lost' ? '🟠 Lost' : '🟢 Found'}
            </button>
          ))}
        </div>
        <div className="search-toolbar__right">
          <span className="results-count">
            <strong>{results.length}</strong> {results.length === 1 ? 'result' : 'results'}
          </span>
          <Button
            variant={activeFilterCount ? 'primary' : 'outline'}
            size="sm"
            icon="sliders"
            onClick={() => setShowFilters((s) => !s)}
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-panel__grid">
            <Select label="Category" placeholder="Any category" options={categoryOptions()} value={category} onChange={(e) => setCategory(e.target.value)} />
            <Select label="Location" placeholder="Anywhere on campus" options={locations} value={location} onChange={(e) => setLocation(e.target.value)} />
            <Select label="Colour" placeholder="Any colour" options={colours} value={colour} onChange={(e) => setColour(e.target.value)} />
            <Select label="Brand" placeholder="Any brand" options={brands} value={brand} onChange={(e) => setBrand(e.target.value)} />
            <Input label="From date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input label="To date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Select label="Status" placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
            <Select
              label="Sort by"
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'az', label: 'Name A–Z' }
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
          <div className="filters-panel__foot">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <Icon name="refresh" size={14} /> Reset all
            </Button>
          </div>
        </div>
      )}

      {/* colour legend for selected colour filter */}
      {colour && (
        <p className="colour-chip-row">
          Filtering by{' '}
          <span className="colour-chip" style={{ background: colourValue(colour) }}>
            {colour}
          </span>
        </p>
      )}

      <div className="search-results">
        {loading ? (
          <SkeletonCards count={6} />
        ) : results.length === 0 ? (
          <EmptyState
            icon="search"
            title={q || activeFilterCount ? 'No items match your search' : 'No items yet'}
            message={
              q || activeFilterCount
                ? 'Try removing a filter or searching a broader keyword.'
                : 'Nothing has been reported yet.'
            }
            actionLabel="Clear filters"
            onAction={() => {
              resetFilters();
              setQuery('');
            }}
          />
        ) : (
          <div className="grid grid--3">
            {results.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {!loading && results.length > 0 && (
        <p className="search-hint">
          <Icon name="info" size={13} /> Tip: owner contact details are never shown on public item
          cards — claims go through verified channels.
        </p>
      )}
    </div>
  );
}
