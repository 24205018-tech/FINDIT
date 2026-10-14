import { useState, useCallback } from 'react';
import Modal from './Modal.jsx';
import Textarea from './Textarea.jsx';
import Input from './Input.jsx';
import Button from './Button.jsx';
import ImageUploader from './ImageUploader.jsx';
import Icon from './Icons.jsx';
import useAuth from '../hooks/useAuth.js';
import useClaims from '../hooks/useClaims.js';
import useNotifications from '../hooks/useNotifications.js';
import { useToast } from '../hooks/useToast.jsx';
import { required } from '../utils/validation.js';
import { useNavigate } from 'react-router-dom';

/**
 * ClaimFormModal — step-by-step claim wizard shown on item pages.
 * Simulates secure claim submission with proof upload.
 */
export default function ClaimFormModal({ open, onClose, item }) {
  const { user } = useAuth();
  const { submitClaim } = useClaims(user?.id);
  const { addNotification } = useNotifications(user?.id);
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ reason: '', hiddenDetail: '', additionalInfo: '', proof: null });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const setField = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  }, []);

  const handleClose = useCallback(() => {
    if (busy) return;
    onClose?.();
    // reset after a tick so the modal exit animation stays smooth
    setTimeout(() => {
      setStep(1);
      setForm({ reason: '', hiddenDetail: '', additionalInfo: '', proof: null });
      setErrors({});
      setDone(false);
    }, 150);
  }, [busy, onClose]);

  const nextStep = () => {
    const errs = { reason: required(form.reason, 'This answer') };
    setErrors(errs);
    if (!errs.reason) setStep(2);
  };

  const handleSubmit = () => {
    const errs = { hiddenDetail: required(form.hiddenDetail, 'Hidden identifying detail') };
    setErrors(errs);
    if (errs.hiddenDetail) return;
    if (!item) return;

    setBusy(true);
    const payload = {
      itemId: item.id,
      itemKind: item.kind,
      reason: form.reason.trim(),
      hiddenDetail: form.hiddenDetail.trim(),
      additionalInfo: form.additionalInfo.trim(),
      proofName: form.proof?.file?.name || (form.proof?.dataUrl ? 'proof-image' : ''),
      proofPreview: form.proof?.dataUrl || ''
    };
    submitClaim(payload)
      .then((claim) => {
        addNotification('claim', `Your claim for ${item.title} is now under review.`);
        setDone(true);
      })
      .catch(() => {
        toast.show({ kind: 'error', title: 'Could not submit claim', message: 'Please try again later.' });
      })
      .finally(() => setBusy(false));
  };

  if (!item) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Claim this item"
      subtitle={`Secure claim for “${item.title}”`}
      icon="claim"
      size="lg"
      hideClose={busy}
    >
      {done ? (
        <div className="claim-done">
          <span className="claim-done__icon">
            <Icon name="checkCircle" size={40} />
          </span>
          <h3>Claim submitted 🎉</h3>
          <p>
            Your claim for <strong>{item.title}</strong> is now <StatusPill>Pending</StatusPill> and
            will be reviewed by the campus lost &amp; found team.
          </p>
          <div className="claim-done__actions">
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
            <Button icon="claim" onClick={() => { handleClose(); navigate('/claims'); }}>
              Track My Claims
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="stepper" aria-label={`Step ${step} of 2`}>
            <span className={`stepper__dot ${step >= 1 ? 'is-active' : ''} ${step > 1 ? 'is-done' : ''}`}>
              {step > 1 ? <Icon name="check" size={13} /> : 1}
            </span>
            <span className="stepper__line" />
            <span className={`stepper__dot ${step >= 2 ? 'is-active' : ''}`}>2</span>
          </div>

          {step === 1 ? (
            <div className="claim-step">
              <Textarea
                id="claim-reason"
                label="Why do you believe this is yours?"
                rows={3}
                placeholder="Describe when and where you lost it, and anything that proves you are the owner…"
                value={form.reason}
                error={errors.reason}
                required
                onChange={(e) => setField('reason', e.target.value)}
              />
              <p className="claim-note">
                <Icon name="shield" size={14} /> The verification answer you give in the next step is
                compared privately with the reporter's hidden details.
              </p>
              <div className="modal__actions">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={nextStep} icon="chevronRight" iconRight>
                  Continue
                </Button>
              </div>
            </div>
          ) : (
            <div className="claim-step">
              <Textarea
                id="claim-hidden-detail"
                label="Hidden identifying detail"
                rows={2}
                placeholder="A scratch, engraving, sticker, serial number, contents… only you would know."
                hint="Never shown publicly — used solely to verify ownership."
                value={form.hiddenDetail}
                error={errors.hiddenDetail}
                required
                onChange={(e) => setField('hiddenDetail', e.target.value)}
              />
              <Textarea
                id="claim-additional-info"
                label="Additional information"
                rows={2}
                placeholder="Anything else that helps the team confirm ownership…"
                value={form.additionalInfo}
                onChange={(e) => setField('additionalInfo', e.target.value)}
              />
              <ImageUploader
                label="Upload proof"
                hint="Bill, box, photo — optional but speeds up review"
                preview={form.proof?.dataUrl}
                onFile={({ file, dataUrl, error }) => {
                  setField('proof', { file, dataUrl });
                  if (error) toast.show({ kind: 'error', title: 'Proof upload', message: error });
                }}
                seed={item.title}
                compact
              />
              <div className="modal__actions">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button loading={busy} onClick={handleSubmit} icon="claim">
                  {busy ? 'Submitting claim…' : 'Submit Claim'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function StatusPill({ children }) {
  return <span className="badge badge--warn">{children}</span>;
}
