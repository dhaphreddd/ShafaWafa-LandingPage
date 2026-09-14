import imageCompression from 'browser-image-compression';

/**
 * Convert image file (JPG/PNG) to WebP format
 * @param {File} file - Image file
 * @param {number} maxSizeMB - Max file size in MB (default 5)
 * @param {number} quality - Quality 0-1 (default 0.8)
 * @returns {Promise<File>} - Converted WebP file
 */
export async function convertToWebP(file, maxSizeMB = 5, quality = 0.8) {
  if (!file) return null;

  // Only process JPG/PNG
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('Hanya file JPG/PNG yang didukung');
  }

  try {
    // Compress with browser-image-compression
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: quality,
    });

    // Create WebP file object with proper name
    const webpFile = new File(
      [compressedFile],
      file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'),
      { type: 'image/webp' }
    );

    return webpFile;
  } catch (error) {
    console.error('WebP conversion error:', error);
    throw new Error(`Gagal mengonversi gambar: ${error.message}`);
  }
}

/**
 * Get file size in MB
 * @param {File} file
 * @returns {number}
 */
export function getFileSizeMB(file) {
  return (file.size / (1024 * 1024)).toFixed(2);
}

/**
 * Validate image file before upload
 * @param {File} file
 * @param {object} options
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validateImageFile(file, options = {}) {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png'] } = options;

  if (!file) {
    return { isValid: false, message: 'File tidak ditemukan' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: 'Hanya JPG/PNG yang didukung' };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { isValid: false, message: `Ukuran file maksimal ${maxSizeMB}MB` };
  }

  return { isValid: true, message: 'File valid' };
}
