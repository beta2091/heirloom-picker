import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import SiblingPage from "@/pages/sibling";
import Draft from "@/pages/draft";
import SharePage from "@/pages/share";
import ViewerPage from "@/pages/viewer";
import Results from "@/pages/results";
import OwnerPage from "@/pages/owner";
import LotteryPage from "@/pages/lottery";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/sibling/:id" component={SiblingPage} />
      <Route path="/draft" component={Draft} />
      <Route path="/results" component={Results} />
      <Route path="/share/:token" component={SharePage} />
      <Route path="/viewer/:siblingId" component={ViewerPage} />
      <Route path="/owner" component={OwnerPage} />
      <Route path="/lottery" component={LotteryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
