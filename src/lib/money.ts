// Contas com ETH sem erro de ponto flutuante (0.1 + 0.2 = 0.3, não 0.30000000000000004).
// Entra string decimal, sai string decimal — nunca converta ETH para number.
import Big from 'big.js'
import type { Eth } from '@/api/types'

/** Soma valores em ETH. add('1.19', '0.016') → '1.206' */
export function add(...values: Eth[]): Eth {
  return values.reduce((sum, v) => sum.plus(v), new Big(0)).toString()
}

/** Subtrai: sub('26.83', '2.683') → '24.147' */
export function sub(a: Eth, b: Eth): Eth {
  return new Big(a).minus(b).toString()
}

/** Multiplica um preço por uma quantidade inteira: mul('1.19', 2) → '2.38' */
export function mul(price: Eth, quantity: number): Eth {
  return new Big(price).times(quantity).toString()
}

/** Compara: -1 se a < b, 0 se iguais, 1 se a > b. */
export function compare(a: Eth, b: Eth): -1 | 0 | 1 {
  return new Big(a).cmp(b)
}

/**
 * Formata para exibição, sem zeros sobrando: formatEth('26.8460') → '26.846 ETH'.
 * Mínimo de 2 casas, como no Figma: formatEth('2') → '2.00 ETH'.
 */
export function formatEth(value: Eth, { symbol = true } = {}): string {
  const big = new Big(value)
  const [int, dec = ''] = big.toFixed().split('.')
  const decimals = dec.replace(/0+$/, '').padEnd(2, '0')
  const text = `${int}.${decimals}`
  return symbol ? `${text} ETH` : text
}
