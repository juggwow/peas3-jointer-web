import heic2any from 'heic2any';

/**
 * Checks if the file is a supported image type (JPEG, PNG, or HEIC/HEIF).
 */
export function isSupportedImageType(file: File): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

  if (allowedMimeTypes.includes(file.type)) {
    return true;
  }

  const fileNameLower = file.name.toLowerCase();
  return allowedExtensions.some(ext => fileNameLower.endsWith(ext));
}

/**
 * Helper to resize and compress an image file before uploading to the backend.
 * It detects if the file is HEIC/HEIF (common on iOS) and converts it to JPEG first
 * using heic2any. Then, it resizes the image so that its maximum width or height
 * is 1920px (preserving aspect ratio) and dynamically compresses the quality
 * to fit within the specified maximum size (default 1MB).
 */
export function resizeImage(file: File, maxSizeBytes: number = 1024 * 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    // If it's not an image, return as is
    if (!file.type.startsWith('image/') && !isSupportedImageType(file)) {
      return resolve(file);
    }

    const isHeic = file.type === 'image/heic' || 
                   file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      // heic2any performs the heavy lifting conversion in the browser
      heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      })
      .then((convertedBlob: any) => {
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        
        let newFileName = file.name;
        const lastDot = newFileName.lastIndexOf('.');
        if (lastDot !== -1) {
          newFileName = newFileName.substring(0, lastDot) + '.jpg';
        } else {
          newFileName = newFileName + '.jpg';
        }

        const jpegFile = new File([blob], newFileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        resolve(resizeAndCompressImage(jpegFile, maxSizeBytes));
      })
      .catch((err) => {
        console.error('HEIC conversion failed:', err);
        // Fallback to standard resize
        resolve(resizeAndCompressImage(file, maxSizeBytes));
      });
    } else {
      resolve(resizeAndCompressImage(file, maxSizeBytes));
    }
  });
}

/**
 * Resizes and compresses JPEG/PNG images using HTML Canvas.
 */
function resizeAndCompressImage(file: File, maxSizeBytes: number): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Set max dimension (1920px is a standard for high-res web photos)
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output file name and mime type
        let newFileName = file.name;
        if (!newFileName.toLowerCase().endsWith('.jpg') && !newFileName.toLowerCase().endsWith('.jpeg') && !newFileName.toLowerCase().endsWith('.png')) {
          const lastDot = newFileName.lastIndexOf('.');
          if (lastDot !== -1) {
            newFileName = newFileName.substring(0, lastDot) + '.jpg';
          } else {
            newFileName = newFileName + '.jpg';
          }
        }
        const mimeType = newFileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

        // Compress starting at quality 0.85 and reduce quality if file exceeds size limit
        let quality = 0.85;
        const compress = (q: number) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              return resolve(file);
            }
            if (blob.size <= maxSizeBytes || q <= 0.3) {
              const resizedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              // Recursively compress with lower quality
              compress(q - 0.1);
            }
          }, mimeType, q);
        };

        compress(quality);
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
