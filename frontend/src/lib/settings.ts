import { useCallback, useEffect, useState } from "react";

export type WeekStartDay = 0 | 1; // 0 = Sunday, 1 = Monday

interface Settings {
	weekStartDay: WeekStartDay;
}

const STORAGE_KEY = "my-12-week-year-settings";

const defaultSettings: Settings = {
	weekStartDay: 1, // 預設週一開始
};

// 從 localStorage 讀取設定
function getSettings(): Settings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// 確保 weekStartDay 是有效值
			if (parsed.weekStartDay === 0 || parsed.weekStartDay === 1) {
				return { ...defaultSettings, ...parsed };
			}
		}
	} catch {
		// ignore parse errors
	}
	return defaultSettings;
}

// 儲存設定到 localStorage
function saveSettings(settings: Settings): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	// 觸發 storage 事件讓其他 tab 同步
	window.dispatchEvent(new Event("settings-change"));
}

// React hook 使用設定
export function useSettings() {
	const [settings, setSettings] = useState<Settings>(getSettings);

	useEffect(() => {
		const handleChange = () => {
			setSettings(getSettings());
		};
		window.addEventListener("settings-change", handleChange);
		window.addEventListener("storage", handleChange);
		return () => {
			window.removeEventListener("settings-change", handleChange);
			window.removeEventListener("storage", handleChange);
		};
	}, []);

	const updateSettings = useCallback((updates: Partial<Settings>) => {
		const current = getSettings();
		const newSettings = { ...current, ...updates };
		saveSettings(newSettings);
		setSettings(newSettings);
	}, []);

	return { settings, updateSettings };
}

// 取得週起始日（非 React 環境使用）
export function getWeekStartDay(): WeekStartDay {
	return getSettings().weekStartDay;
}
