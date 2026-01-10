import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { queryClient } from "./api/queryClient";
import { Layout } from "./components/layout/Layout";
import { DailyPage } from "./pages/DailyPage";
import { GuildPage } from "./pages/GuildPage";
import { HelpPage } from "./pages/HelpPage";
import { Login } from "./pages/Login";
import { MemberScorePage } from "./pages/MemberScorePage";
import { QuartersPage } from "./pages/QuartersPage";
import { ScorePage } from "./pages/ScorePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SharePage } from "./pages/SharePage";
import { TacticsPage } from "./pages/TacticsPage";

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/help" element={<HelpPage />} />
					<Route path="/share/:id" element={<SharePage />} />
					<Route path="/share" element={<SharePage />} />
					<Route element={<Layout />}>
						<Route path="/" element={<DailyPage />} />
						<Route path="/tactics" element={<TacticsPage />} />
						<Route path="/score" element={<ScorePage />} />
						<Route path="/quarters" element={<QuartersPage />} />
						<Route path="/settings" element={<SettingsPage />} />
						<Route path="/guilds/:id" element={<GuildPage />} />
						<Route
							path="/guilds/:guildId/members/:userId"
							element={<MemberScorePage />}
						/>
					</Route>
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	);
}

export default App;
