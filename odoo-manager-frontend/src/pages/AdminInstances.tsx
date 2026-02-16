import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "../api/axios";
import type { Instance, OdooInstanceType } from "../types/instance";
import type { Project } from "../types/project";
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
  ArrowUpDown,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Plus,
} from "lucide-react";

type SortKey = "name" | "instance_type" | "is_active" | "url";
type SortDir = "asc" | "desc";

export default function AdminInstances() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [instancesByProject, setInstancesByProject] = useState<
    Record<string, Instance[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<OdooInstanceType>("DEVELOPMENT");
  const [projectId, setProjectId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editType, setEditType] = useState<OdooInstanceType>("DEVELOPMENT");
  const [editIsActive, setEditIsActive] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const projRes = await api.get("/projects");
      const projectsData: Project[] = projRes.data;
      setProjects(projectsData);

      const instancePromises = projectsData.map((p: Project) =>
        api.get(`/instances?project_id=${p.id}`)
      );

      const instanceResults = await Promise.allSettled(instancePromises);

      const instancesMap: Record<string, Instance[]> = {};
      projectsData.forEach((p: Project, index: number) => {
        const result = instanceResults[index];
        if (result.status === "fulfilled") {
          instancesMap[p.id] = result.value.data;
        } else {
          console.error(
            `Failed to load instances for project ${p.name}`,
            result.reason
          );
          instancesMap[p.id] = [];
        }
      });
      setInstancesByProject(instancesMap);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // const handleSort = (key: SortKey) => {
  //   if (sortKey === key) {
  //     setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  //   } else {
  //     setSortKey(key);
  //     setSortDir("asc");
  //   }
  // };

  // const loadData = useCallback(async () => {
  //   setLoading(true);
  //   setError("");
  //   try {
  //     const projRes = await api.get("/projects");
  //     const projectsData: Project[] = projRes.data;
  //     setProjects(projectsData);

  //     const instancePromises = projectsData.map((p: Project) =>
  //       api.get(`/instances?project_id=${p.id}`)
  //     );

  //     const instanceResults = await Promise.allSettled(instancePromises);

  //     const instancesMap: Record<string, Instance[]> = {};
  //     projectsData.forEach((p: Project, index: number) => {
  //       const result = instanceResults[index];
  //       if (result.status === "fulfilled") {
  //         instancesMap[p.id] = result.value.data;
  //       } else {
  //         console.error(
  //           `Failed to load instances for project ${p.name}`,
  //           result.reason
  //         );
  //         instancesMap[p.id] = [];
  //       }
  //     });
  //     setInstancesByProject(instancesMap);
  //   } catch {
  //     setError("Failed to load data");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  // useEffect(() => {
  //   loadData();
  // }, [loadData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const resetCreateForm = () => {
    setName("");
    setUrl("");
    setType("DEVELOPMENT");
    setProjectId("");
    setIsActive(true);
  };

  const handleCreate = async () => {
    if (!projectId) {
      setError("Please select a project");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/instances", {
        name,
        url,
        instance_type: type,
        is_active: isActive,
        project_id: Number(projectId),
      });
      setSuccess("Instance created successfully!");
      resetCreateForm();
      setCreateOpen(false);
      loadData();
    } catch (err) {
      handleApiError(err, "create");
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
      loadData();
    } catch (err) {
      handleApiError(err, "update");
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
      loadData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(detail || "Failed to toggle instance status");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err: unknown, action: string) => {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("Production")) {
        setError(
          "Conflict: This project already has an active Production instance."
        );
      } else if (typeof detail === "string" && detail.includes("Conflict")) {
        setError(
          "Conflict: Cannot activate - another Production instance is already active for this project."
        );
      } else if (Array.isArray(detail)) {
        setError(`Validation Error: ${detail[0].msg}`);
      } else {
        setError(detail || `Failed to ${action} instance`);
      }
    } else {
      setError("An unexpected error occurred");
    }
  };

  const SortHeader = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  const allInstances = Object.values(instancesByProject).flat();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Infrastructure Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage all Odoo instances across projects
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
                  Create New Instance
                </DialogTitle>
                <DialogDescription>
                  Add a new Odoo instance to a project.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Instance Name</Label>
                  <Input
                    placeholder="e.g. Odoo Prod"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">URL</Label>
                  <Input
                    placeholder="e.g. https://prod.odoo.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Instance Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as OdooInstanceType)}
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
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    id="create-active"
                  />
                  <Label htmlFor="create-active" className="text-foreground">
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

        {loading && allInstances.length === 0 ? (
          <p>Loading instances...</p>
        ) : allInstances.length === 0 ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Instances</CardTitle>
              <CardDescription>
                No instances found across any project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">
                Create an instance to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          projects
            .filter((p) => instancesByProject[p.id]?.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((project) => {
              const projectInstances = instancesByProject[project.id] || [];
              const sortedProjectInstances = [...projectInstances].sort(
                (a, b) => {
                  const dir = sortDir === "asc" ? 1 : -1;
                  if (sortKey === "is_active") {
                    return (Number(a.is_active) - Number(b.is_active)) * dir;
                  }
                  const aVal = String(a[sortKey]).toLowerCase();
                  const bVal = String(b[sortKey]).toLowerCase();
                  return aVal.localeCompare(bVal) * dir;
                }
              );

              return (
                <Card key={project.id} className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      {projectInstances.length} instance
                      {projectInstances.length !== 1 ? "s" : ""} found.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead>
                            <SortHeader label="Name" sortKeyName="name" />
                          </TableHead>
                          <TableHead>
                            <SortHeader label="URL" sortKeyName="url" />
                          </TableHead>
                          <TableHead>
                            <SortHeader
                              label="Type"
                              sortKeyName="instance_type"
                            />
                          </TableHead>
                          <TableHead>
                            <SortHeader
                              label="Status"
                              sortKeyName="is_active"
                            />
                          </TableHead>
                          <TableHead className="text-right text-muted-foreground">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedProjectInstances.map((inst) => (
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
                  </CardContent>
                </Card>
              );
            })
        )}

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
                  id="edit-active"
                />
                <Label htmlFor="edit-active" className="text-foreground">
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
