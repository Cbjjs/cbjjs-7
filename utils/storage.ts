import { supabase } from '../lib/supabase';

export const getStoragePath = (value: string | null | undefined, bucket: string): string | undefined => {
  if (!value) return undefined;

  const publicMarker = `/storage/v1/object/public/${bucket}/`;
  const signedMarker = `/storage/v1/object/sign/${bucket}/`;
  const publicIndex = value.indexOf(publicMarker);
  const signedIndex = value.indexOf(signedMarker);

  if (publicIndex >= 0) return decodeURIComponent(value.slice(publicIndex + publicMarker.length).split('?')[0]);
  if (signedIndex >= 0) return decodeURIComponent(value.slice(signedIndex + signedMarker.length).split('?')[0]);
  return value;
};

export const createSignedStorageUrl = async (
  value: string | null | undefined,
  bucket: string,
  expiresIn = 300
): Promise<string | undefined> => {
  const path = getStoragePath(value, bucket);
  if (!path) return undefined;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return undefined;
  return data.signedUrl;
};

export const createSignedStorageUrls = async (
  values: Array<{ value?: string | null; bucket: string }>,
  expiresIn = 300
): Promise<Array<string | undefined>> => {
  return Promise.all(values.map(({ value, bucket }) => createSignedStorageUrl(value, bucket, expiresIn)));
};

export const getDocumentBucket = (type: string): string => type === 'profile' ? 'avatars' : 'documents';

export const getAcademyDocumentBucket = (): string => 'academy-certs';
