import { useMemo, useState } from "react";
import {
	addDays,
	formatWeekRange,
	getToday,
	getWeekEnd,
	getWeekStart,
} from "../lib/date";

export function useWeekRange() {
	const today = getToday();
	const currentWeekStart = getWeekStart(today);

	const [weekStart, setWeekStart] = useState(currentWeekStart);

	const weekEnd = useMemo(() => getWeekEnd(weekStart), [weekStart]);

	const weekLabel = useMemo(
		() => formatWeekRange(weekStart, weekEnd),
		[weekStart, weekEnd],
	);

	const isCurrentWeek = weekStart === currentWeekStart;

	const goToPrevWeek = () => {
		setWeekStart(addDays(weekStart, -7));
	};

	const goToNextWeek = () => {
		if (!isCurrentWeek) {
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
		goToPrevWeek,
		goToNextWeek,
		goToCurrentWeek,
	};
}
