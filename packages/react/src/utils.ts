export function suppressConsoleError() {
  const old = console.error
  console.error = () => {}
  return () => {
    console.error = old
  }
}
