import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Landing from '@/pages/Landing'
import Resume from '@/pages/Resume'
import Contact from '@/pages/Contact'
import MapDemo from '@/pages/demos/Map'
import DashboardDemo from '@/pages/demos/Dashboard'
import ExplorerDemo from '@/pages/demos/Explorer'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/demos/map" element={<MapDemo />} />
          <Route path="/demos/dashboard" element={<DashboardDemo />} />
          <Route path="/demos/explorer" element={<ExplorerDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
