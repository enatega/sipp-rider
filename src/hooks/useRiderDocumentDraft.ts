import { useState } from 'react';
import { useDualDocumentImagePicker } from './useDualDocumentImagePicker';

type InitialDocument = { number?: string; front?: string | null; back?: string | null };

// Each sheet mounts when opened: its baseline stays stable during profile refetches.
export function useRiderDocumentDraft(initial: InitialDocument) {
  const [baseline] = useState(() => ({ number: initial.number?.trim() ?? '', front: initial.front ?? null, back: initial.back ?? null }));
  const [number, setNumber] = useState(baseline.number);
  const picker = useDualDocumentImagePicker({ initialFrontUri: baseline.front, initialBackUri: baseline.back });
  const numberChanged = number.trim() !== baseline.number;
  const frontChanged = picker.frontUri !== baseline.front;
  const backChanged = picker.backUri !== baseline.back;
  return {
    number, setNumber, picker,
    isDirty: numberChanged || frontChanged || backChanged,
    isValid: !numberChanged || Boolean(number.trim()),
    changedNumber: numberChanged ? number.trim() : undefined,
    changedFront: frontChanged ? picker.frontUri ?? undefined : undefined,
    changedBack: backChanged ? picker.backUri ?? undefined : undefined,
  };
}
