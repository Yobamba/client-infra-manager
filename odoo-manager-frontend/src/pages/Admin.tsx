import { useState, useEffect } from "react";
import axios from "axios";
import api from "../api/axios";

interface Client {
  id: number;
  name: string;
}

export default function Admin() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // 2. Proper useEffect with internal logic to avoid the "Cascading Render" error
  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      try {
        const res = await api.get("/clients");
        if (isMounted) setClients(res.data);
      } catch {
        if (isMounted) setError("Failed to load clients list");
      }
    };

    loadClients();
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array is safe here

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
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>Admin Panel</h1>

      {error && (
        <p
          style={{ color: "red", backgroundColor: "#ffebee", padding: "10px" }}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          style={{
            color: "green",
            backgroundColor: "#e8f5e9",
            padding: "10px",
          }}
        >
          {success}
        </p>
      )}

      <section
        style={{
          marginBottom: "2rem",
          border: "1px solid #ddd",
          padding: "1rem",
        }}
      >
        <h2>Create Client</h2>
        <input
          value={clientName}
          placeholder="Client Name"
          onChange={(e) => setClientName(e.target.value)}
        />
        <button onClick={handleCreateClient}>Create Client</button>
      </section>

      <section style={{ border: "1px solid #ddd", padding: "1rem" }}>
        <h2>Create Project</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            value={projectName}
            placeholder="Project Name"
            onChange={(e) => setProjectName(e.target.value)}
          />

          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(Number(e.target.value))}
          >
            <option value="">Select a Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button onClick={handleCreateProject}>Create Project</button>
        </div>
      </section>
    </div>
  );
}
