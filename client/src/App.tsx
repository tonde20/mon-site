import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Treasury from './pages/Treasury';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/produits" element={<Products />} />
          <Route path="/commandes" element={<Orders />} />
          <Route path="/tresorerie" element={<Treasury />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
