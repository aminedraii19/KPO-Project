import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { LoadingScreen } from "@/components/Feedback";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Events = lazy(() => import("@/pages/Events"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PlayQuiz = lazy(() => import("@/pages/PlayQuiz"));
const QuizBuilder = lazy(() => import("@/pages/QuizBuilder"));
const QuizDetails = lazy(() => import("@/pages/QuizDetails"));
const Quizzes = lazy(() => import("@/pages/Quizzes"));
const Register = lazy(() => import("@/pages/Register"));
const Settings = lazy(() => import("@/pages/Settings"));
const Students = lazy(() => import("@/pages/Students"));

export default function App() {
  return <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quizzes/new" element={<QuizBuilder />} />
        <Route path="/quizzes/:id" element={<QuizDetails />} />
        <Route path="/quizzes/:id/edit" element={<QuizBuilder />} />
        <Route path="/quizzes/:id/play" element={<PlayQuiz />} />
        <Route path="/events" element={<Events />} />
        <Route path="/students" element={<Students />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>;
}
