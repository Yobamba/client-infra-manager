import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "../api/axios";
import { Link } from "react-router-dom";
import type { Instance, OdooInstanceType } from "../types/instance";
import type { Project } from "../types/project";

export default function AdminInstances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<OdooInstanceType>("DEVELOPMENT");
  const [projectId, setProjectId] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  // NEW: Edit mode state
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [instRes, projRes] = await Promise.all([
        api.get("/instances"),
        api.get("/projects"),
      ]);
      setInstances(instRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // NEW: Function to populate form with instance data for editing
  // Function to populate form with instance data for editing
  const handleEdit = (instance: Instance) => {
    setEditingId(instance.id);
    setName(instance.name);
    setUrl(instance.url);
    setType(instance.instance_type);
    setIsActive(instance.is_active);

    // Note: We don't set projectId because instances can't change projects
    // The project_id is preserved on the backend during PATCH

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // NEW: Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setUrl("");
    setType("DEVELOPMENT");
    setProjectId("");
    setIsActive(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await handleUpdateInstance();
    } else {
      await handleCreateInstance();
    }
  };

  const handleCreateInstance = async () => {
    if (!projectId) return setError("Please select a project");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/instances", {
        name,
        url,
        instance_type: type,
        is_active: isActive,
        project_id: projectId,
      });
      setSuccess("Instance created successfully!");
      handleCancelEdit(); // Reset form
      loadInitialData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string" && detail.includes("Production")) {
          setError(
            "🚨 Conflict: This project already has an active Production instance."
          );
        } else if (Array.isArray(detail)) {
          setError(`Validation Error: ${detail[0].msg}`);
        } else {
          setError(detail || "Failed to create instance");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: Update instance function
  const handleUpdateInstance = async () => {
    if (!editingId) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/instances/${editingId}`, {
        name,
        url,
        instance_type: type,
        is_active: isActive,
      });
      setSuccess("Instance updated successfully!");
      handleCancelEdit();
      loadInitialData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string" && detail.includes("Conflict")) {
          setError(
            "🚨 Conflict: Cannot activate - another Production instance is already active for this project."
          );
        } else if (Array.isArray(detail)) {
          setError(`Validation Error: ${detail[0].msg}`);
        } else {
          setError(detail || "Failed to update instance");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: Toggle active status quickly
  const handleToggleActive = async (instance: Instance) => {
    setLoading(true);
    setError("");

    try {
      await api.patch(`/instances/${instance.id}`, {
        is_active: !instance.is_active,
      });
      setSuccess(
        `Instance ${!instance.is_active ? "activated" : "deactivated"} successfully!`
      );
      loadInitialData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(detail || "Failed to toggle instance status");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <nav style={{ marginBottom: "2rem", display: "flex", gap: "10px" }}>
        <Link to="/admin">General Admin</Link>
        <Link to="/admin/instances">Manage Instances</Link>
      </nav>
      <h1>Infrastructure Management</h1>

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
          border: "1px solid #ccc",
          padding: "1.5rem",
          borderRadius: "8px",
          backgroundColor: editingId ? "#fff3cd" : "white",
        }}
      >
        <h2>{editingId ? "Edit Instance" : "Create New Instance"}</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            placeholder="Instance Name (e.g. Odoo Prod)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            placeholder="URL (e.g. https://prod.odoo.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <label>Instance Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as OdooInstanceType)}
          >
            <option value="PRODUCTION">Production</option>
            <option value="STAGING">Staging</option>
            <option value="DEVELOPMENT">Development</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />{" "}
            Active
          </label>

          {!editingId && (
            <>
              <label>Assign to Project:</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                required
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" disabled={loading}>
              {loading
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                  ? "Update Instance"
                  : "Create Instance"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{ backgroundColor: "#666" }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>Existing Instances</h2>
        {instances.length === 0 ? (
          <p>No instances found.</p>
        ) : (
          <div style={{ display: "grid", gap: "15px" }}>
            {instances.map((inst) => (
              <div
                key={inst.id}
                style={{
                  padding: "1rem",
                  border: "1px solid #eee",
                  borderRadius: "5px",
                  backgroundColor: editingId === inst.id ? "#fff3cd" : "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <strong>{inst.name}</strong>
                    <span
                      style={{
                        marginLeft: "10px",
                        fontSize: "0.8rem",
                        padding: "2px 6px",
                        backgroundColor:
                          inst.instance_type === "PRODUCTION"
                            ? "#ffd700"
                            : "#eee",
                      }}
                    >
                      {inst.instance_type}
                    </span>
                    <p style={{ margin: "5px 0" }}>
                      URL:{" "}
                      <a href={inst.url} target="_blank" rel="noreferrer">
                        {inst.url}
                      </a>
                    </p>
                    <p style={{ fontSize: "0.9rem", color: "#666" }}>
                      Status: {inst.is_active ? "✅ Active" : "❌ Inactive"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(inst)}
                      style={{
                        padding: "5px 10px",
                        fontSize: "0.85rem",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(inst)}
                      style={{
                        padding: "5px 10px",
                        fontSize: "0.85rem",
                        backgroundColor: inst.is_active ? "#dc3545" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      disabled={loading}
                    >
                      {inst.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
