import { useCallback, useEffect, useState } from "react";
import { useGuild, useGuilds } from "../api/guilds";

const STORAGE_KEY = "currentGuildId";

export function useCurrentGuild() {
	const [currentGuildId, setCurrentGuildId] = useState<string | null>(() => {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(STORAGE_KEY);
	});

	const { data: guilds, isLoading: guildsLoading } = useGuilds();
	const { data: currentGuild } = useGuild(currentGuildId || "");

	// Auto-select first guild if current selection is invalid
	useEffect(() => {
		if (guildsLoading || !guilds) return;

		// If no guilds, clear selection
		if (guilds.length === 0) {
			if (currentGuildId) {
				setCurrentGuildId(null);
				localStorage.removeItem(STORAGE_KEY);
			}
			return;
		}

		// If current selection is invalid, select first guild
		const isValidSelection = guilds.some((g) => g.id === currentGuildId);
		if (!isValidSelection) {
			const firstGuildId = guilds[0].id;
			setCurrentGuildId(firstGuildId);
			localStorage.setItem(STORAGE_KEY, firstGuildId);
		}
	}, [guilds, guildsLoading, currentGuildId]);

	const selectGuild = useCallback((guildId: string) => {
		setCurrentGuildId(guildId);
		localStorage.setItem(STORAGE_KEY, guildId);
	}, []);

	return {
		currentGuild: currentGuild || null,
		currentGuildId,
		guilds: guilds || [],
		guildsLoading,
		selectGuild,
		hasGuilds: (guilds?.length || 0) > 0,
	};
}
