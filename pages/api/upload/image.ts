import type { NextApiRequest, NextApiResponse } from 'next';
import { assertApiAdmin } from '../../../lib/auth';
import { supabaseAdmin } from '../../../lib/supabase-admin';

// Buffer est disponible globalement dans Node.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NodeBuffer = (globalThis as any).Buffer as {
  from(data: string, encoding?: string): Uint8Array;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await assertApiAdmin(req, res);
  } catch {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    const { file, fileName } = req.body;

    if (!file || !fileName) {
      res.status(400).json({ error: 'Fichier et nom de fichier requis' });
      return;
    }

    // Convertir le base64 en Buffer
    const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
    const buffer = NodeBuffer.from(base64Data, 'base64');

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = `messages/${uniqueFileName}`;

    // Déterminer le type MIME
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    const contentType = mimeTypes[fileExtension] || 'image/jpeg';

    // Upload vers Supabase Storage (accepte Buffer, ArrayBuffer, Blob, File)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Images')
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      res.status(500).json({ error: `Erreur lors de l'upload: ${uploadError.message}` });
      return;
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('Images')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      res.status(500).json({ error: "Erreur lors de la récupération de l'URL" });
      return;
    }

    res.status(200).json({ 
      url: urlData.publicUrl,
      path: filePath 
    });
  } catch (error) {
    console.error('Error in upload handler:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de l\'upload' 
    });
  }
}

