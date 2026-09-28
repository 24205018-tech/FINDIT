import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icons.jsx';
import Input from '../../components/Input.jsx';
import Select from '../../components/Select.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { categoryOptions } from '../../utils/helpers.js';

const LIST = [
  { label: 'Add a new campus location', key: 'location', placeholder: 'e.g. New Sports Block' },
  { label: 'Add a custom category', key: 'category', placeholder: 'e.g. Umbrella' }
];

/** Admin Settings — simulated system configuration */
export default function AdminSettings() {
  const toast = useToast();
  const [autoMatch, setAutoMatch] = useState(true);
  const [duplicateMerge, setDuplicateMerge] = useState(true);
  const [claimApproval, setClaimApproval] = useState('admin');
  const [maxPhotoMb, setMaxPhotoMb] = useState('2');
  const [retention, setRetention] = useState('90');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const save = () => {
    toast.show({
      kind: 'success',
      title: 'Settings saved',
      message: 'System configuration updated (stored locally for the prototype).'
    });
  };

  const switchRow = (label, hint, checked, onChange) => (
    <label className="pref-row pref-row--bordered">
      <span className="switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <i />
      </span>
      <span>
        <strong>{label}</strong>
        <em>{hint}</em>
      </span>
    </label>
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Admin Panel"
        title="Settings"
        subtitle="Platform configuration for the FindIt system (frontend prototype)."
        actions={
          <Button icon="check" onClick={save}>
            Save Changes
          </Button>
        }
      />

      <div className="settings-grid">
        <div>
          <Card title="Matching Engine" icon="zap">
            {switchRow(
              'Auto-match new reports',
              'Run the matcher instantly when a report is submitted',
              autoMatch,
              (e) => setAutoMatch(e.target.checked)
            )}
            {switchRow(
              'Duplicate detection',
              'Suggest merging visually similar reports',
              duplicateMerge,
              (e) => setDuplicateMerge(e.target.checked)
            )}
            <div className="settings-hint">
              <Icon name="info" size={13} /> Scores above 85% create instant notifications to both
              reporters.
            </div>
          </Card>

          <Card title="Claims & Verification" icon="claim">
            <div className="settings-field">
              <Select
                label="Claim approval flow"
                options={[
                  { value: 'admin', label: 'Manual — admin reviews each claim' },
                  { value: 'auto', label: 'Auto-approve when hidden detail matches 100%' },
                  { value: 'hybrid', label: 'Hybrid — auto-review, admin approves' }
                ]}
                value={claimApproval}
                onChange={(e) => setClaimApproval(e.target.value)}
              />
            </div>
            {switchRow(
              'Reject claims with mismatched details',
              'Reject automatically when the hidden detail is wrong',
              true,
              () => {}
            )}
          </Card>
        </div>

        <div>
          <Card title="Item Reporting" icon="box">
            <div className="row-2">
              <div className="field">
                <span className="field__label">Max photo size</span>
                <Select
                  options={['1', '2', '5', '10'].map((v) => ({ value: v, label: `${v} MB` }))}
                  value={maxPhotoMb}
                  onChange={(e) => setMaxPhotoMb(e.target.value)}
                />
              </div>
              <div className="field">
                <span className="field__label">Report retention</span>
                <Select
                  options={[
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '180', label: '6 months' },
                    { value: '365', label: '1 year' }
                  ]}
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                />
              </div>
            </div>
            <hr className="form-divider" />
            {LIST.map((f) => (
              <div className="settings-add" key={f.key}>
                <Input
                  label={f.label}
                  placeholder={f.placeholder}
                  value={f.key === 'location' ? newLocation : newCategory}
                  onChange={(e) => (f.key === 'location' ? setNewLocation(e.target.value) : setNewCategory(e.target.value))}
                />
                <Button
                  variant="outline"
                  icon="plus"
                  onClick={() => {
                    const val = f.key === 'location' ? newLocation : newCategory;
                    if (!val.trim()) {
                      toast.show({ kind: 'error', title: 'Empty value', message: 'Type a name first.' });
                      return;
                    }
                    toast.show({ kind: 'success', title: 'Added', message: `“${val}” added to ${f.key === 'location' ? 'locations' : 'categories'} (demo).` });
                    if (f.key === 'location') setNewLocation('');
                    else setNewCategory('');
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </Card>

          <Card title="Danger Zone" icon="alert">
            <div className="danger-zone">
              <p>Reset the demo data back to its seeded state. Your reports, claims and
              notifications will be restored to the originals.</p>
              <Button
                variant="danger"
                size="sm"
                icon="refresh"
                onClick={() => {
                  const keys = ['findit_items', 'findit_claims', 'findit_notifications', 'findit_profile', 'findit_session'];
                  keys.forEach((k) => localStorage.removeItem(k));
                  toast.show({ kind: 'success', title: 'Demo data reset', message: 'Reload the page to start fresh.' });
                }}
              >
                Reset Demo Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
