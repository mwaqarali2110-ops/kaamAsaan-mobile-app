import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type ComplaintType =
  | 'system_issue'
  | 'preventive_maintenance_feedback'
  | 'installation_complaint'
  | 'electrical_work_complaint'
  | 'cleaning_complaint'
  | 'net_billing_complaint'
  | 'other';

export type ComplaintPayload = {
  user_id?: string | null;
  complaint_type: ComplaintType;
  subject: string;
  details: string;
  reference_number?: string | null;
  contact_number: string;
  image_url?: string | null;
};

export type ComplaintSubmitResult = {
  id: string;
  reference: string;
  storedRemotely: boolean;
};

export type ComplaintAttachment = {
  uri: string;
  mimeType?: string | null;
  userId?: string | null;
};

const formatComplaintReference = (id: string) =>
  `KA-CMP-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`;

const createLocalComplaintResult = (): ComplaintSubmitResult => {
  const id = `local-${Date.now()}`;
  return {
    id,
    reference: formatComplaintReference(id),
    storedRemotely: false,
  };
};

const getAttachmentExtension = (mimeType?: string | null) => {
  if (mimeType?.includes('png')) return 'png';
  if (mimeType?.includes('webp')) return 'webp';
  return 'jpg';
};

export const uploadComplaintAttachment = async ({
  uri,
  mimeType,
  userId,
}: ComplaintAttachment): Promise<string | null> => {
  if (!uri) return null;

  if (!isSupabaseConfigured) {
    // TODO: Replace this local URI fallback with a Storage upload once Supabase is configured.
    return uri;
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const extension = getAttachmentExtension(mimeType);
    const owner = userId ?? 'anonymous';
    const path = `complaints/${owner}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from('complaint-attachments')
      .upload(path, blob, {
        contentType: mimeType ?? 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.warn('Complaint attachment upload unavailable; keeping local image URI.', error.message);
      return uri;
    }

    return supabase.storage.from('complaint-attachments').getPublicUrl(path).data.publicUrl;
  } catch (error) {
    console.warn(
      'Complaint attachment upload failed; keeping local image URI.',
      error instanceof Error ? error.message : error
    );
    return uri;
  }
};

export const submitComplaint = async (payload: ComplaintPayload): Promise<ComplaintSubmitResult> => {
  const cleanPayload = {
    user_id: payload.user_id ?? null,
    complaint_type: payload.complaint_type,
    subject: payload.subject.trim(),
    details: payload.details.trim(),
    reference_number: payload.reference_number?.trim() || null,
    contact_number: payload.contact_number.trim(),
    image_url: payload.image_url ?? null,
    status: 'pending',
  };

  if (!isSupabaseConfigured) {
    console.warn('Complaint submission queued locally because Supabase is not configured.', cleanPayload);
    return createLocalComplaintResult();
  }

  try {
    const { data, error } = await supabase
      .from('complaints')
      .insert(cleanPayload)
      .select('id')
      .single();

    if (error || !data?.id) {
      console.warn('Complaint backend unavailable; using local complaint reference.', error?.message);
      return createLocalComplaintResult();
    }

    return {
      id: data.id,
      reference: formatComplaintReference(data.id),
      storedRemotely: true,
    };
  } catch (error) {
    console.warn(
      'Complaint backend request failed; using local complaint reference.',
      error instanceof Error ? error.message : error
    );
    return createLocalComplaintResult();
  }
};
