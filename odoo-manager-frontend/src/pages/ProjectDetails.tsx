import axios from "axios";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Instance, OdooInstanceType } from "../types/instance";
import { AppLayout } from "../components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Plus,
} from "lucide-react";

export default function ProjectDetails() {
  const { id } = useParams();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [instanceType, setInstanceType] = useState<OdooInstanceType>("STAGING");
  const [isActive, setIsActive] = useState(true);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editType, setEditType] = useState<OdooInstanceType>("STAGING");
  const [editIsActive, setEditIsActive] = useState(true);

  const refreshData = async () => {
    try {
      const res = await api.get(`/instances?project_id=${id}`);
      setInstances(res.data);
    } catch {
      setError("Failed to load instances");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [instRes, projRes] = await Promise.all([
          api.get(`/instances?project_id=${id}`),
          api.get(`/projects`),
        ]);
        if (isMounted) {
          setInstances(instRes.data);
          const proj = projRes.data.find(
            (p: { id: number }) => p.id === Number(id)
          );
          if (proj) setProjectName(proj.name);
        }
      } catch {
        if (isMounted) setError("Failed to load instances");
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/instances", {
        name,
        url,
        instance_type: instanceType,
        is_active: isActive,
        project_id: Number(id),
      });
      setSuccess("Instance created successfully!");
      setName("");
      setUrl("");
      setInstanceType("STAGING");
      setIsActive(true);
      setCreateOpen(false);
      refreshData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
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

  const handleEdit = (instance: Instance) => {
    setEditingId(instance.id);
    setEditName(instance.name);
    setEditUrl(instance.url);
    setEditType(instance.instance_type);
    setEditIsActive(instance.is_active);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/instances/${editingId}`, {
        name: editName,
        url: editUrl,
        instance_type: editType,
        is_active: editIsActive,
      });
      setSuccess("Instance updated successfully!");
      setEditOpen(false);
      setEditingId(null);
      refreshData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string" && detail.includes("Conflict")) {
          setError(
            "Conflict: Cannot activate - another Production instance is already active."
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
      refreshData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(detail || "Failed to toggle instance status");
      }
    } finally {
      setLoading(false);
    }
  };

  const activeCount = instances.filter((i) => i.is_active).length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {projectName || `Project #${id}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {instances.length} instance{instances.length !== 1 ? "s" : ""}{" "}
              &middot; {activeCount} active
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" />
                Create Instance
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Create Instance
                </DialogTitle>
                <DialogDescription>
                  Add a new instance to {projectName || `Project #${id}`}.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Instance Name</Label>
                  <Input
                    placeholder="e.g. Odoo Staging"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">URL</Label>
                  <Input
                    placeholder="e.g. https://staging.odoo.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Instance Type</Label>
                  <Select
                    value={instanceType}
                    onValueChange={(v) =>
                      setInstanceType(v as OdooInstanceType)
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCTION">Production</SelectItem>
                      <SelectItem value="STAGING">Staging</SelectItem>
                      <SelectItem value="DEVELOPMENT">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    id="pd-create-active"
                  />
                  <Label htmlFor="pd-create-active" className="text-foreground">
                    Active
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading}>
                  {loading ? "Creating..." : "Create Instance"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
            <button
              onClick={() => setError("")}
              className="ml-auto text-destructive/70 hover:text-destructive"
            >
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-emerald-600/70 hover:text-emerald-600"
            >
              Dismiss
            </button>
          </div>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Instances</CardTitle>
            <CardDescription>
              All instances belonging to this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {instances.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No instances found. Create one to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground">URL</TableHead>
                    <TableHead className="text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((inst) => (
                    <TableRow
                      key={inst.id}
                      className="border-border hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {inst.name}
                      </TableCell>
                      <TableCell>
                        <a
                          href={inst.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                        >
                          {inst.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={inst.instance_type} />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={inst.is_active}
                          onCheckedChange={() => handleToggleActive(inst)}
                          disabled={loading}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(inst)}
                          className="gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                Edit Instance
              </DialogTitle>
              <DialogDescription>
                Update the instance details below.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Instance Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">URL</Label>
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Instance Type</Label>
                <Select
                  value={editType}
                  onValueChange={(v) => setEditType(v as OdooInstanceType)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                  id="pd-edit-active"
                />
                <Label htmlFor="pd-edit-active" className="text-foreground">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update Instance"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function TypeBadge({ type }: { type: OdooInstanceType }) {
  const config = {
    PRODUCTION: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    STAGING: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    DEVELOPMENT: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  return (
    <Badge variant="outline" className={`${config[type]} font-medium`}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </Badge>
  );
}
