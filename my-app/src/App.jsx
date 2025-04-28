import { useState } from 'react';
import React from 'react';
import reactLogo from './assets/react.svg'
import viteLogo from '/sparc-logo.svg'
import './App.css'
import MapComponent from './Module/MapComponent'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <div className='App'>
      <MapComponent/>
     </div>
    </>
  )
}

export default App
