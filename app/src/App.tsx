import { Route, Routes } from "react-router";
import ScrollToHash from "./components/ScrollToHash";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";
import BoardDetail from "./routes/BoardDetail";
import Landing from "./routes/Landing";
import NotFound from "./routes/NotFound";

export default function App() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-4">
        Skip to content
      </a>
      <ScrollToHash />
      <SiteHeader />
      <main id="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/hardware/:slug" element={<BoardDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}
