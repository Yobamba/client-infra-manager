import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import type { Project } from "../types/project";
import { useAuth } from "../context/useAuth";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");
        setProjects(res.data);
      } catch (err) {
        setError("Failed to load projects");
        console.error(err);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {user ? (
        <p>
          Welcome back, {user?.email}! (Role: {user?.role})
        </p>
      ) : (
        <p>Loading user data...</p>
      )}

      {user?.role === "ADMIN" && <Link to="/admin">Admin Panel</Link>}

      <button onClick={logout}>Logout</button>

      <hr />

      <h2>Your Projects</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {projects.map((project) => (
        <div key={project.id}>
          <Link to={`/projects/${project.id}`}>{project.name}</Link>
        </div>
      ))}
    </div>
  );
}
