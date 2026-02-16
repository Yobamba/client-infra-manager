import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import api from "../api/axios";
import type { User, UserWithProjects } from "../types/user";
import type { Project } from "../types/project";
import type { Client } from "../types/client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";

export default function Admin() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [usersWithProjects, setUsersWithProjects] = useState<
    UserWithProjects[]
  >([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // User creation
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"ADMIN" | "STANDARD">(
    "STANDARD"
  );

  // Client creation
  const [clientName, setClientName] = useState("");

  // Project creation
  const [projectName, setProjectName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Assignment
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Project editing
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editedProjectName, setEditedProjectName] = useState("");
  const [editedProjectClientId, setEditedProjectClientId] = useState<string>("");

  // User editing
  const [editingUser, setEditingUser] = useState<UserWithProjects | null>(null);
  const [editedUserEmail, setEditedUserEmail] = useState("");
  const [editedUserPassword, setEditedUserPassword] = useState("");
  const [editedUserRole, setEditedUserRole] = useState<"ADMIN" | "STANDARD">("STANDARD");

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
  }, [loadData]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCreateUser = async () => {
    clearMessages();
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
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Failed to create user");
      } else {
        setError("Failed to create user");
      }
    }
  };

  const handleCreateClient = async () => {
    clearMessages();
    try {
      await api.post(`/clients?name=${clientName}`);
      setSuccess("Client created successfully!");
      setClientName("");
      loadData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Failed to create client");
      }
    }
  };

  const handleCreateProject = async () => {
    clearMessages();
    if (!selectedClientId) {
      setError("Please select a client for the project");
      return;
    }
    try {
      await api.post("/projects", {
        name: projectName,
        client_id: Number(selectedClientId),
      });
      setSuccess("Project created successfully!");
      setProjectName("");
      loadData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
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

  const handleAssignUser = async () => {
    clearMessages();
    if (!selectedUserId || !selectedProjectId) {
      setError("Select both user and project");
      return;
    }
    try {
      await api.post(`/projects/${selectedProjectId}/assign/${selectedUserId}`);
      setSuccess("User assigned successfully!");
      loadData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Failed to assign user");
      } else {
        setError("Failed to assign user");
      }
    }
  };

  const handleRemoveUser = async (projectId: number, userId: number) => {
    clearMessages();
    try {
      await api.delete(`/projects/${projectId}/assign/${userId}`);
      setSuccess("User removed from project");
      loadData();
    } catch {
      setError("Failed to remove user");
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    clearMessages();
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await api.delete(`/projects/${projectId}`);
        setSuccess("Project deleted successfully");
        loadData();
      } catch {
        setError("Failed to delete project");
      }
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    clearMessages();
    try {
      await api.patch(`/projects/${editingProject.id}`, {
        name: editedProjectName,
        client_id: Number(editedProjectClientId),
      });
      setSuccess("Project updated successfully!");
      setEditingProject(null);
      loadData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(detail || "Failed to update project");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleDeleteUser = async (userId: number) => {
    clearMessages();
    if (window.confirm("Are you sure you want to delete this user?")) {
        try {
            await api.delete(`/users/${userId}`);
            setSuccess("User deleted successfully");
            loadData();
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || "Failed to delete user");
            } else {
                setError("Failed to delete user");
            }
        }
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    clearMessages();

    const payload: { email?: string; password?: string; role?: "ADMIN" | "STANDARD" } = {};
    if (editedUserEmail !== editingUser.email) {
        payload.email = editedUserEmail;
    }
    if (editedUserPassword) {
        payload.password = editedUserPassword;
    }
    if (editedUserRole !== editingUser.role) {
        payload.role = editedUserRole;
    }

    if (Object.keys(payload).length === 0) {
        setEditingUser(null);
        return;
    }

    try {
        await api.patch(`/users/${editingUser.id}`, payload);
        setSuccess("User updated successfully!");
        setEditingUser(null);
        loadData();
    } catch (err) {
        if (axios.isAxiosError(err)) {
            setError(err.response?.data?.detail || "Failed to update user");
        } else {
            setError("An unexpected error occurred");
        }
    }
  };

  const openUserEditModal = (user: UserWithProjects) => {
    setEditingUser(user);
    setEditedUserEmail(user.email);
    setEditedUserRole(user.role);
    setEditedUserPassword(""); // Clear password field
  };


  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage users, clients, projects, and assignments
          </p>
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

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="w-full justify-start bg-muted">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="assign">Assign Users</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* CREATE TAB */}
          <TabsContent value="create" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Create User */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Create User
                  </CardTitle>
                  <CardDescription>Add a new user account</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Email</Label>
                    <Input
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Password</Label>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Role</Label>
                    <Select
                      value={newUserRole}
                      onValueChange={(v) =>
                        setNewUserRole(v as "ADMIN" | "STANDARD")
                      }
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser} className="mt-2 gap-1.5">
                    <Plus className="h-4 w-4" />
                    Create User
                  </Button>
                </CardContent>
              </Card>

              {/* Create Client */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="h-4 w-4 text-primary" />
                    Create Client
                  </CardTitle>
                  <CardDescription>
                    Add a new client organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Client Name</Label>
                    <Input
                      placeholder="Client name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <Button onClick={handleCreateClient} className="mt-2 gap-1.5">
                    <Plus className="h-4 w-4" />
                    Create Client
                  </Button>
                </CardContent>
              </Card>

              {/* Create Project */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plus className="h-4 w-4 text-primary" />
                    Create Project
                  </CardTitle>
                  <CardDescription>
                    Add a project under a client
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Project Name</Label>
                    <Input
                      placeholder="Project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground">Client</Label>
                    <Select
                      value={selectedClientId}
                      onValueChange={setSelectedClientId}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleCreateProject}
                    className="mt-2 gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ASSIGN TAB */}
          <TabsContent value="assign" className="mt-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Assign User to Project
                </CardTitle>
                <CardDescription>
                  Link a user to a project so they can access it
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-foreground">User</Label>
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label className="text-foreground">Project</Label>
                    <Select
                      value={selectedProjectId}
                      onValueChange={setSelectedProjectId}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select project" />
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
                  <Button onClick={handleAssignUser} className="gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-4">
            <div className="flex flex-col gap-6">
              {/* Users table */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Users</CardTitle>
                  <CardDescription>
                    {users.length} registered user
                    {users.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Email
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Role
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Assigned Projects
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersWithProjects.map((u) => (
                        <TableRow
                          key={u.id}
                          className="border-border hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-foreground">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                u.role === "ADMIN"
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                                  : "border-border bg-muted text-muted-foreground"
                              }
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {u.projects.length === 0
                              ? "None"
                              : u.projects.map((p) => p.name).join(", ")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openUserEditModal(u)}>
                                <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Projects table */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Projects</CardTitle>
                  <CardDescription>
                    {projects.length} project{projects.length !== 1 ? "s" : ""}{" "}
                    with assigned users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Project
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Assigned Users
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-border hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-foreground">
                            {p.name}
                          </TableCell>
                          <TableCell>
                            {p.users.length === 0 ? (
                              <span className="text-sm text-muted-foreground">
                                No users assigned
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {p.users.map((u) => (
                                  <Badge
                                    key={u.id}
                                    variant="secondary"
                                    className="gap-1 bg-secondary text-secondary-foreground"
                                  >
                                    {u.email}
                                    <button
                                      onClick={() =>
                                        handleRemoveUser(p.id, u.id)
                                      }
                                      className="ml-0.5 text-muted-foreground hover:text-destructive"
                                      aria-label={`Remove ${u.email} from ${p.name}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingProject(p);
                                setEditedProjectName(p.name);
                                setEditedProjectClientId(String(p.client_id));
                              }}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProject(p.id)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {editingProject && (
        <Dialog
          open={!!editingProject}
          onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the details for project "{editingProject.name}".
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Project Name</Label>
                <Input
                  value={editedProjectName}
                  onChange={(e) => setEditedProjectName(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Client</Label>
                <Select
                  value={editedProjectClientId}
                  onValueChange={setEditedProjectClientId}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateProject}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingUser && (
        <Dialog
          open={!!editingUser}
          onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update the details for user {editingUser.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Email</Label>
                <Input
                  value={editedUserEmail}
                  onChange={(e) => setEditedUserEmail(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Password</Label>
                <Input
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editedUserPassword}
                  onChange={(e) => setEditedUserPassword(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-foreground">Role</Label>
                <Select
                  value={editedUserRole}
                  onValueChange={(v) =>
                    setEditedUserRole(v as "ADMIN" | "STANDARD")
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
