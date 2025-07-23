// Sample project file for testing
console.log('Hello from sample project!')

export function greet(name) {
  return `Hello, ${name}!`
}

export function add(a, b) {
  return a + b
}

export default {
  greet,
  add
}