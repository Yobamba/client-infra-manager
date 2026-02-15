import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminInstances from "./pages/AdminInstances";
import ProjectDetails from "./pages/ProjectDetails";
import Admin from "./pages/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/instances"
        element={
          <ProtectedRoute adminOnly>
            <AdminInstances />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
