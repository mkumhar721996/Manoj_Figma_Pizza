import { Navigate, Route, Routes } from "react-router-dom";
import { DefectCreatePage } from "./pages/DefectCreatePage";
import { DefectDetailPage } from "./pages/DefectDetailPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/defects/new" replace />} />
      <Route path="/defects/new" element={<DefectCreatePage />} />
      <Route path="/defects/:id" element={<DefectDetailPage />} />
    </Routes>
  );
}
