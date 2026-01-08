import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { queryClient } from "./api/queryClient";
import { Layout } from "./components/layout/Layout";
import { DailyPage } from "./pages/DailyPage";
import { Login } from "./pages/Login";
import { ScorePage } from "./pages/ScorePage";
import { TacticsPage } from "./pages/TacticsPage";

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route element={<Layout />}>
						<Route path="/" element={<DailyPage />} />
						<Route path="/tactics" element={<TacticsPage />} />
						<Route path="/score" element={<ScorePage />} />
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
