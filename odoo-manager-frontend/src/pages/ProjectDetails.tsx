import axios from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react"; // Removed useCallback
import api from "../api/axios";
import type { Instance, OdooInstanceType } from "../types/instance";

export default function ProjectDetails() {
  const { id } = useParams();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [error, setError] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [instanceType, setInstanceType] = useState<OdooInstanceType>("STAGING");
  const [isActive, setIsActive] = useState(true);

  // 1. Put the fetch logic in a reusable function without useCallback
  // We'll call this after creating a new instance
  const refreshData = async () => {
    try {
      const res = await api.get(`/instances?project_id=${id}`);
      setInstances(res.data);
    } catch {
      setError("Failed to load instances");
    }
  };

  // 2. Use a clean useEffect that defines its own logic
  useEffect(() => {
    let isMounted = true; // Prevents state updates if component unmounts

    const loadInitialData = async () => {
      try {
        const res = await api.get(`/instances?project_id=${id}`);
        if (isMounted) setInstances(res.data);
      } catch {
        if (isMounted) setError("Failed to load instances");
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    }; // Cleanup function
  }, [id]); // Only re-run if the URL ID changes

  const handleCreate = async () => {
    try {
      await api.post("/instances", {
        name,
        url,
        instance_type: instanceType,
        is_active: isActive,
        project_id: Number(id),
      });

      setError("");
      refreshData(); // Refresh the list
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // If it's a 422, 'detail' is an ARRAY of objects.
        // If it's your custom error, 'detail' is a STRING.
        const detail = err.response?.data?.detail;

        if (Array.isArray(detail)) {
          // It's a validation error (422)
          setError(`Validation Error: ${detail[0].msg}`);
        } else {
          // It's a custom HTTPException string
          setError(detail || "Failed to create instance");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div>
      <h1>Project {id}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Instances</h2>

      {instances.map((inst) => (
        <div key={inst.id}>
          {inst.name} — {inst.instance_type} —{" "}
          {inst.is_active ? "Active" : "Inactive"}
        </div>
      ))}

      <hr />

      <h3>Create Instance</h3>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />

      <input placeholder="URL" onChange={(e) => setUrl(e.target.value)} />

      <select
        onChange={(e) => setInstanceType(e.target.value as OdooInstanceType)}
      >
        <option value="PRODUCTION">PRODUCTION</option>
        <option value="STAGING">STAGING</option>
        <option value="DEVELOPMENT">DEVELOPMENT</option>
      </select>

      <label>
        Active?
        <input
          type="checkbox"
          checked={isActive}
          onChange={() => setIsActive(!isActive)}
        />
      </label>

      <button onClick={handleCreate}>Create Instance</button>
    </div>
  );
}
