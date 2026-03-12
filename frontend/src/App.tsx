import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TopicList from "./pages/TopicList";
import AllPost from "./pages/AllPost";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/posts" element={<AllPost />} />
        <Route path="/topics" element={<TopicList />} />
      </Routes>
    </Router>
  );
};

export default App;
