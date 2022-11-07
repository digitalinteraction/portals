/** @unstable */
export function debounce(ms: number, fn: () => void) {
  let timerid: any = null
  return () => {
    if (timerid !== null) clearTimeout(timerid)
    timerid = setTimeout(fn, ms)
  }
}
