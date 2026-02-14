import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Restaurants from "./pages/Restaurants";
import Expenses from "./pages/Expenses";
import ExpenseStats from "./pages/ExpenseStats";



function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/expenses" element={<Expenses/>} />
          <Route path="/stats" element={<ExpenseStats />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;