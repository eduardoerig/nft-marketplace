// As artes dos NFTs existem em dois tamanhos WebP: "…-800.webp" (a URL que a API devolve) e
// "…-400.webp". Cards, miniaturas e listas usam a menor; o navegador escolhe pelo `sizes`.

/** A versão de 400 px (para imagens exibidas pequenas). */
export const smallImage = (src: string) => src.replace(/-800\.webp$/, '-400.webp')

/** `srcSet` com as duas versões. Use junto com `sizes` (a largura em que a imagem aparece). */
export const imageSrcSet = (src: string) => `${smallImage(src)} 400w, ${src} 800w`
