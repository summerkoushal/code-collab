import { useState } from 'react'
import Home from '../components/Home'
import EditorPage from '../components/EditorPage'
import { Route, Routes } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path='/' element={ <Home /> } />
      <Route path='/editor/:roomId' element={ <EditorPage /> } />
    </Routes>
  )
}

export default App
