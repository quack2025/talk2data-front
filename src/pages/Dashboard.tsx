import { Plus, FolderOpen, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout";

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Mis Proyectos</h1>
            <p className="text-muted-foreground">
              Gestiona tus estudios de investigación de mercados
            </p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 shadow-glow transition-smooth">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-surface border-border/50 hover:shadow-md transition-smooth">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Proyectos activos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-surface border-border/50 hover:shadow-md transition-smooth">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Análisis realizados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-surface border-border/50 hover:shadow-md transition-smooth">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">0h</p>
                <p className="text-sm text-muted-foreground">Tiempo ahorrado</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card className="border-dashed border-2 border-border bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-4">
              <FolderOpen className="h-8 w-8 text-primary-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold mb-2">
              No tienes proyectos aún
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Crea tu primer proyecto para comenzar a analizar datos SPSS con
              inteligencia artificial. Es rápido y fácil.
            </p>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow transition-smooth">
              <Plus className="mr-2 h-4 w-4" />
              Crear primer proyecto
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
