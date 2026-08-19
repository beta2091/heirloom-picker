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
import Account from "@/pages/account";
import ResetPassword from "@/pages/reset-password";
import LotteryPage from "@/pages/lottery";
import SharePage from "@/pages/share";
import { PrivacyPage, TermsPage, NotAWillPage } from "@/pages/legal";
import HowItWorksPage from "@/pages/how-it-works";
import ForFamiliesPage from "@/pages/for-families";
import ForProfessionalsPage from "@/pages/for-professionals";
import DemoPage from "@/pages/demo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/for-families" component={ForFamiliesPage} />
      <Route path="/for-professionals" component={ForProfessionalsPage} />
      <Route path="/demo" component={DemoPage} />
      <Route path="/account" component={Account} />
      <Route path="/login" component={Account} />
      <Route path="/signup" component={Account} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/legal" component={NotAWillPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/sibling/:id" component={SiblingPage} />
      <Route path="/draft" component={Draft} />
      <Route path="/draft-master" component={DraftMaster} />
      <Route path="/results" component={Results} />
      <Route path="/lottery" component={LotteryPage} />
      <Route path="/share/:token" component={SharePage} />
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
