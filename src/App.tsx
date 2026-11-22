import { HashRouter, Routes, Route } from 'react-router-dom'
import Library from './pages/library'
import Reader from './pages/reader'
import Quiz from './pages/quiz'
import Builder from './pages/builder'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/lesson/:id" element={<Reader />} />
        <Route path="/lesson/:id/quiz" element={<Quiz />} />
        <Route path="/builder" element={<Builder />} />
      </Routes>
    </HashRouter>
  )
}