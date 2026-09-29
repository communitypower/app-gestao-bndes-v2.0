import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

const ProductionPage = lazy(() => import("./pages/Production"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const HomologacaoPage = lazy(() => import("./pages/Homologacao"));
const AdministrationPage = lazy(() => import("./pages/Administration"));
const LoginPage = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-px animate-pulse bg-primary" />
        <p className="editorial-kicker mt-4 text-muted-foreground">
          Carregando seção
        </p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <DashboardLayout>
            <Suspense fallback={<RouteLoading />}>
              <Switch>
                <Route path="/" component={ProductionPage} />
                <Route path="/producao" component={ProductionPage} />
                <Route path="/atividades" component={ProductionPage} />
                <Route path="/cronograma" component={CalendarPage} />
                <Route path="/calendario" component={CalendarPage} />
                <Route path="/homologacao" component={HomologacaoPage} />
                <Route path="/administracao" component={AdministrationPage} />
                <Route path="/404" component={NotFound} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </DashboardLayout>
        </Route>
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
