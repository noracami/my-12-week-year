import { useMemo, useState } from "react";
import {
	addDays,
	formatWeekRange,
	getToday,
	getWeekEnd,
	getWeekStart,
} from "../lib/date";

interface UseWeekRangeOptions {
	allowFutureWeeks?: number; // 允許前往未來幾週，預設 0
}

export function useWeekRange(options: UseWeekRangeOptions = {}) {
	const { allowFutureWeeks = 0 } = options;

	const today = getToday();
	const currentWeekStart = getWeekStart(today);

	const [weekStart, setWeekStart] = useState(currentWeekStart);

	const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

	const weekLabel = useMemo(
		() => formatWeekRange(weekStart, weekEnd),
		[weekStart, weekEnd],
	);

	const isCurrentWeek = weekStart === currentWeekStart;

	// 計算最遠可以前往的未來週
	const maxFutureWeekStart = useMemo(
		() => addDays(currentWeekStart, allowFutureWeeks * 7),
		[currentWeekStart, allowFutureWeeks],
	);

	const canGoNext = weekStart < maxFutureWeekStart;
	const isNextWeek = weekStart === addDays(currentWeekStart, 7);

	const goToPrevWeek = () => {
		setWeekStart(addDays(weekStart, -7));
	};

	const goToNextWeek = () => {
		if (canGoNext) {
			setWeekStart(addDays(weekStart, 7));
		}
	};

	const goToCurrentWeek = () => {
		setWeekStart(currentWeekStart);
	};

	return {
		startDate: weekStart,
		endDate: weekEnd,
		weekLabel,
		isCurrentWeek,
		isNextWeek,
		canGoNext,
		goToPrevWeek,
		goToNextWeek,
		goToCurrentWeek,
	};
}
