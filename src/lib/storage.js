import { supabase } from './supabase';

export const ERPYME_BUCKET = 'erpyme-archivos';

const sanitizeName = (name = 'archivo') =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

export const uploadPrivateFile = async ({ file, folder = 'general', userId }) => {
  if (!file) throw new Error('No se selecciono archivo');
  if (!userId) throw new Error('Usuario no autenticado');

  const safeName = sanitizeName(file.name);
  const path = `${folder}/${userId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(ERPYME_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(ERPYME_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
};
