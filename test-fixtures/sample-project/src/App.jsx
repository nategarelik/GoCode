import React from 'react'

function App() {
  const [count, setCount] = React.useState(0)

  return (
    <div className="App">
      <h1>Sample Test App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  )
}

export default App