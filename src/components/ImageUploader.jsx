import { useEffect, useRef, useState } from 'react';
import Icon from './Icons.jsx';
import Button from './Button.jsx';
import { readLS, writeLS } from '../utils/storage.js';
import { localPlaceholder } from '../utils/mockImage.js';

/**
 * ImageUploader — click-to-browse upload zone with drag & drop, preview
 * and a file-name label. File contents are stored as data-URLs in
 * localStorage (small files only) — the backend milestone will send these
 * to a real upload endpoint instead.
 */
export default function ImageUploader({
  label = 'Item photo',
  hint = 'JPG or PNG, up to 2 MB',
  preview,
  onFile,
  name,
  seed = '',
  error,
  compact = false,
  disabled = false
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [localPreview, setLocalPreview] = useState(null);

  const readFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onFile({ file: null, error: 'Please choose an image file (JPG/PNG).' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onFile({ file: null, error: 'Image is too large — maximum size is 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setLocalPreview(dataUrl);
      setFileName(file.name);
      onFile({ file, dataUrl, error: null });
    };
    reader.readAsDataURL(file);
  };

  const shown = preview || localPreview;

  const clearImage = () => {
    setLocalPreview(null);
    setFileName('');
    onFile({ file: null, dataUrl: null, error: null });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="field">
      {label && (
        <span className="field__label">
          {label}
          {<span className="field__req"> *</span>}
        </span>
      )}
      <div
        className={`uploader ${compact ? 'uploader--compact' : ''} ${dragOver ? 'uploader--drag' : ''} ${error ? 'uploader--error' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          readFile(e.dataTransfer.files?.[0]);
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label || 'image'}`}
      >
        {shown ? (
          <img
            src={shown}
            data-seed={seed}
            alt="Preview"
            className="uploader__preview"
            onError={(e) => {
              if (!e.currentTarget.dataset.fb) {
                e.currentTarget.dataset.fb = '1';
                e.currentTarget.src = localPlaceholder(seed);
              }
            }}
          />
        ) : (
          <div className="uploader__placeholder">
            <span className="uploader__icon">
              <Icon name="camera" size={22} />
            </span>
            <p className="uploader__title">Click to upload or drag &amp; drop</p>
            <p className="uploader__hint">{hint}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          name={name}
          className="uploader__input"
          onChange={(e) => readFile(e.target.files?.[0])}
          disabled={disabled}
          tabIndex={-1}
        />
      </div>
      <div className="uploader__row">
        {fileName && (
          <span className="uploader__filename">
            <Icon name="file" size={13} /> {fileName}
          </span>
        )}
        {shown && (
          <button
            type="button"
            className="link-btn link-btn--danger"
            onClick={(e) => {
              e.stopPropagation();
              clearImage();
            }}
          >
            Remove image
          </button>
        )}
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
