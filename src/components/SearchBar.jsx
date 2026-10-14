import Icon from './Icons.jsx';
import { useToast } from '../hooks/useToast.jsx';

/** Big search input with quick category shortcut chips. */
export default function SearchBar({ query, onQuery, onClear }) {
  const toast = useToast();

  const applyCategory = (cat) => {
    onQuery(cat);
    toast.show({ kind: 'success', title: 'Category set', message: `Filtering results for "${cat}"`, duration: 1800 });
  };

  return (
    <div className="searchbar">
      <Icon name="search" size={20} className="searchbar__icon" />
      <input
        className="searchbar__input"
        placeholder="Search for an item…"
        aria-label="Search items"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      {query && (
        <button type="button" className="searchbar__clear" aria-label="Clear search" onClick={onClear}>
          <Icon name="x" size={16} />
        </button>
      )}
      <div className="searchbar__cats">
        {['Watch', 'Wallet', 'Phone', 'Laptop'].map((c) => (
          <button key={c} type="button" onClick={() => applyCategory(c)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
