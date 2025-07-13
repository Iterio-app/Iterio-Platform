import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Agrupa montos por moneda.
 * @param items Array de objetos con { precio, currency, useCustomCurrency }
 * @param globalCurrency Moneda global a usar si el ítem no tiene personalizada
 * @param priceKey Nombre de la propiedad del precio (por defecto 'precio')
 * @returns Objeto { USD: 1200, EUR: 800 }
 */
export function groupAmountsByCurrency(
  items: any[],
  globalCurrency: string,
  priceKey: string = 'precio'
): Record<string, number> {
  return items.reduce((acc, item) => {
    const currency = item.useCustomCurrency && item.currency ? item.currency : globalCurrency;
    const price = Number.parseFloat(item[priceKey]) || 0;
    if (!currency || isNaN(price)) return acc;
    acc[currency] = (acc[currency] || 0) + price;
    return acc;
  }, {} as Record<string, number>);
}
