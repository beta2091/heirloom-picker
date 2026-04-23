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
import DraftMaster from "@/pages/draft-master";
import Results from "@/pages/results";
import OwnerPage from "@/pages/owner";
import JoinPage from "@/pages/join";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/sibling/:id" component={SiblingPage} />
      <Route path="/draft" component={Draft} />
      <Route path="/draft-master" component={DraftMaster} />
      <Route path="/results" component={Results} />
      <Route path="/owner" component={OwnerPage} />
      <Route path="/join/:token" component={JoinPage} />
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
