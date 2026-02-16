import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import type { Project } from "../types/project";
import type { Client } from "../types/client";
import type { Instance } from "../types/instance";
import { useAuth } from "../context/useAuth";
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
import { AlertCircle, FolderOpen, Server, Users } from "lucide-react";

interface ProjectRow {
  project: Project;
  clientName: string;
  clientId: number;
  instances: Instance[];
  counts: { PRODUCTION: number; STAGING: number; DEVELOPMENT: number };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get("/projects");
        const projects: Project[] = projectsRes.data;

        let clients: Client[] = [];
        if (user?.role === "ADMIN") {
          const clientsRes = await api.get("/clients");
          clients = clientsRes.data;
        }
        const clientMap = new Map<number, string>();
        clients.forEach((c) => clientMap.set(c.id, c.name));

        const instanceResults = await Promise.all(
          projects.map((p) => api.get(`/instances?project_id=${p.id}`))
        );

        const built: ProjectRow[] = projects.map((project, idx) => {
          const instances: Instance[] = instanceResults[idx].data;
          const counts = { PRODUCTION: 0, STAGING: 0, DEVELOPMENT: 0 };
          instances.forEach((inst) => {
            if (inst.instance_type in counts) {
              counts[inst.instance_type]++;
            }
          });
          return {
            project,
            clientName:
              clientMap.get(project.client_id) ||
              `Client #${project.client_id}`,
            clientId: project.client_id,
            instances,
            counts,
          };
        });

        built.sort((a, b) => {
          if (a.clientId !== b.clientId) return a.clientId - b.clientId;
          return a.project.name.localeCompare(b.project.name);
        });

        setRows(built);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.role]);

  const allInstances = rows.flatMap((r) => r.instances);
  const totalProjects = rows.length;
  const totalInstances = allInstances.length;
  const activeInstances = allInstances.filter((i) => i.is_active).length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "ADMIN"
              ? "Overview of all clients, projects, and instances"
              : "Your assigned projects and instances"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Projects
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalProjects}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Instances
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalInstances}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Instances
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {activeInstances}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalInstances > 0
                  ? `${Math.round((activeInstances / totalInstances) * 100)}% of total`
                  : "No instances"}
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card className="border-border">
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading data...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {user?.role === "ADMIN"
                  ? "Clients & Projects"
                  : "Your Projects"}
              </CardTitle>
              <CardDescription>
                Hierarchical view of{" "}
                {user?.role === "ADMIN"
                  ? "clients, projects, and instance counts"
                  : "your projects and instance counts"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No data available.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      {user?.role === "ADMIN" && (
                        <TableHead className="text-muted-foreground">
                          Client
                        </TableHead>
                      )}
                      <TableHead className="text-muted-foreground">
                        Project
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground">
                        Production
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground">
                        Staging
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground">
                        Development
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => {
                      return (
                        <TableRow
                          key={row.project.id}
                          className="border-border hover:bg-muted/50"
                        >
                          {user?.role === "ADMIN" && (
                            <TableCell className="font-medium text-foreground">
                              {row.clientName}
                            </TableCell>
                          )}
                          <TableCell>
                            <Link
                              to={`/projects/${row.project.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {row.project.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">
                            <CountBadge
                              count={row.counts.PRODUCTION}
                              type="PRODUCTION"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <CountBadge
                              count={row.counts.STAGING}
                              type="STAGING"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <CountBadge
                              count={row.counts.DEVELOPMENT}
                              type="DEVELOPMENT"
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium text-foreground">
                            {row.instances.length}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function CountBadge({ count, type }: { count: number; type: string }) {
  if (count === 0)
    return <span className="text-sm text-muted-foreground">0</span>;

  const variant =
    type === "PRODUCTION"
      ? "bg-amber-500/10 text-amber-600"
      : type === "STAGING"
        ? "bg-blue-500/10 text-blue-600"
        : "bg-emerald-500/10 text-emerald-600";

  return (
    <span
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium ${variant}`}
    >
      {count}
    </span>
  );
}
