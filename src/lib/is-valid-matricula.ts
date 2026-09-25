// Guards against a matricula value that clearly isn't a real license number
// -- e.g. a stray "$" or "·" leaking in from a copy-pasted price tag or
// bullet character instead of an actual matricula. Every public template
// uses this to hide the field entirely rather than render broken-looking
// text.
export function isValidMatricula(value: string | undefined | null): boolean {
  return Boolean(value) && !value!.includes("$") && !value!.includes("·");
}
