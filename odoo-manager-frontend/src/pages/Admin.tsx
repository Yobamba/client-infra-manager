import { useState, useEffect, useCallback } from "react";

import axios from "axios";
import api from "../api/axios";
import { Link } from "react-router-dom";
import type { User, UserWithProjects } from "../types/user";
import type { Project } from "../types/project";
import type { Client } from "../types/client";

export default function Admin() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [usersWithProjects, setUsersWithProjects] = useState<
    UserWithProjects[]
  >([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");

  // User Creation State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "STANDARD">(
    "STANDARD"
  );

  // Client State
  const [clientName, setClientName] = useState("");

  // Project State
  const [projectName, setProjectName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | "">("");
  const [clients, setClients] = useState<Client[]>([]);

  // 1. Reusable fetcher for manual refreshes (like after creating a client)
  const refreshClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch {
      setError("Failed to refresh clients list");
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [clientsRes, usersRes, usersWithProjectsRes, projectsRes] =
        await Promise.all([
          api.get("/clients"),
          api.get("/users"),
          api.get("/users/with-projects"),
          api.get("/projects"),
        ]);

      setClients(clientsRes.data);
      setUsers(usersRes.data);
      setUsersWithProjects(usersWithProjectsRes.data);
      setProjects(projectsRes.data);
    } catch {
      setError("Failed to load admin data");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initLoad() {
      try {
        const [clientsRes, usersRes, usersWithProjectsRes, projectsRes] =
          await Promise.all([
            api.get("/clients"),
            api.get("/users"),
            api.get("/users/with-projects"),
            api.get("/projects"),
          ]);

        if (isMounted) {
          setClients(clientsRes.data);
          setUsers(usersRes.data);
          setUsersWithProjects(usersWithProjectsRes.data);
          setProjects(projectsRes.data);
        }
      } catch {
        if (isMounted) setError("Failed to load admin data");
      }
    }

    initLoad();

    return () => {
      isMounted = false;
    };
  }, []); // No dependencies needed because it's self-contained

  const handleCreateUser = async () => {
    try {
      await api.post("/users", {
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setSuccess("User created successfully!");
      setNewUserEmail("");
      setNewUserPassword("");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to create user");
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserId || !selectedProjectId) {
      setError("Select both user and project");
      return;
    }

    try {
      await api.post(`/projects/${selectedProjectId}/assign/${selectedUserId}`);

      setSuccess("User assigned successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to assign user");
    }
  };

  const handleRemoveUser = async (projectId: number, userId: number) => {
    try {
      await api.delete(`/projects/${projectId}/assign/${userId}`);
      setSuccess("User removed from project");
      loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to remove user");
    }
  };

  const handleCreateClient = async () => {
    try {
      await api.post(`/clients?name=${clientName}`);
      setSuccess("Client created successfully!");
      setClientName("");
      setError("");
      refreshClients();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Failed to create client");
      }
    }
  };

  const handleCreateProject = async () => {
    if (!selectedClientId) {
      setError("Please select a client for the project");
      return;
    }
    try {
      await api.post("/projects", {
        name: projectName,
        client_id: selectedClientId,
      });
      setSuccess("Project created successfully!");
      setProjectName("");
      setError("");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;

        // Check if it's a validation array (422) or a simple string (400/404)
        if (Array.isArray(detail)) {
          setError(`Validation Error: ${detail[0].msg}`);
        } else {
          setError(detail || "Failed to create project");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <nav style={{ marginBottom: "2rem", display: "flex", gap: "10px" }}>
        <Link to="/admin">General Admin</Link>
        <Link to="/admin/instances">Manage Instances</Link>
      </nav>
      <h1>Admin Panel</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {/* CREATE USER */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Create User</h2>

        <input
          placeholder="Email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={newUserPassword}
          onChange={(e) => setNewUserPassword(e.target.value)}
        />

        <select
          value={newUserRole}
          onChange={(e) =>
            setNewUserRole(e.target.value as "ADMIN" | "STANDARD")
          }
        >
          <option value="STANDARD">STANDARD</option>
          <option value="ADMIN">ADMIN</option>
        </select>

        <button onClick={handleCreateUser}>Create User</button>
      </section>

      {/* CREATE CLIENT */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Create Client</h2>

        <input
          value={clientName}
          placeholder="Client Name"
          onChange={(e) => setClientName(e.target.value)}
        />

        <button onClick={handleCreateClient}>Create Client</button>
      </section>

      {/* CREATE PROJECT */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Create Project</h2>

        <input
          value={projectName}
          placeholder="Project Name"
          onChange={(e) => setProjectName(e.target.value)}
        />

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(Number(e.target.value))}
        >
          <option value="">Select Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button onClick={handleCreateProject}>Create Project</button>
      </section>

      {/* ASSIGN USER */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Assign User to Project</h2>

        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(Number(e.target.value))}
        >
          <option value="">Select User</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>

        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(Number(e.target.value))}
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button onClick={handleAssignUser}>Assign</button>
      </section>

      {/* OVERVIEW */}
      <section>
        <h2>Existing Users</h2>
        <ul>
          {users.map((u) => (
            <li key={u.id}>
              {u.email} ({u.role})
            </li>
          ))}
        </ul>

        <h2>Users With Projects</h2>
        <ul>
          {usersWithProjects.map((user) => (
            <li key={user.id}>
              <strong>{user.email}</strong> ({user.role})
              <ul>
                {user.projects.length > 0 ? (
                  user.projects.map((project) => (
                    <li key={project.id}>{project.name}</li>
                  ))
                ) : (
                  <li>No projects assigned</li>
                )}
              </ul>
            </li>
          ))}
        </ul>

        <h2>Existing Projects</h2>
        <ul>
          {projects.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong>

              <ul>
                {p.users.length > 0 ? (
                  p.users.map((u) => (
                    <li key={u.id}>
                      {u.email}
                      <button
                        style={{ marginLeft: "10px" }}
                        onClick={() => handleRemoveUser(p.id, u.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                ) : (
                  <li>No users assigned</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
