export const IMAGE_UPLOAD_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif';

const DEFAULT_FIT_SIZE = 420;
const MIN_DIMENSION = 24;

export type ImageLayerDraft = {
  src: string;
  mimeType: string;
  name: string;
  width: number;
  height: number;
};

const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|svg|webp|gif)$/i;

const isSupportedMimeType = (mimeType: string) => mimeType.startsWith('image/');

export const isSupportedImageFile = (file: File) =>
  isSupportedMimeType(file.type) || IMAGE_EXTENSION_REGEX.test(file.name);

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
}

export async function getImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width || DEFAULT_FIT_SIZE,
        height: image.naturalHeight || image.height || DEFAULT_FIT_SIZE,
      });
    };
    image.onerror = () => reject(new Error('Image is not decodable.'));
    image.src = src;
  });
}

export function fitToCanvasBounds(
  width: number,
  height: number,
  maxWidth = DEFAULT_FIT_SIZE,
  maxHeight = DEFAULT_FIT_SIZE,
) {
  if (width <= 0 || height <= 0) {
    return { width: DEFAULT_FIT_SIZE, height: DEFAULT_FIT_SIZE };
  }

  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  const nextWidth = Math.max(MIN_DIMENSION, Math.round(width * scale));
  const nextHeight = Math.max(MIN_DIMENSION, Math.round(height * scale));
  return { width: nextWidth, height: nextHeight };
}

export async function createImageLayerDraftFromBlob(
  blob: Blob,
  fallbackName = 'Pasted image',
): Promise<ImageLayerDraft> {
  const mimeType = blob.type || 'image/png';
  if (!isSupportedMimeType(mimeType)) {
    throw new Error('Only image files can be placed on canvas.');
  }

  const src = await blobToDataUrl(blob);
  const dimensions = await getImageDimensions(src);
  const fitted = fitToCanvasBounds(dimensions.width, dimensions.height);

  return {
    src,
    mimeType,
    name: fallbackName,
    width: fitted.width,
    height: fitted.height,
  };
}
