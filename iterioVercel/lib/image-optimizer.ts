/**
 * Utilidad para optimizar imágenes antes de guardarlas
 * Reduce el tamaño del archivo manteniendo calidad visual aceptable
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 a 1.0
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85, // 85% de calidad - buen balance entre tamaño y calidad
  format: 'image/jpeg', // JPEG es más pequeño que PNG para fotos
};

/**
 * Optimiza una imagen reduciendo su tamaño y calidad
 * @param imageDataUrl - Data URL de la imagen (base64)
 * @param options - Opciones de optimización
 * @returns Promise con la imagen optimizada como data URL
 */
export async function optimizeImage(
  imageDataUrl: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = opts.maxWidth!;
            height = width / aspectRatio;
          } else {
            height = opts.maxHeight!;
            width = height * aspectRatio;
          }
        }
        
        // Crear canvas para redimensionar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto 2D del canvas'));
          return;
        }
        
        // Configurar para mejor calidad de redimensionamiento
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a data URL con compresión
        const optimizedDataUrl = canvas.toDataURL(opts.format!, opts.quality!);
        
        // Log de optimización (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
          const originalSize = imageDataUrl.length;
          const optimizedSize = optimizedDataUrl.length;
          const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
          console.log(`🖼️ Imagen optimizada: ${(originalSize / 1024).toFixed(0)}KB → ${(optimizedSize / 1024).toFixed(0)}KB (${reduction}% reducción)`);
        }
        
        resolve(optimizedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };
    
    img.src = imageDataUrl;
  });
}

/**
 * Optimiza múltiples imágenes en paralelo
 * @param imageDataUrls - Array de data URLs
 * @param options - Opciones de optimización
 * @returns Promise con array de imágenes optimizadas
 */
export async function optimizeImages(
  imageDataUrls: string[],
  options: ImageOptimizationOptions = {}
): Promise<string[]> {
  return Promise.all(
    imageDataUrls.map(url => optimizeImage(url, options))
  );
}

/**
 * Verifica si una imagen necesita optimización
 * @param imageDataUrl - Data URL de la imagen
 * @returns true si la imagen es grande y necesita optimización
 */
export function needsOptimization(imageDataUrl: string): boolean {
  // Imágenes > 500KB probablemente necesitan optimización
  const sizeInKB = imageDataUrl.length / 1024;
  return sizeInKB > 500;
}
