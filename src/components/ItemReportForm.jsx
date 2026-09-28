import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icons.jsx';
import Input from './Input.jsx';
import Select from './Select.jsx';
import Textarea from './Textarea.jsx';
import Button from './Button.jsx';
import ImageUploader from './ImageUploader.jsx';
import useItems from '../hooks/useItems.js';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';
import { categoryOptions, timeDiffLabel } from '../utils/helpers.js';
import { computeMatchScore } from '../hooks/useMatches.js';
import { maxLength, required } from '../utils/validation.js';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Shared lost/found reporting form. kind = 'lost' | 'found'.
 * useState — form model; useRef — first-error scroll & file input wiring
 * is inside ImageUploader.
 */
export default function ItemReportForm({ kind, pageTitle, onSuccess }) {
  const isLost = kind === 'lost';
  const { user } = useAuth();
  const { addItem, foundItems, lostItems } = useItems();
  const toast = useToast();

  const formRef = useRef(null);
  const titleRef = useRef(null);

  const [form, setForm] = useState(() => ({
    title: '',
    category: '',
    description: '',
    colour: '',
    brand: '',
    location: '',
    date: today(),
    time: '',
    details: '',
    image: { file: null, dataUrl: null, error: null }
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { item, bestMatch }
  const [tip, setTip] = useState(0);

  const tips = isLost
    ? [
        'Tip: brand + colour combinations double your match odds.',
        'Tip: report within 24 hours — timing boosts the match score.',
        'Tip: add the secret detail you could prove to the owner.'
      ]
    : [
        'Tip: adding a photo makes your found report 3× more visible.',
        'Tip: store the item safely — never leave valuables in the open.',
        'Tip: a precise location (room number) helps the matcher a lot.'
      ];

  const categoryColours = useMemo(
    () => ({
      Watch: '#8b5cf6', 'ID Card': '#6366f1', Wallet: '#f59e0b', Phone: '#10b981',
      Laptop: '#3b82f6', Earbuds: '#14b8a6', Keys: '#ef4444', Bag: '#a855f7',
      Documents: '#0ea5e9', Jewellery: '#ec4899', Electronics: '#64748b', Other: '#6b7280'
    }),
    []
  );

  const rotateTip = () => setTip((t) => (t + 1) % tips.length);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleImage = ({ file, dataUrl, error }) => {
    setForm((f) => ({ ...f, image: { file, dataUrl, error } }));
    if (error) toast.show({ kind: 'error', title: 'Image problem', message: error });
    if (errors.image) setErrors((e) => ({ ...e, image: null }));
  };

  const validate = () => {
    const errs = {
      title: required(form.title, 'Item name') || maxLength(form.title, 60, 'Item name'),
      category: required(form.category, 'Category'),
      description: required(form.description, 'Description'),
      location: required(form.location, isLost ? 'Location lost' : 'Location found'),
      date: required(form.date, 'Date'),
      time: required(form.time, 'Time'),
      image: form.image.error ? form.image.error : null
    };
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    const badKeys = Object.keys(errs).filter((k) => errs[k]);
    if (badKeys.length) {
      // focus first erroring visible field (image error handled by toast)
      if (badKeys[0] === 'title') titleRef.current?.focus();
      toast.show({ kind: 'error', title: 'Check the form', message: 'Please fix the highlighted fields.' });
      return;
    }

    setBusy(true);
    addItem(kind, {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      colour: form.colour || '—',
      brand: form.brand || '—',
      location: form.location.trim(),
      date: form.date,
      time: form.time,
      details: form.details,
      image: '',
      imagePreview: form.image.dataUrl || '',
      userId: user?.id
    })
      .then((item) => {
        // Simulate the smart matcher reacting to the new report
        const pool = isLost ? foundItems : lostItems;
        let best = null;
        pool.forEach((other) => {
          const score = isLost ? computeMatchScore(item, other) : computeMatchScore(other, item);
          if (score >= 58 && (!best || score > best.score)) best = { item: other, score };
        });
        setSubmitted({ item, bestMatch: best });
        toast.show({
          kind: 'success',
          title: isLost ? 'Lost item reported successfully!' : 'Found item reported successfully!',
          message: isLost
            ? 'Our matching engine is now scanning campus reports for you.'
            : 'Thank you! The owner will be notified when a match is found.'
        });
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch(() => {
        toast.show({ kind: 'error', title: 'Submission failed', message: 'Please try again.' });
      })
      .finally(() => setBusy(false));
  };

  const resetForm = () => {
    setForm({
      title: '', category: '', description: '', colour: '', brand: '', location: '',
      date: today(), time: '', details: '', image: { file: null, dataUrl: null, error: null }
    });
    setSubmitted(null);
    setErrors({});
  };

  /* ------------------------------ success panel ------------------------------ */
  if (submitted) {
    const { item, bestMatch } = submitted;
    return (
      <div className="report-success" ref={formRef}>
        <span className="report-success__check">
          <Icon name="check" size={34} strokeWidth={3} />
        </span>
        <h2>{isLost ? 'Lost item reported successfully!' : 'Found item reported successfully!'}</h2>
        <p>
          <strong>{item.title}</strong> · {item.category} · {item.location}
        </p>

        {bestMatch ? (
          <div className="match-banner">
            <div className="match-banner__score">🔥 {bestMatch.score}% Possible Match</div>
            <p>
              Your {isLost ? 'lost' : 'found'} <strong>{item.title}</strong> may match{' '}
              <strong>{bestMatch.item.title}</strong> reported at {bestMatch.item.location}{' '}
              ({timeDiffLabel(item.createdAt, bestMatch.item.createdAt)}).
            </p>
            <Link to="/matches" className="btn btn--primary btn--sm">
              View Smart Matches <Icon name="chevronRight" size={14} />
            </Link>
          </div>
        ) : (
          <p className="report-success__wait">
            <Icon name="zap" size={15} /> No close match found yet — you'll be notified as soon as
            the matcher finds one.
          </p>
        )}

        <div className="report-success__actions">
          <Button variant="outline" icon="plus" onClick={resetForm}>
            Report Another
          </Button>
          <Link to="/my-reports" className="btn btn--ghost">
            View My Reports
          </Link>
        </div>
      </div>
    );
  }

  /* --------------------------------- form ------------------------------------ */
  return (
    <form ref={formRef} className="report-form" onSubmit={handleSubmit} noValidate>
      <div className="report-form__tip" onClick={rotateTip} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && rotateTip()}>
        <Icon name="zap" size={15} />
        <p>{tips[tip]}</p>
        <Icon name="refresh" size={13} />
      </div>

      <div className="form-grid">
        <div className="form-section form-section--wide">
          <h3 className="form-section__title">
            <span className="form-section__step">1</span> About the item
          </h3>
          <div className="row-2">
            <Input
              ref={titleRef}
              label={isLost ? 'Item name' : 'Item name'}
              placeholder={isLost ? 'e.g. Black Noise Smartwatch' : 'e.g. Black Smartwatch'}
              value={form.title}
              error={errors.title}
              required
              onChange={(e) => setField('title', e.target.value)}
            />
            <Select
              label="Category"
              placeholder="Select a category…"
              options={categoryOptions()}
              value={form.category}
              error={errors.category}
              required
              onChange={(e) => setField('category', e.target.value)}
            />
          </div>
          <Textarea
            label="Description"
            rows={3}
            placeholder={
              isLost
                ? 'Describe the item — model, size, condition, what makes it recognisable…'
                : 'Describe the item and where exactly it was found…'
            }
            value={form.description}
            error={errors.description}
            required
            onChange={(e) => setField('description', e.target.value)}
          />
          <div className="row-3">
            <Input label="Colour" placeholder="e.g. Black" value={form.colour} onChange={(e) => setField('colour', e.target.value)} />
            <Input label="Brand" placeholder="e.g. Noise (optional)" value={form.brand} onChange={(e) => setField('brand', e.target.value)} />
            <Select label="Condition" placeholder="Not sure…" options={['New', 'Good', 'Fair', 'Worn', 'Damaged']} value={form.condition} onChange={(e) => setField('condition', e.target.value)} />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">
            <span className="form-section__step">2</span> Photo
          </h3>
          <ImageUploader
            label="Item photo"
            hint="Add a clear photo — greatly improves matching"
            preview={form.image.dataUrl}
            seed={form.title || kind}
            error={errors.image || form.image.error}
            onFile={handleImage}
            name="image"
          />
          <p className="form-section__photo-note">
            <Icon name="info" size={13} /> Photos stay private until an admin verifies a claim.
          </p>
        </div>

        <div className="form-section form-section--wide">
          <h3 className="form-section__title">
            <span className="form-section__step">3</span> Where &amp; when
          </h3>
          <div className="row-2">
            <Input
              label={isLost ? 'Location lost' : 'Location found'}
              placeholder="e.g. College Library, 2nd floor"
              icon={<Icon name="pin" size={15} />}
              value={form.location}
              error={errors.location}
              required
              onChange={(e) => setField('location', e.target.value)}
            />
          </div>
          <div className="row-2">
            <Input
              label={isLost ? 'Date lost' : 'Date found'}
              type="date"
              max={today()}
              value={form.date}
              error={errors.date}
              required
              onChange={(e) => setField('date', e.target.value)}
            />
            <Input
              label={isLost ? 'Approximate time' : 'Time found'}
              type="time"
              value={form.time}
              error={errors.time}
              required
              onChange={(e) => setField('time', e.target.value)}
            />
          </div>
        </div>

        <div className="form-section form-section--wide">
          <h3 className="form-section__title">
            <span className="form-section__step">4</span> Extra identifying details
          </h3>
          <Textarea
            label="Additional identifying details"
            rows={2}
            placeholder="Scratches, stickers, engravings, contents, case colour — details only you would know…"
            hint="Used to verify ownership — never shown to other users."
            value={form.details}
            onChange={(e) => setField('details', e.target.value)}
          />
        </div>
      </div>

      <div className="report-form__submit">
        <p>
          <Icon name="shield" size={14} /> Your report is visible only to campus admins and the
          matching engine until a match is claimed.
        </p>
        <Button type="submit" size="lg" loading={busy} icon={isLost ? 'alert' : 'flag'} iconRight="chevronRight">
          {busy ? 'Submitting…' : isLost ? 'Submit Lost Report' : 'Submit Found Report'}
        </Button>
      </div>
    </form>
  );
}
