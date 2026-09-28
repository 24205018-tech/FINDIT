import { useCallback, useEffect, useState } from 'react';
import { claimsAPI } from '../services/api.js';
import { useToast } from './useToast.jsx';

/** Claims store — now backed by MySQL via REST API */
export default function useClaims(userId) {
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (userId) params.userId = userId;
      const res = await claimsAPI.list(params);
      if (res.success) {
        // Normalize backend shape to frontend expected shape
        const normalized = res.data.map(c => ({
          id: c.id,
          itemId: c.itemId || c.item_id,
          itemKind: c.itemKind || c.item_kind,
          userId: c.userId || c.user_id,
          reason: c.reason,
          hiddenDetail: c.hiddenDetail || c.hidden_detail,
          additionalInfo: c.additionalInfo || c.additional_info || '',
          proofName: c.proofName || c.proof_name || '',
          proofPreview: c.proofPreview || c.proof_preview || '',
          status: c.status,
          createdAt: c.createdAt || c.created_at,
          lastUpdated: c.updatedAt || c.updated_at || c.createdAt || c.created_at,
          item: c.itemTitle ? { title: c.itemTitle, category: c.itemCategory, location: c.itemLocation } : null,
          // keep raw for admin
          _raw: c,
        }));
        setClaims(normalized);
      }
    } catch (err) {
      toast.show({ kind: 'error', title: 'Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reload();
  }, [reload]);

  const submitClaim = useCallback(async (payload) => {
    // payload from ClaimFormModal: { itemId, reason, hiddenDetail, additionalInfo, proofName, proofPreview, itemKind }
    const body = {
      itemId: payload.itemId || payload.item_id,
      itemKind: payload.itemKind || payload.item_kind || 'found',
      reason: payload.reason,
      hiddenDetail: payload.hiddenDetail || payload.hidden_detail,
      additionalInfo: payload.additionalInfo || payload.additional_info || '',
      proofName: payload.proofName || payload.proof_name || '',
      proofPreview: payload.proofPreview || payload.proof_preview || '',
    };
    const res = await claimsAPI.create(body);
    if (res.success && res.data) {
      const c = res.data;
      const normalized = {
        id: c.id,
        itemId: c.itemId || c.item_id,
        itemKind: c.itemKind || c.item_kind,
        userId: c.userId || c.user_id,
        reason: c.reason,
        hiddenDetail: c.hiddenDetail || c.hidden_detail,
        additionalInfo: c.additionalInfo || c.additional_info || '',
        proofName: c.proofName || c.proof_name || '',
        proofPreview: c.proofPreview || c.proof_preview || '',
        status: c.status,
        createdAt: c.createdAt || c.created_at,
        lastUpdated: c.updatedAt || c.updated_at,
        _raw: c,
      };
      setClaims(prev => [normalized, ...prev]);
      toast.show({
        kind: 'success',
        title: 'Claim submitted',
        message: 'Your claim is now under review by the campus team.',
      });
      return normalized;
    }
    throw new Error(res.message || 'Claim failed');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = useCallback(async (id, status) => {
    const res = await claimsAPI.updateStatus(id, status);
    if (res.success && res.data) {
      const c = res.data;
      const normalized = {
        id: c.id,
        itemId: c.itemId || c.item_id,
        itemKind: c.itemKind || c.item_kind,
        userId: c.userId || c.user_id,
        reason: c.reason,
        hiddenDetail: c.hiddenDetail || c.hidden_detail,
        status: c.status,
        createdAt: c.createdAt || c.created_at,
        lastUpdated: c.updatedAt || c.updated_at,
        _raw: c,
      };
      setClaims(prev => prev.map(cl => (String(cl.id) === String(id) ? { ...cl, ...normalized } : cl)));
      toast.show({
        kind: status === 'Rejected' ? 'error' : status === 'Approved' ? 'success' : 'info',
        title: `Claim ${status.toLowerCase()}`,
        message: `Claim ${c.id} was updated to ${status}.`,
      });
      return normalized;
    }
    throw new Error(res.message || 'Status update failed');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelClaim = useCallback(async (id) => {
    const res = await claimsAPI.delete(id);
    if (res.success) {
      setClaims(prev => prev.filter(c => String(c.id) !== String(id)));
      toast.show({ kind: 'info', title: 'Claim removed', message: 'The claim was removed.' });
      return true;
    }
    throw new Error(res.message || 'Delete failed');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { claims, loading, filter, setFilter, reload, submitClaim, changeStatus, cancelClaim };
}
